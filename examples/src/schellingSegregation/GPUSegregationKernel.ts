import { EMPTY_VALUE } from 'webgpu-react-bitmap-viewport';
import { SegregationUIState } from './SegregationUIState';
import { GPUSegregationKernelData } from './GPUSegregationKernelData';
import { JSSegregationKernel } from './JSSegregationKernel';
import { shuffleUint32Array, sortUint32ArrayRange } from './utils/arrayUtil';
// @ts-ignore
import shader from './GPUSegregationKernel.wgsl?raw';
//import shader from './GPUSegregationKernel2.wgsl?raw';
import { replaceConstValue } from './utils/shaderUtil';
import seedrandom from 'seedrandom';

enum USE_GPU {
  CONVOLUTION = 2 ^ 0,
  SHUFFLE = 2 ^ 1,
  REDUCE = 2 ^ 2,
  SWAP = 2 ^ 3,
}

export class GPUSegregationKernel extends JSSegregationKernel {
  protected gpuData!: GPUSegregationKernelData;
  protected device: GPUDevice;
  protected workgroupSizeMax: number;

  protected paramsBuffer: GPUBuffer;
  protected gridBuffer!: GPUBuffer;
  protected randomBuffer!: GPUBuffer;
  protected emptyCellIndicesBuffer!: GPUBuffer;
  protected agentIndicesBuffer!: GPUBuffer;
  protected agentIndicesLengthBuffer!: GPUBuffer;
  protected movingAgentIndicesBuffer!: GPUBuffer;

  protected targetBuffers!: Map<string, GPUBuffer>;

  protected bindGroupLayout: GPUBindGroupLayout;
  protected computePipelines!: Array<GPUComputePipeline>;
  protected bindGroup!: GPUBindGroup;

  protected toleranceArray = new Float32Array(1);
  protected mode: number;

