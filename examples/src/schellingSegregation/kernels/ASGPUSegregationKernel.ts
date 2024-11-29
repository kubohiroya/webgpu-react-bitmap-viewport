import * as SegregationKernelFunctions from '../../../build/webgpu-react-bitmap-viewport/as/SegregationKernelFunctions.release';
import { EMPTY_VALUE } from 'webgpu-react-bitmap-viewport';
import { SegregationUIState } from '../SegregationUIState';
import { GPUSegregationKernel } from './GPUSegregationKernel';
// import { __Internref6 } from '../../../build/webgpu-react-bitmap-viewport/as/SegregationKernelFunctions.release';
/*
import {
  MyObject,
  average,
  createObject,
} from '../../../build/webgpu-react-bitmap-viewport/as/SegregationKernelFunctions.release';
const a: MyObject = createObject(10000.0, 20000.0);
console.log('******************', average(a));
*/
export class ASGPUSegregationKernel extends GPUSegregationKernel {
  protected asGpuObject!: any; //__Internref6;
  grid!: Uint32Array;
  agentIndices!: Uint32Array;
  agentIndicesLength!: Uint32Array;

  movingAgentIndicesLength!: number;

  constructor(
    uiState: SegregationUIState,
    seed: string | undefined,
    device: GPUDevice,
    workgroupSizeMax: number,
  ) {
    super(uiState, seed, device, workgroupSizeMax);
  }

  private createGridUint32Array(width: number, height: number): Uint32Array {
    return new Uint32Array(
      SegregationKernelFunctions.memory.buffer,
      SegregationKernelFunctions.getASGPUGrid(this.asGpuObject),
      width * height,
    );
  }

  updateGridSize(
    width: number,
    height: number,
    agentShares: number[],
    tolerance: number,
  ): void {
    const workgroupSize = Math.min(this.workgroupSizeMax, height);
    const dispatchSize = Math.min(this.workgroupSizeMax, width);
    this.asGpuObject =
      SegregationKernelFunctions.createASGPUSegregationKernelData(
        width,
        height,
        tolerance,
        EMPTY_VALUE,
        this.workgroupSizeMax,
      );
    this.grid = this.createGridUint32Array(width, height);
    this.agentIndices = new Uint32Array(
      SegregationKernelFunctions.memory.buffer,
      SegregationKernelFunctions.getASGPUAgentIndices(this.asGpuObject),
      width * height,
    );
    this.agentIndicesLength = new Uint32Array(
      SegregationKernelFunctions.memory.buffer,
      SegregationKernelFunctions.getASGPUAgentIndicesLength(this.asGpuObject),
      workgroupSize * dispatchSize,
    );
    super.updateGridSize(width, height, agentShares, tolerance);
  }

  setTolerance(newTolerance: number) {
    super.setTolerance(newTolerance);
    return SegregationKernelFunctions.setASGPUTolerance(
      this.asGpuObject,
      newTolerance,
    );
  }

  setGridContent(grid: Uint32Array) {
    if (this.grid.byteLength === 0) {
      this.grid = this.createGridUint32Array(
        this.jsObject.width,
        this.jsObject.height,
      );
    }
    this.grid.set(grid);
    this.device.queue.writeBuffer(this.gridBuffer, 0, grid);
  }

  shuffleGridContent() {
    SegregationKernelFunctions.shuffleASGPUGridData(this.asGpuObject);
  }

  updateEmptyCellIndices() {
    super.updateEmptyCellIndices();
    SegregationKernelFunctions.updateASGPUEmptyCellIndicesArray(
      this.asGpuObject,
    );
    this.device.queue.writeBuffer(this.gridBuffer, 0, this.grid);
  }

  getMovingAgentCount(): number {
    return this.movingAgentIndicesLength;
  }

  async tick(): Promise<void> {
    this.device.queue.writeBuffer(this.gridBuffer, 0, this.grid);

    const command0 = this.createCommandBuffer(
      this.computePipelines[0],
      this.gpuObject.dispatchSize,
    ); // process convolution

    const sources = [
      {
        key: 'cells',
        source: this.agentIndicesBuffer,
        size:
          this.jsObject.width *
          this.jsObject.height *
          Uint32Array.BYTES_PER_ELEMENT,
        target: this.agentIndices,
      },
      {
        key: 'workItems',
        source: this.agentIndicesLengthBuffer,
        size:
          this.gpuObject.workgroupSize *
          this.gpuObject.dispatchSize *
          Uint32Array.BYTES_PER_ELEMENT,
        target: this.agentIndicesLength,
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

    this.movingAgentIndicesLength = SegregationKernelFunctions.tickASGPU(
      this.asGpuObject,
    );

    return Promise.resolve();
  }
}
