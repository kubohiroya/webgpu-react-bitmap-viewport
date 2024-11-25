import { EMPTY_VALUE } from 'webgpu-react-bitmap-viewport';
import { SegregationKernel } from './SegregationKernel';
import { SegregationUIState } from '../SegregationUIState';
import * as SegregationKernelFunctions from '../../../build/webgpu-react-bitmap-viewport/as/SegregationKernelFunctions.release';
import { __Internref4 } from '../../../build/webgpu-react-bitmap-viewport/as/SegregationKernelFunctions.release';

export class ASSegregationKernel extends SegregationKernel {
  asData!: __Internref4;
  grid!: Uint32Array;
  width!: number;
  height!: number;
  movingAgentIndicesLength!: number;
  constructor(uiState: SegregationUIState, seed: string | undefined) {
    super(uiState, seed);
  }

  createGridUint32Array(width: number, height: number): Uint32Array {
    return new Uint32Array(
      SegregationKernelFunctions.memory.buffer,
      SegregationKernelFunctions.getASGrid(this.asData),
      width * height,
    );
  }

  updateGridSize(
    width: number,
    height: number,
    agentShares: number[],
    tolerance: number,
  ) {
    this.asData = SegregationKernelFunctions.createASSegregationKernelData(
      width,
      height,
      tolerance,
      EMPTY_VALUE,
    );
    this.grid = this.createGridUint32Array(width, height);
    this.width = width;
    this.height = height;
    this.uiState.updateSize(width, height);
  }

  setTolerance(newTolerance: number) {
    SegregationKernelFunctions.setASTolerance(this.asData, newTolerance);
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  shuffleGridContent() {
    SegregationKernelFunctions.shuffleASGridData(this.asData);
  }

  updateEmptyCellIndices() {
    SegregationKernelFunctions.updateASEmptyCellIndicesArray(this.asData);
  }

  setGridContent(grid: Uint32Array): void {
    if (this.grid.byteLength === 0) {
      this.grid = this.createGridUint32Array(this.width, this.height);
    }
    this.grid.set(grid);
  }

  getGrid(): Uint32Array {
    return this.grid;
  }

  getGridImpl(): Uint32Array {
    return this.grid;
  }

  getMovingAgentCount() {
    return this.movingAgentIndicesLength;
  }

  tick() {
    this.movingAgentIndicesLength = SegregationKernelFunctions.tickAS(
      this.asData,
    );
    return Promise.resolve();
  }
}
