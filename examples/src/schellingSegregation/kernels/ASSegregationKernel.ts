import { EMPTY_VALUE } from 'webgpu-react-bitmap-viewport';
import { SegregationKernel } from './SegregationKernel';
import { SegregationUIState } from '../SegregationUIState';
import * as SegregationKernelFunctions from '../../../build/webgpu-react-bitmap-viewport/as/SegregationKernelFunctions.release';
// import { __Internref4 } from '../../../build/webgpu-react-bitmap-viewport/as/SegregationKernelFunctions.release';

export class ASSegregationKernel extends SegregationKernel {
  asObject!: any; // __Internref4;
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
      SegregationKernelFunctions.getASGrid(this.asObject),
      width * height,
    );
  }

  updateGridSize(
    width: number,
    height: number,
    agentShares: number[],
    tolerance: number,
  ) {
    this.asObject = SegregationKernelFunctions.createASSegregationKernelData(
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
    SegregationKernelFunctions.setASTolerance(this.asObject, newTolerance);
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  shuffleGridContent() {
    SegregationKernelFunctions.shuffleASGridData(this.asObject);
  }

  updateEmptyCellIndices() {
    SegregationKernelFunctions.updateASEmptyCellIndicesArray(this.asObject);
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
      this.asObject,
    );
    return Promise.resolve();
  }
}
