import { EMPTY_VALUE } from 'webgpu-react-bitmap-viewport';
import { SegregationUIState } from './SegregationUIState';
import { GPUSegregationKernelData } from './GPUSegregationKernelData';
import { JSSegregationKernel } from './JSSegregationKernel';
import { sortUint32ArrayRange } from './utils/arrayUtil';

// @ts-ignore
import shader from './GPUSegregationKernel.wgsl?raw';
import { replaceConstValue } from './utils/shaderUtil';
import { shuffleUint32ArrayWithSeed } from './utils/shuffleUtil';

enum USE_GPU {
  CONVOLUTION = 2 << 0,
  REDUCE = 2 << 1,
}

export class GPUSegregationKernel extends JSSegregationKernel {
  protected gpuData!: GPUSegregationKernelData;
  protected device: GPUDevice;
  protected workgroupSizeMax: number;

  protected paramsBuffer: GPUBuffer;
  protected gridBuffer!: GPUBuffer;

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
    this.targetBuffers = new Map<string, GPUBuffer>();
    this.paramsBuffer = this.device.createBuffer({
      label: 'paramsBuffer',
      size: Uint32Array.BYTES_PER_ELEMENT + Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.bindGroupLayout = this.createBindGroupLayout();
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

  createKernelData(width: number, height: number) {
    return new GPUSegregationKernelData(width, height, this.workgroupSizeMax);
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

    this.gridBuffer && this.gridBuffer.destroy();

    this.emptyCellIndicesBuffer && this.emptyCellIndicesBuffer.destroy();
    this.agentIndicesBuffer && this.agentIndicesBuffer.destroy();
    this.agentIndicesLengthBuffer && this.agentIndicesLengthBuffer.destroy();
    this.movingAgentIndicesBuffer && this.movingAgentIndicesBuffer.destroy();

    Object.keys(this.targetBuffers).forEach((key) => {
      this.targetBuffers.get(key)?.destroy();
    });

    this.gpuData = this.createKernelData(width, height);

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

    const mooreNeighborhoodRange = 1;
    const mooreNeighborhoodSize = mooreNeighborhoodRange * 2 + 1;
    const workgroupSize = this.gpuData.workgroupSize;
    const dispatchSize = this.gpuData.dispatchSize;
    const blockWidth = this.gpuData.blockWidth;
    const blockHeight = this.gpuData.blockHeight;
    const blockSize = this.gpuData.blockSize;
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

    this.computePipelines = [
      {
        label: 'pipeline0',
        entryPoint: 'main0',
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

  getGridImpl(): Uint32Array | GPUBuffer {
    return this.gridBuffer;
  }

  setGridContent(grid: Uint32Array) {
    super.setGridContent(grid);
    this.device.queue.writeBuffer(this.gridBuffer, 0, grid);
  }

  updateEmptyCellIndices() {
    super.updateEmptyCellIndices();
    this.data.emptyCellIndices[this.data.emptyCellIndices.length - 1] =
      this.data.emptyCellIndicesLength;
    this.device.queue.writeBuffer(
      this.emptyCellIndicesBuffer,
      0,
      this.data.emptyCellIndices,
    );
    this.device.queue.writeBuffer(this.gridBuffer, 0, this.data.grid);
  }

  protected createCommandBuffer(
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
    for (
      let blockIndex = 0;
      blockIndex < agentIndicesLengthArray.length;
      blockIndex++
    ) {
      for (let i = 0; i < agentIndicesLengthArray[blockIndex]; i++) {
        movingAgentIndices[movingAgentIndicesLength] =
          agentIndicesArray[blockIndex * this.gpuData.blockSize + i];
        movingAgentIndicesLength++;
      }
    }
    return movingAgentIndicesLength;
  }

  private createBindGroupLayout() {
    const types: Array<'uniform' | 'storage' | 'read-only-storage'> = [
      'uniform',
      'read-only-storage',
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
            label: 'grid',
            buffer: this.gridBuffer,
          },
        },
        {
          binding: 2,
          resource: {
            label: 'agentIndices',
            buffer: this.agentIndicesBuffer,
          },
        },
        {
          binding: 3,
          resource: {
            label: 'agentIndicesLength',
            buffer: this.agentIndicesLengthBuffer,
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

  async tick(): Promise<void> {
    const command0 = this.createCommandBuffer(
      this.computePipelines[0],
      this.gpuData.dispatchSize,
    ); // process convolution

    if (this.mode & USE_GPU.REDUCE) {
      this.device.queue.writeBuffer(this.gridBuffer, 0, this.data.grid);

      const command1 = this.createCommandBuffer(this.computePipelines[1], 1); // totalize
      const command2 = this.createCommandBuffer(
        this.computePipelines[2],
        this.gpuData.dispatchSize,
      ); // reduce

      this.device.queue.submit([command0, command1, command2]);
      await this.device.queue.onSubmittedWorkDone();
      const movingAgentLengthArray = new Uint32Array(1);
      await this.copyBufferToUint32Array(
        this.movingAgentIndicesBuffer,
        movingAgentLengthArray,
        this.targetBuffers.get('workItems'),
        this.data.movingAgentIndices.byteLength - Uint32Array.BYTES_PER_ELEMENT,
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
    } else {
      this.device.queue.writeBuffer(this.gridBuffer, 0, this.data.grid);

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
      }

      shuffleUint32ArrayWithSeed(
        this.data.emptyCellIndices,
        this.data.emptyCellIndicesLength,
        this.rng,
      );
      shuffleUint32ArrayWithSeed(
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
    }

    return;
  }
}