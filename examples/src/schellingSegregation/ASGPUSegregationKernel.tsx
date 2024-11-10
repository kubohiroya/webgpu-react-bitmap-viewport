import * as SegregationKernelFunctions from '../../build/webgpu-react-bitmap-viewport/as/SegregationKernelFunctions.release/index';
import { EMPTY_VALUE } from 'webgpu-react-bitmap-viewport';
import { SegregationUIState } from './SegregationUIState';
import { GPUSegregationKernel } from './GPUSegregationKernel';
import { __Internref9 } from '../../build/webgpu-react-bitmap-viewport/as/SegregationKernelFunctions.release';

export class ASGPUSegregationKernel extends GPUSegregationKernel {
  protected asGpuData!: __Internref9;

  constructor(
    uiState: SegregationUIState,
    device: GPUDevice,
    workgroupSize: number,
  ) {
    super(uiState, device, workgroupSize);
  }

  setTolerance(newTolerance: number) {
    super.setTolerance(newTolerance);
    return SegregationKernelFunctions.setToleranceASGPU(
      this.asGpuData,
      newTolerance,
    );
  }

  getGrid(): Uint32Array {
    // return this.data.grid; // CHECK ME? FIXME ?
    return Uint32Array.from(
      SegregationKernelFunctions.getGridASGPU(this.asGpuData),
    );
  }

  updateGridSize(
    width: number,
    height: number,
    agentShares: number[],
    tolerance: number,
  ): void {
    this.asGpuData =
      SegregationKernelFunctions.createSegregationKernelDataASGPU(
        width,
        height,
        agentShares,
        tolerance,
        Math.min(64, width),
        EMPTY_VALUE,
      );
    super.updateGridSize(width, height, agentShares, tolerance);
  }

  /*
  shuffleGridContent(): void {
    SegregationKernelFunctions.shuffleGridDataASGPU(this.asGpuData);
  }

  updateEmptyCellIndices() {
    SegregationKernelFunctions.updateEmptyCellIndicesArrayASGPU(this.asGpuData);
  }

  updateGridContent(grid: Uint32Array): void {
    return SegregationKernelFunctions.setGridASGPU(
      this.asGpuData,
      Array.from(grid),
    );
  }
   */

  async tick(): Promise<Uint32Array> {
    this.device.queue.writeBuffer(this.gridBuffer, 0, this.data.grid.buffer);
    /*
    await this.execShader(this.computePipelines[0], this.gpuData.dispatchSize);

    await this.copyBufferToArray(
      this.agentIndicesBuffer,
      this.gpuData.movingAgentIndices,
      this.agentIndicesTargetBuffer,
    );
    await this.copyBufferToArray(
      this.agentIndicesLengthBuffer,
      this.gpuData.agentIndicesLengths,
      this.agentIndicesLengthTargetBuffer,
    );
 */

    // TODO: copy this.gpuData.agentIndices to AS
    // TODO: copy this.gpuData.agentIndicesLengths to AS
    // TODO: shuffle emptyCellIndices in AS
    // TODO: shuffle agentIndices in AS
    // TODO: compact agentIndices in AS
    // TODO: move agents in AS

    return Promise.resolve(
      Uint32Array.from(SegregationKernelFunctions.tickASGPU(this.asGpuData)),
    );
  }
}