  constructor(
    uiState: SegregationUIState,
    seed: string | undefined,
    device: GPUDevice,
    workgroupSizeMax: number,
  ) {
    super(uiState, seed);
    this.device = device;
    this.workgroupSizeMax = workgroupSizeMax;
    this.targetBuffers = new Map();
    this.paramsBuffer = this.device.createBuffer({
      label: 'paramsBuffer',
      size: Uint32Array.BYTES_PER_ELEMENT + Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Create a bind group layout
    this.bindGroupLayout = this.createBindGroupLayout();

    //mode = USE_GPU.REDUCE |  USE_GPU.SHUFFLE | USE_GPU.SWAP;
    this.mode = USE_GPU.CONVOLUTION;
  }

  setTolerance(newTolerance: number) {
    this.toleranceArray[0] = newTolerance;
    this.device.queue.writeBuffer(
      this.paramsBuffer,
      0,
      this.toleranceArray,
      0,
      this.toleranceArray.length,
    );
  }

  updateGridSize(
    width: number,
    height: number,
    agentShares: number[],
    tolerance: number,
  ) {
    super.updateGridSize(width, height, agentShares, tolerance);
    this.setTolerance(tolerance);
    const totalCells = width * height;
    this.data.emptyCellIndices = new Uint32Array(totalCells + 1); // last item is length of the array body
    this.data.movingAgentIndices = new Uint32Array(totalCells + 1); // last item is length of the array body

    this.randomBuffer && this.randomBuffer.destroy();
    this.gridBuffer && this.gridBuffer.destroy();

    this.emptyCellIndicesBuffer && this.emptyCellIndicesBuffer.destroy();
    this.agentIndicesBuffer && this.agentIndicesBuffer.destroy();
    this.agentIndicesLengthBuffer && this.agentIndicesLengthBuffer.destroy();
    this.movingAgentIndicesBuffer && this.movingAgentIndicesBuffer.destroy();

    Object.keys(this.targetBuffers).forEach((key) => {
      this.targetBuffers.get(key)?.destroy();
    });

    this.gpuData = new GPUSegregationKernelData(
      width,
      height,
      this.workgroupSizeMax,
    );

    this.randomBuffer = this.device.createBuffer({
      label: 'randomBuffer',
      size: totalCells * Uint32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    // Create GPUBuffer for input grid data
    this.gridBuffer = this.device.createBuffer({
      label: 'gridBuffer',
      size: totalCells * Uint32Array.BYTES_PER_ELEMENT,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_SRC |
        GPUBufferUsage.COPY_DST,
    });

    this.emptyCellIndicesBuffer = this.device.createBuffer({
      label: 'emptyCellIndicesBuffer',
      size: (totalCells + 1) * Uint32Array.BYTES_PER_ELEMENT,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_SRC |
        GPUBufferUsage.COPY_DST,
    });

    const totalItems = this.gpuData.workgroupSize * this.gpuData.dispatchSize;
    // Create GPUBuffer for output data (agentIndices, agentIndicesLength)
    this.agentIndicesBuffer = this.device.createBuffer({
      label: 'agentIndicesBuffer',
      size: (totalCells + 1) * Uint32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });
    this.agentIndicesLengthBuffer = this.device.createBuffer({
      label: 'agentIndicesLengthBuffer',
      size: totalItems * Uint32Array.BYTES_PER_ELEMENT,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
    });
    this.movingAgentIndicesBuffer = this.device.createBuffer({
      label: 'movingAgentIndicesBuffer',
      size: (totalCells + 1) * Uint32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    this.targetBuffers.set(
      'cells',
      this.device.createBuffer({
        label: 'cells',
        size: totalCells * Uint32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
      }),
    );
    this.targetBuffers.set(
      'cells+1',
      this.device.createBuffer({
        label: 'cells+1',
        size: (totalCells + 1) * Uint32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
      }),
    );
    this.targetBuffers.set(
      'workItems',
      this.device.createBuffer({
        label: 'workItems',
        size: (totalCells + 1) * Uint32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
      }),
    );

    this.bindGroup = this.createBindGroup(this.bindGroupLayout);

    const mooreNeighborhoodRange = 5;
    const mooreNeighborhoodSize = mooreNeighborhoodRange * 2 + 1;
    const workgroupSize = this.gpuData.workgroupSize;
    const dispatchSize = this.gpuData.dispatchSize;
    const blockWidth = this.getBlockWidth();
    const blockHeight = this.getBlockHeight();
    const blockSize = blockWidth * blockHeight;
    const blockWidthWithGhostZone = blockWidth + mooreNeighborhoodRange * 2;

    const replacement = {
      width: this.data.width,
      height: this.data.height,
      blockWidth,
      blockHeight,
      blockSize,
      mooreNeighborhoodRange,
      mooreNeighborhoodSize,
      blockWidthWithGhostZone,
      workgroupSize,
      dispatchSize,
      EMPTY_VALUE,
    };

    const modifiedShaderCode = replaceConstValue(shader, replacement);
    const computeShaderModule = this.device.createShaderModule({
      code: modifiedShaderCode,
    });

    // Set up compute pipeline
    this.computePipelines = [
      {
        label: 'pipeline0',
        entryPoint: 'main0',
      },
      {
        label: 'pipeline1',
        entryPoint: 'main1',
      },
      {
        label: 'pipeline2',
        entryPoint: 'main2',
      },
      {
        label: 'pipeline3',
        entryPoint: 'main3',
      },
      {
        label: 'pipeline4',
        entryPoint: 'main4',
      },
    ].map(({ label, entryPoint }) =>
      this.device.createComputePipeline({
        label,
        layout: this.device.createPipelineLayout({
          bindGroupLayouts: [this.bindGroupLayout],
        }),
        compute: {
          module: computeShaderModule,
          entryPoint,
        },
      }),
    );
  }

  syncGridContent(grid: Uint32Array) {
    super.syncGridContent(grid);
    this.device.queue.writeBuffer(this.gridBuffer, 0, this.data.grid);
    this.updateEmptyCellIndices();

    this.data.emptyCellIndices[this.data.emptyCellIndices.length - 1] =
      this.data.emptyCellIndicesLength;
    this.device.queue.writeBuffer(
      this.emptyCellIndicesBuffer,
      0,
      this.data.emptyCellIndices,
    );
  }

  updateEmptyCellIndices() {
    super.updateEmptyCellIndices(this.data.emptyCellIndices);
  }
  private getBlockWidth = () => {
    return Math.ceil(this.data.width / this.gpuData.dispatchSize);
  };
  private getBlockHeight = () => {
    return Math.ceil(this.data.height / this.gpuData.workgroupSize);
  };

  private updateRandomBuffer = (
    size: number,
    rng?: seedrandom.PRNG,
  ): ArrayBufferLike => {
    const base = this.data.width * this.data.height - size;
    const random = rng ? rng : Math.random;
    for (let i = 0; i < size; i++) {
      this.gpuData.random[i] = random();
      this.gpuData.random[base + i] = random();
    }
    return this.gpuData.random.buffer;
  };

  async debugUint32(label: string, gpuBuffer: GPUBuffer, arrayLength: number) {
    const debugData = new Uint32Array(arrayLength);
    await this.copyBufferToUint32Array(gpuBuffer, debugData);
    console.log(label, debugData);
  }

  async debugFloat32(label: string, gpuBuffer: GPUBuffer, arrayLength: number) {
    const debugData = new Float32Array(arrayLength);
    await this.copyBufferToFloat32Array(gpuBuffer, debugData);
    console.log(label, debugData);
  }

  private createCommandBuffer(
    computePipeline: GPUComputePipeline,
    dispatchSize: number,
  ) {
    const commandEncoder = this.device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(computePipeline);
    passEncoder.setBindGroup(0, this.bindGroup);
    passEncoder.dispatchWorkgroups(dispatchSize);
    passEncoder.end();
    return commandEncoder.finish();
  }

  private reduceIndicesArray(
    agentIndicesArray: Uint32Array,
    agentIndicesLengthArray: Uint32Array,
    movingAgentIndices: Uint32Array,
  ): number {
    let movingAgentIndicesLength = 0;
    const blockSize = this.getBlockWidth() * this.getBlockHeight();
    for (
      let blockIndex = 0;
      blockIndex < agentIndicesLengthArray.length;
      blockIndex++
    ) {
      for (let i = 0; i < agentIndicesLengthArray[blockIndex]; i++) {
        movingAgentIndices[movingAgentIndicesLength] =
          agentIndicesArray[blockIndex * blockSize + i];
        movingAgentIndicesLength++;
      }
    }
    return movingAgentIndicesLength;
  }

  async tick(): Promise<Uint32Array> {
    const command0 = this.createCommandBuffer(
      this.computePipelines[0],
      this.gpuData.dispatchSize,
    ); // convolution

    if (this.mode & USE_GPU.REDUCE) {
      const command1 = this.createCommandBuffer(this.computePipelines[1], 1); // totalize
      const command2 = this.createCommandBuffer(
        this.computePipelines[2],
        this.gpuData.dispatchSize,
      ); // reduce

      if (this.mode & USE_GPU.SHUFFLE) {
        const command3 = this.createCommandBuffer(this.computePipelines[3], 1); // shuffle

        this.updateRandomBuffer(this.data.width * this.data.height, this.rng);
        this.device.queue.writeBuffer(
          this.randomBuffer,
          0,
          this.gpuData.random,
        );
        if (this.mode & USE_GPU.SWAP) {
          const command4 = this.createCommandBuffer(
            this.computePipelines[4],
            this.gpuData.dispatchSize,
          );
          this.device.queue.submit([
            command0,
            command1,
            command2,
            command3,
            command4,
          ]);
          await this.device.queue.onSubmittedWorkDone();
        } else {
          this.device.queue.submit([command0, command1, command2, command3]);
          await this.device.queue.onSubmittedWorkDone();
          this.moveAgentAndSwapEmptyCell(
            this.data.grid,
            this.data.emptyCellIndices,
            this.data.emptyCellIndicesLength,
            this.data.movingAgentIndices,
            this.data.movingAgentIndicesLength,
          );
        }
        this.device.queue.writeBuffer(this.gridBuffer, 0, this.data.grid);
      } else {
        this.device.queue.submit([command0, command1, command2]);
        await this.device.queue.onSubmittedWorkDone();
        const movingAgentLengthArray = new Uint32Array(1);
        await this.copyBufferToUint32Array(
          this.movingAgentIndicesBuffer,
          movingAgentLengthArray,
          this.targetBuffers.get('workItems'),
          this.data.movingAgentIndices.byteLength -
            Uint32Array.BYTES_PER_ELEMENT,
          Uint32Array.BYTES_PER_ELEMENT,
        );
        const movingAgentIndicesLength = movingAgentLengthArray[0];

        this.moveAgentAndSwapEmptyCell(
          this.data.grid,
          this.data.emptyCellIndices,
          this.data.emptyCellIndicesLength,
          this.data.movingAgentIndices,
          movingAgentIndicesLength,
        );
        this.device.queue.writeBuffer(this.gridBuffer, 0, this.data.grid);
      }
    } else {
      const sources = [
        {
          key: 'cells',
          source: this.agentIndicesBuffer,
          size:
            this.data.width * this.data.height * Uint32Array.BYTES_PER_ELEMENT,
          target: this.gpuData.agentIndices,
        },
        {
          key: 'workItems',
          source: this.agentIndicesLengthBuffer,
          size:
            this.gpuData.workgroupSize *
            this.gpuData.dispatchSize *
            Uint32Array.BYTES_PER_ELEMENT,
          target: this.gpuData.agentIndicesLength,
        },
      ];

      const copyEncoders = sources.map((entry) => {
        const commandEncoder = this.device.createCommandEncoder();
        commandEncoder.copyBufferToBuffer(
          entry.source,
          0,
          this.targetBuffers.get(entry.key)!,
          0,
          entry.size,
        );
        return commandEncoder.finish();
      });

      this.device.queue.submit([command0, ...copyEncoders]);
      await this.device.queue.onSubmittedWorkDone();
      await Promise.all(
        sources.map(async (entry) => {
          const targetBuffer = this.targetBuffers.get(entry.key);
          if (!targetBuffer) {
            throw new Error();
          }
          await targetBuffer.mapAsync(GPUMapMode.READ);
          entry.target.set(
            new Uint32Array(targetBuffer.getMappedRange(0, entry.size)),
          );
          targetBuffer.unmap();
        }),
      );
      this.data.movingAgentIndicesLength = this.reduceIndicesArray(
        this.gpuData.agentIndices,
        this.gpuData.agentIndicesLength,
        this.data.movingAgentIndices,
      );

      if (this.rng) {
        sortUint32ArrayRange(
          this.data.movingAgentIndices,
          0,
          this.data.movingAgentIndicesLength,
        );
        console.log(this.data.movingAgentIndices);
      }

      shuffleUint32Array(
        this.data.emptyCellIndices,
        this.data.emptyCellIndicesLength,
        this.rng,
      );
      shuffleUint32Array(
        this.data.movingAgentIndices,
        this.data.movingAgentIndicesLength,
        this.rng,
      );

      this.moveAgentAndSwapEmptyCell(
        this.data.grid,
        this.data.emptyCellIndices,
        this.data.emptyCellIndicesLength,
        this.data.movingAgentIndices,
        this.data.movingAgentIndicesLength,
      );
      this.device.queue.writeBuffer(this.gridBuffer, 0, this.data.grid);
    }

    return this.data.grid;
  }

  private createBindGroupLayout() {
    const types: Array<'uniform' | 'storage' | 'read-only-storage'> = [
      'uniform',
      'read-only-storage',
      'storage',
      'storage',
      'storage',
      'storage',
      'storage',
    ];
    return this.device.createBindGroupLayout({
      entries: types.map((type, index) => {
        return {
          binding: index,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {
            type,
          },
        };
      }),
    });
  }

  private createBindGroup(bindGroupLayout: GPUBindGroupLayout) {
    return this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            label: 'params',
            buffer: this.paramsBuffer,
          },
        },
        {
          binding: 1,
          resource: {
            label: 'random',
            buffer: this.randomBuffer,
          },
        },
        {
          binding: 2,
          resource: {
            label: 'grid',
            buffer: this.gridBuffer,
          },
        },
        {
          binding: 3,
          resource: {
            label: 'emptyIndices',
            buffer: this.emptyCellIndicesBuffer,
          },
        },
        {
          binding: 4,
          resource: {
            label: 'agentIndices',
            buffer: this.agentIndicesBuffer,
          },
        },
        {
          binding: 5,
          resource: {
            label: 'agentIndicesLength',
            buffer: this.agentIndicesLengthBuffer,
          },
        },
        {
          binding: 6,
          resource: {
            label: 'movingAgentIndices',
            buffer: this.movingAgentIndicesBuffer,
          },
        },
      ],
    });
  }

  private async copyBufferToUint32Array(
    sourceBuffer: GPUBuffer,
    array: Uint32Array,
    _targetBuffer?: GPUBuffer,
    offset = 0,
    size = array.byteLength,
  ) {
    const targetBuffer: GPUBuffer =
      _targetBuffer ||
      this.device.createBuffer({
        size: array.byteLength,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      });
    const copyEncoder = this.device.createCommandEncoder();
    copyEncoder.copyBufferToBuffer(sourceBuffer, offset, targetBuffer, 0, size);
    this.device.queue.submit([copyEncoder.finish()]);
    await this.device.queue.onSubmittedWorkDone();
    await targetBuffer.mapAsync(GPUMapMode.READ);
    array.set(new Uint32Array(targetBuffer.getMappedRange(0, size)));
    await this.device.queue.onSubmittedWorkDone();

    targetBuffer.unmap();
    if (!_targetBuffer) {
      targetBuffer.destroy();
    }
  }

  private async copyBufferToFloat32Array(
    sourceBuffer: GPUBuffer,
    array: Float32Array,
    _targetBuffer?: GPUBuffer,
  ) {
    const targetBuffer: GPUBuffer =
      _targetBuffer ||
      this.device.createBuffer({
        size: array.byteLength,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      });
    const copyEncoder = this.device.createCommandEncoder();
    copyEncoder.copyBufferToBuffer(
      sourceBuffer,
      0,
      targetBuffer,
      0,
      array.byteLength,
    );
    this.device.queue.submit([copyEncoder.finish()]);
    await this.device.queue.onSubmittedWorkDone();
    await targetBuffer.mapAsync(GPUMapMode.READ);
    array.set(new Float32Array(targetBuffer.getMappedRange()));

    targetBuffer.unmap();
    if (!_targetBuffer) {
      targetBuffer.destroy();
    }
  }
}
