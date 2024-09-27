import SCHELLING_PARALLEL_COMPUTE_SHADER from './SchellingSegregationShader.wgsl?raw';
import { EMPTY_VALUE } from 'webgpu-react-bitmap-viewport';
import { SchellingSegregationModel } from './SchellingSegregationModel';
import { SchellingSegregationKernel } from './SchellingSegregationKernel';
import { shuffle } from './gridUtils';

const WORKGROUP_SIZE = { x: 8, y: 8 };

export class SchellingSegregationKernelGPU extends SchellingSegregationKernel {
  device: GPUDevice;

  paramBuffer: GPUBuffer;

  randomTable!: Float32Array;
  gridBuffer!: GPUBuffer;
  emptyCellIndicesBuffer!: GPUBuffer;
  randomSegmentIndicesBuffer!: GPUBuffer;
  randomTableBuffer!: GPUBuffer;
  readerGridBuffer!: GPUBuffer;

  computePipeline: GPUComputePipeline;
  bindGroup!: GPUBindGroup;

  constructor(
    model: SchellingSegregationModel,
    device: GPUDevice,
    numEmptyCells: number,
  ) {
    super(model);
    this.device = device;

    const gridSize = model.gridSize;

    this.paramBuffer = device.createBuffer({
      label: 'S:ParamBuffer:' + gridSize,
      size: 12,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.randomSegmentIndicesBuffer = device.createBuffer({
      label: 'S:RandomSegmentIndicesBuffer:' + gridSize,
      size: 16 * 16 * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(
      this.paramBuffer,
      0,
      new Uint32Array([gridSize, gridSize]),
    );
    device.queue.writeBuffer(
      this.paramBuffer,
      8,
      new Float32Array([model.tolerance]),
    );

    this.prepareBuffers(0, gridSize);
    this.writeGridDataBuffer();
    this.writeemptyCellIndicesBuffer();

    this.computePipeline = this.device.createComputePipeline({
      label: 'S:SchellingComputePipeline:' + gridSize,
      layout: 'auto',
      compute: {
        module: this.device.createShaderModule({
          label: 'SchellingModelShader',
          code: SCHELLING_PARALLEL_COMPUTE_SHADER,
        }),
        constants: {
          EMPTY_VALUE: EMPTY_VALUE,
          workgroupSizeX: WORKGROUP_SIZE.x,
          workgroupSizeY: WORKGROUP_SIZE.y,
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
        { binding: 8, resource: { buffer: this.randomSegmentIndicesBuffer } },
        { binding: 9, resource: { buffer: this.emptyCellIndicesBuffer } }, // 空き地インデックスのバッファ
        { binding: 10, resource: { buffer: this.randomTableBuffer } }, // 乱数表のバッファ
      ],
    });
  }

  updateInitialStateGridData(
    agentTypeShares: number[],
    agentTypeCumulativeShares: number[],
  ) {
    const numemptyCells = this.model.updateInitialStateGridData(
      agentTypeShares,
      agentTypeCumulativeShares,
    );
    this.device.queue.writeBuffer(
      this.paramBuffer,
      8,
      new Uint32Array([numemptyCells]),
    );
  }

  private destroyBuffers() {
    this.gridBuffer?.destroy();
    this.emptyCellIndicesBuffer?.destroy();
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
    this.emptyCellIndicesBuffer = device.createBuffer({
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
  private writeemptyCellIndicesBuffer() {
    this.device.queue.writeBuffer(
      this.emptyCellIndicesBuffer,
      0,
      this.model.emptyCellIndices,
    );
  }

  setGridSize(gridSize: number) {
    const prevGridSize = this.model.gridSize;
    this.model.setGridSize(gridSize);
    this.prepareBuffers(prevGridSize, gridSize);
    this.writeGridDataBuffer();
    this.writeemptyCellIndicesBuffer();
    this.prepareBindGroup();
  }

  sync() {
    this.writeGridDataBuffer();
    this.writeemptyCellIndicesBuffer();
  }

  setTolerance(newTolerance: number) {
    this.device.queue.writeBuffer(
      this.paramBuffer,
      8,
      new Float32Array([newTolerance]),
    );
  }

  private writeRandomSegmentIndicesBuffer() {
    const randomSegmentIndices = new Uint32Array(256);
    for (let i = 0; i < randomSegmentIndices.length; i++) {
      randomSegmentIndices[i] = i;
    }
    shuffle(randomSegmentIndices);
    this.device.queue.writeBuffer(
      this.randomSegmentIndicesBuffer,
      0,
      randomSegmentIndices,
    );
  }

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
    passEncoder.dispatchWorkgroups(8, 8);
    passEncoder.end();
    return commandEncoder.finish();
  }

  async updateGridData(): Promise<Uint32Array> {
    this.writeRandomSegmentIndicesBuffer();
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
