import SCHELLING_COMPUTE_SHADER from './SchellingModelShader.wgsl?raw';
import SCHELLING_PARALLEL_COMPUTE_SHADER from './SchellingParallelModelShader.wgsl?raw';
import { EMPTY_VALUE } from 'webgpu-react-bitmap-viewport';
import { SchellingSegregationModel } from './SchellingSegregationModel';
import { SchellingSegregationKernel } from './SchellingSegregationKernel';

const WORKGROUP_SIZE = { x: 8, y: 8 };

export class SchellingSegregationKernelGPU extends SchellingSegregationKernel {
  device: GPUDevice;
  parallel: boolean;

  paramBuffer: GPUBuffer;

  randomTable!: Float32Array;
  gridBuffer!: GPUBuffer;
  emptyGridIndicesBuffer!: GPUBuffer;
  randomTableBuffer!: GPUBuffer;
  readerGridBuffer!: GPUBuffer;

  computePipeline: GPUComputePipeline;
  bindGroup!: GPUBindGroup;

  constructor(
    model: SchellingSegregationModel,
    device: GPUDevice,
    numEmptyGrids: number,
    parallel: boolean,
  ) {
    super(model);
    this.device = device;
    this.parallel = parallel;

    const gridSize = model.gridSize;

    this.paramBuffer = device.createBuffer({
      label: 'S:ParamBuffer:' + gridSize,
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(
      this.paramBuffer,
      0,
      new Uint32Array([gridSize, gridSize, numEmptyGrids]),
    );
    device.queue.writeBuffer(
      this.paramBuffer,
      12,
      new Float32Array([model.tolerance]),
    );

    this.prepareBuffers(0, gridSize);
    this.writeGridDataBuffer();
    this.writeEmptyGridIndicesBuffer();

    this.computePipeline = this.device.createComputePipeline({
      label: 'S:SchellingComputePipeline:' + gridSize,
      layout: 'auto',
      compute: {
        module: this.device.createShaderModule({
          label: 'SchellingModelShader',
          code: this.parallel
            ? SCHELLING_PARALLEL_COMPUTE_SHADER
            : SCHELLING_COMPUTE_SHADER,
        }),
        constants: this.parallel
          ? {
              EMPTY_VALUE: EMPTY_VALUE,
              workgroupSizeX: WORKGROUP_SIZE.x,
              workgroupSizeY: WORKGROUP_SIZE.y,
            }
          : {
              EMPTY_VALUE: EMPTY_VALUE,
            },
        entryPoint: 'main',
      },
    });

    this.prepareBindGroup();
  }

  prepareBindGroup() {
    this.bindGroup = this.device.createBindGroup({
      label: 'S:SchellingBindGroup:' + this.model.gridSize,
      layout: this.computePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 6, resource: { buffer: this.gridBuffer } },
        { binding: 7, resource: { buffer: this.paramBuffer } },
        { binding: 8, resource: { buffer: this.randomTableBuffer } }, // 乱数表のバッファ
        { binding: 9, resource: { buffer: this.emptyGridIndicesBuffer } }, // 空き地インデックスのバッファ
      ],
    });
  }

  updateInitialStateGridData(
    agentTypeShares: number[],
    agentTypeCumulativeShares: number[],
  ) {
    const numEmptyGrids = this.model.updateInitialStateGridData(
      agentTypeShares,
      agentTypeCumulativeShares,
    );
    this.device.queue.writeBuffer(
      this.paramBuffer,
      8,
      new Uint32Array([numEmptyGrids]),
    );
  }

  private destroyBuffers() {
    this.gridBuffer?.destroy();
    this.emptyGridIndicesBuffer?.destroy();
    this.randomTableBuffer?.destroy();
    this.readerGridBuffer?.destroy();
  }

