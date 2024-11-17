import { EMPTY_VALUE } from 'webgpu-react-bitmap-viewport';
import { SegregationKernel } from './SegregationKernel';
import { SegregationUIState } from './SegregationUIState';
import * as SegregationKernelFunctions from '../../build/webgpu-react-bitmap-viewport/as/SegregationKernelFunctions.release';
import { __Internref4 } from '../../build/webgpu-react-bitmap-viewport/as/SegregationKernelFunctions.release';
import { shuffleUint32Array } from './utils/arrayUtil';

export class ASSegregationKernel extends SegregationKernel {
  asData!: __Internref4;
  grid!: Uint32Array;
  width!: number;
  height!: number;
  agentShares!: number[];

  constructor(uiState: SegregationUIState, seed: string | undefined) {
    super(uiState, seed);
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
      agentShares,
      tolerance,
      EMPTY_VALUE,
    );
    this.grid = new Uint32Array(width * height);
    this.width = width;
    this.height = height;
    this.agentShares = agentShares;
    this.uiState.updateSize(width, height);
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  getAgentShares(): number[] {
    return this.agentShares;
  }

  setTolerance(newTolerance: number) {
    SegregationKernelFunctions.setASTolerance(this.asData, newTolerance);
  }

  shuffleGridContent() {
    shuffleUint32Array(this.grid, this.width * this.height, this.rng);
  }

  updateEmptyCellIndices() {
    SegregationKernelFunctions.updateASEmptyCellIndicesArray(this.asData);
  }

  syncGridContent(grid: Uint32Array): void {
    this.grid.set(grid);
    SegregationKernelFunctions.setASGrid(this.asData, Array.from(grid));
  }

  getGrid(): Uint32Array {
    return this.grid;
  }

  tick() {
    const grid = Uint32Array.from(
      SegregationKernelFunctions.tickAS(this.asData),
    );
    this.grid.set(grid);
    return Promise.resolve(this.grid);
  }
}
