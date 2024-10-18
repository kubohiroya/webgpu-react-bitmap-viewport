import SCHELLING_PARALLEL_COMPUTE_SHADER from './SchellingSegregationShader.wgsl?raw';
import { EMPTY_VALUE } from 'webgpu-react-bitmap-viewport';
import { SchellingSegregationModel } from './SchellingSegregationModel';
import { SchellingSegregationKernel } from './SchellingSegregationKernel';
import { createHistogram, shuffleUint32Array } from './arrayUtils';

const WORKGROUP_SIZE = 64;
const SEGMENT_SIZE_FOR_WORKGROUP = 4;
const SEGMENT_SIZE = WORKGROUP_SIZE * SEGMENT_SIZE_FOR_WORKGROUP;

const DEBUG = false;

export class SchellingSegregationKernelGPU extends SchellingSegregationKernel {
  device: GPUDevice;

  paramsBuffer: GPUBuffer;
  randomSegmentIndicesBuffer: GPUBuffer;

  randomTable!: Float32Array;
  gridBuffer!: GPUBuffer;
  cellIndicesBuffer!: GPUBuffer;
  randomTableBuffer!: GPUBuffer;
  readerBuffer!: GPUBuffer;
  debugBuffer!: GPUBuffer;

  computePipeline!: GPUComputePipeline;
  bindGroup!: GPUBindGroup;

