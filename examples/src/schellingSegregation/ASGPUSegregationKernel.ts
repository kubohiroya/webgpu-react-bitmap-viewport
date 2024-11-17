import * as SegregationKernelFunctions from '../../build/webgpu-react-bitmap-viewport/as/SegregationKernelFunctions.release/index';
import { EMPTY_VALUE } from 'webgpu-react-bitmap-viewport';
import { SegregationUIState } from './SegregationUIState';
import { GPUSegregationKernel } from './GPUSegregationKernel';
import { __Internref9 } from '../../build/webgpu-react-bitmap-viewport/as/SegregationKernelFunctions.release';

export class ASGPUSegregationKernel extends GPUSegregationKernel {
  protected asGpuData!: __Internref9;

  constructor(
    uiState: SegregationUIState,
    seed: string | undefined,
    device: GPUDevice,
    workgroupSize: number,
  ) {
    super(uiState, seed, device, workgroupSize);
  }

  setTolerance(newTolerance: number) {
    super.setTolerance(newTolerance);
    return SegregationKernelFunctions.setASGPUTolerance(
      this.asGpuData,
      newTolerance,
    );
  }

  updateGridSize(
    width: number,
    height: number,
    agentShares: number[],
    tolerance: number,
  ): void {
    this.asGpuData =
      SegregationKernelFunctions.createASGPUSegregationKernelData(
        width,
        height,
        agentShares,
        tolerance,
        Math.min(this.workgroupSizeMax, height),
        Math.min(this.workgroupSizeMax, width),
        EMPTY_VALUE,
      );
    super.updateGridSize(width, height, agentShares, tolerance);
  }

  async tick(): Promise<Uint32Array> {
    const command0 = this.createCommandBuffer(
      this.computePipelines[0],
      this.gpuData.dispatchSize,
    ); // convolution

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
    await this.device.queue.onSubmittedWorkDone();

    const grid = Uint32Array.from(
      SegregationKernelFunctions.tickASGPU(
        this.asGpuData,
        this.gpuData.agentIndices,
        this.gpuData.agentIndicesLength,
        this.getBlockSize(),
      ),
    );

    super.syncGridContent(grid);
    SegregationKernelFunctions.setASGPUGrid(this.asGpuData, Array.from(grid));

    return Promise.resolve(this.data.grid);
  }

  syncGridContent(grid: Uint32Array) {
    super.syncGridContent(grid);
    SegregationKernelFunctions.setASGPUGrid(this.asGpuData, Array.from(grid));
  }
}