  private prepareBuffers(prevGridSize: number, gridSize: number) {
    if (prevGridSize !== 0 && prevGridSize !== gridSize) {
      this.destroyBuffers();
    }

    const device = this.device;
    const model = this.model;
    const numCells = gridSize * gridSize;

    this.randomTable = new Float32Array(numCells); // ステップごとに1つの乱数を使用する仮定

    // 空き地インデックスのGPUバッファを作成
    this.emptyGridIndicesBuffer = device.createBuffer({
      label: 'S:EmptyCellsBuffer:' + gridSize,
      size: numCells * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    // グリッドバッファの初期化
    this.gridBuffer = device.createBuffer({
      label: 'S:GridBuffer:' + gridSize,
      size: model.gridData.byteLength,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
    });

    /*
    const nextGridBuffer = device.createBuffer({
      label: 'S:NextGridBuffer',
      size: modelRef.current.gridData.byteLength,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
    });
    device.queue.writeBuffer(nextGridBuffer, 0, modelRef.current.gridData.buffer);
     */

    // 乱数表のGPUバッファを作成
    this.randomTableBuffer = device.createBuffer({
      label: 'S:RandomTableBuffer:' + gridSize,
      size: numCells * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    this.readerGridBuffer = device.createBuffer({
      label: 'S:RetGridBuffer:' + gridSize,
      size: model.gridData.byteLength,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      mappedAtCreation: false,
    });

    device.queue.writeBuffer(
      this.paramBuffer,
      0,
      new Uint32Array([gridSize, gridSize]),
    );
  }

  private writeGridDataBuffer() {
    this.device.queue.writeBuffer(
      this.gridBuffer,
      0,
      this.model.gridData.buffer,
    );
  }
  private writeEmptyGridIndicesBuffer() {
    this.device.queue.writeBuffer(
      this.emptyGridIndicesBuffer,
      0,
      this.model.emptyGridIndices,
    );
  }

  setGridSize(gridSize: number) {
    const prevGridSize = this.model.gridSize;
    this.model.setGridSize(gridSize);
    this.prepareBuffers(prevGridSize, gridSize);
    this.writeGridDataBuffer();
    this.writeEmptyGridIndicesBuffer();
    this.prepareBindGroup();
  }

  sync() {
    this.writeGridDataBuffer();
    this.writeEmptyGridIndicesBuffer();
  }

  setTolerance(newTolerance: number) {
    this.device.queue.writeBuffer(
      this.paramBuffer,
      12,
      new Float32Array([newTolerance]),
    );
  }

  /*
  const setGridData = (gridData: Uint32Array) => {
    if (!device) {
      throw new Error();
    }
    device.queue.writeBuffer(gridBuffer, 0, gridData.buffer);
  };
   */

  private writeRandomTableBuffer() {
    for (let i = 0; i < this.model.gridSize * this.model.gridSize; i++) {
      this.randomTable[i] = Math.random();
    }
    this.device?.queue.writeBuffer(
      this.randomTableBuffer,
      0,
      this.randomTable.buffer,
      this.randomTable.byteLength,
    );
  }

  private createCommandBuffer(
    pipeline: GPUComputePipeline,
    bindGroup: GPUBindGroup,
  ) {
    const commandEncoder = this.device.createCommandEncoder({
      label: 'gridSize: ' + this.model.gridSize,
    });
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);

    if (this.parallel) {
      passEncoder.dispatchWorkgroups(
        Math.ceil(this.model.gridSize / WORKGROUP_SIZE.x),
        Math.ceil(this.model.gridSize / WORKGROUP_SIZE.y),
      );
    } else {
      passEncoder.dispatchWorkgroups(1);
    }
    passEncoder.end();
    return commandEncoder.finish();
  }

  async updateGridData(): Promise<Uint32Array> {
    this.writeRandomTableBuffer();
    const commandBuffer = this.createCommandBuffer(
      this.computePipeline,
      this.bindGroup,
    );
    this.device.queue.submit([commandBuffer]);

    const copyEncoder = this.device.createCommandEncoder();
    copyEncoder.copyBufferToBuffer(
      this.gridBuffer,
      0,
      this.readerGridBuffer,
      0,
      this.model.gridData.byteLength,
    );
    this.device.queue.submit([copyEncoder.finish()]);
    await this.readerGridBuffer.mapAsync(GPUMapMode.READ);
    this.model.gridData.set(
      new Uint32Array(this.readerGridBuffer.getMappedRange()),
    );
    this.readerGridBuffer.unmap();

    return this.model.gridData;
  }
}