  constructor(model: SchellingSegregationModel, device: GPUDevice) {
    super(model);
    this.device = device;

    const gridSize = model.gridSize;

    this.paramsBuffer = device.createBuffer({
      label: `S:ParamsBuffer(gridSize=${gridSize})`,
      size: 8,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.randomSegmentIndicesBuffer = device.createBuffer({
      label: `S:RandomSegmentIndicesBuffer(gridSize=${gridSize})`,
      size: SEGMENT_SIZE * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(this.paramsBuffer, 0, new Uint32Array([0]));
    device.queue.writeBuffer(
      this.paramsBuffer,
      4,
      new Float32Array([model.tolerance]),
    );

    this.prepareBuffers(0, gridSize);
    this.writeGridDataBuffer();
    this.prepareBindGroup(gridSize);
  }

  isParallel(gridSize?: number) {
    if (gridSize === undefined) {
      gridSize = this.model.gridSize;
    }
    return WORKGROUP_SIZE < (gridSize * gridSize) / 16;
  }

  createComputePipeline(gridSize: number) {
    function replaceAll(str: string, data: { [key: string]: number }) {
      return Object.entries(data).reduce((acc, [key, value]) => {
        return acc.replaceAll(
          new RegExp(`const ${key}\\: u32 = (\\d+)\\;`, 'g'),
          `const ${key}: u32 = ${value};`,
        );
      }, str);
    }

    const workgroupSize = this.isParallel() ? WORKGROUP_SIZE : 1;
    const segmentSize = this.isParallel() ? SEGMENT_SIZE : gridSize * gridSize;
    const segmentsPerGroup = this.isParallel() ? 4 : 1;
    const cellsPerSegment = Math.ceil((gridSize * gridSize) / workgroupSize);
    const cellsPerGroup = cellsPerSegment * segmentsPerGroup;

    const code = replaceAll(SCHELLING_PARALLEL_COMPUTE_SHADER, {
      WORKGROUP_SIZE: workgroupSize,
      SEGMENT_SIZE: segmentSize,
      SEGMENTS_PER_GROUP: segmentsPerGroup,
      CELLS_PER_SEGMENT: cellsPerSegment,
      CELLS_PER_GROUP: cellsPerGroup,
    });

    return this.device.createComputePipeline({
      label: `S:SchellingComputePipeline(gridSize=${gridSize})`,
      layout: 'auto',
      compute: {
        module: this.device.createShaderModule({
          label: 'SchellingModelShader',
          code,
        }),
        constants: {
          EMPTY_VALUE,
          WIDTH: gridSize,
          HEIGHT: gridSize,
          width: gridSize,
          height: gridSize,
        },
        entryPoint: 'main',
      },
    });
  }

  prepareBindGroup(gridSize: number) {
    this.computePipeline = this.createComputePipeline(gridSize);
    this.bindGroup = this.device.createBindGroup({
      label: `S:SchellingBindGroup(gridSize=${this.model.gridSize})`,
      layout: this.computePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 6, resource: { buffer: this.paramsBuffer } },
        { binding: 7, resource: { buffer: this.gridBuffer } },
        { binding: 8, resource: { buffer: this.randomTableBuffer } },
        { binding: 9, resource: { buffer: this.randomSegmentIndicesBuffer } },
      ].concat(
        DEBUG ? [{ binding: 10, resource: { buffer: this.debugBuffer } }] : [],
      ),
    });
  }

  private destroyBuffers() {
    this.gridBuffer?.destroy();
    this.cellIndicesBuffer?.destroy();
    this.randomTableBuffer?.destroy();
    this.readerBuffer?.destroy();
    DEBUG && this.debugBuffer?.destroy();
  }

  private prepareBuffers(prevGridSize: number, gridSize: number) {
    if (prevGridSize !== 0 && prevGridSize !== gridSize) {
      this.destroyBuffers();
    }

    const device = this.device;
    const model = this.model;
    const numCells = gridSize * gridSize;

    this.randomTable = new Float32Array(numCells);

    // 空き地インデックスのGPUバッファを作成
    this.cellIndicesBuffer = device.createBuffer({
      label: `S:CellIndicesBuffer(gridSize=${gridSize})`,
      size: numCells * 4,
      usage: GPUBufferUsage.STORAGE,
    });

    DEBUG &&
      (this.debugBuffer = device.createBuffer({
        label: `S:DebugBuffer(gridSize=${gridSize})`,
        size: numCells * 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
      }));

    // グリッドバッファの初期化
    this.gridBuffer = device.createBuffer({
      label: `S:GridBuffer(gridSize=${gridSize})`,
      size: model.gridData.byteLength,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
    });

    // 乱数表のGPUバッファを作成
    this.randomTableBuffer = device.createBuffer({
      label: `S:RandomTableBuffer(gridSize=${gridSize})`,
      size: numCells * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    this.readerBuffer = device.createBuffer({
      label: `S:ReaderBuffer(gridSize=${gridSize})`,
      size: model.gridData.byteLength,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      mappedAtCreation: false,
    });
  }

  private writeGridDataBuffer() {
    this.device.queue.writeBuffer(
      this.gridBuffer,
      0,
      this.model.gridData.buffer,
    );
    // console.log('writeGridData', this.model.gridData);
  }

  writeDataToBuffer() {
    this.writeGridDataBuffer();
  }

  setTolerance(newTolerance: number) {
    this.device.queue.writeBuffer(
      this.paramsBuffer,
      4,
      new Float32Array([newTolerance]),
    );
  }

  private writeRandomSegmentIndicesBuffer(length: number) {
    const randomSegmentIndices = new Uint32Array(length);
    for (let i = 0; i < randomSegmentIndices.length; i++) {
      randomSegmentIndices[i] = i;
    }
    shuffleUint32Array(randomSegmentIndices);
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
    this.device?.queue.writeBuffer(this.randomTableBuffer, 0, this.randomTable);
  }

  writeMode() {
    this.device.queue.writeBuffer(
      this.paramsBuffer,
      0,
      new Uint32Array([this.model.frameCount % 2]),
    );
  }

  private async copyBufferToArray1(
    sourceBuffer: GPUBuffer,
    targetBuffer: GPUBuffer,
    array: Uint32Array,
  ) {
    console.log('------------1');
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
    console.log('------------2');
    await targetBuffer.mapAsync(GPUMapMode.READ);
    console.log('------------3');
    await this.device.queue.onSubmittedWorkDone();
    array.set(new Uint32Array(targetBuffer.getMappedRange()));
    targetBuffer.unmap();
  }

  private async copyBufferToArray(sourceBuffer: GPUBuffer, array: Uint32Array) {
    //console.log('----1');
    const targetBuffer: GPUBuffer = this.device.createBuffer({
      label: `S:ReaderBuffer(gridSize=${this.model.gridSize})`,
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
    //console.log('----2');
    await this.device.queue.onSubmittedWorkDone();
    //console.log('----3');
    await targetBuffer.mapAsync(GPUMapMode.READ);
    //console.log('----4');
    await this.device.queue.onSubmittedWorkDone();
    array.set(new Uint32Array(targetBuffer.getMappedRange()));
    targetBuffer.unmap();
    targetBuffer.destroy();
  }

  private createCommandBuffer(
    pipeline: GPUComputePipeline,
    bindGroup: GPUBindGroup,
  ) {
    const commandEncoder = this.device.createCommandEncoder({
      label: `S:CommandEncoder(gridSize=${this.model.gridSize})`,
    });
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.dispatchWorkgroups(
      this.isParallel() ? 64 : 1,
      //Math.ceil((this.model.gridSize * this.model.gridSize) / 64),
    );
    passEncoder.end();
    return commandEncoder.finish();
  }

  updatePrimaryStateGridData(
    gridSize: number,
    agentTypeCumulativeShares: number[],
  ) {
    this.model.updatePrimaryStateGridData(gridSize, agentTypeCumulativeShares);
    this.prepareBuffers(this.model.gridSize, gridSize);
    this.prepareBindGroup(gridSize);
  }

  async updateGridData(): Promise<Uint32Array> {
    this.writeRandomSegmentIndicesBuffer(SEGMENT_SIZE);
    this.writeRandomTableBuffer();
    this.writeMode();

    // console.log('----A');
    const commandBuffer = this.createCommandBuffer(
      this.computePipeline,
      this.bindGroup,
    );

    this.device.queue.submit([commandBuffer]);
    await this.device.queue.onSubmittedWorkDone();
    // console.log('----B');
    if (DEBUG) {
      const debug = new Uint32Array(this.model.gridSize * this.model.gridSize);
      await this.copyBufferToArray(this.debugBuffer, debug);
      console.debug(debug);
    }

    await this.copyBufferToArray(
      this.gridBuffer,
      // this.readerBuffer,
      this.model.gridData,
    );
    // console.log('----C');
    // console.log(createHistogram(this.model.gridData));
    //console.log(this.model.gridData);

    return this.model.gridData;
  }
}
