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

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  private createGridUint32Array(width: number, height: number): Uint32Array {
    const ptr = SegregationKernelFunctions.getASGridPtr(this.asObject);
    //SegregationKernelFunctions.__pin(ptr);
    return new Uint32Array(
      SegregationKernelFunctions.memory.buffer,
      ptr,
      width * height,
    );
  }

  updateGridSize(width: number, height: number, tolerance: number) {
    /*
    if (this.asObject) {
      SegregationKernelFunctions.__unpin(this.asObject);
      SegregationKernelFunctions.__collect();
    }
     */
    this.asObject = SegregationKernelFunctions.createASSegregationKernelData(
      width,
      height,
      tolerance,
      EMPTY_VALUE,
    );
    // SegregationKernelFunctions.__pin(this.asObject);
    this.grid = this.createGridUint32Array(width, height);
    this.width = width;
    this.height = height;
    this.uiState.updateSize(width, height);
  }

  setGridContent(grid: Uint32Array): void {
    if (this.grid.byteLength === 0) {
      this.grid = this.createGridUint32Array(this.width, this.height);
    }
    this.grid.set(grid);
  }

  getGridContent(): Uint32Array {
    return this.grid;
  }

  getGrid(): Uint32Array {
    return this.grid;
  }

  setTolerance(newTolerance: number) {
    SegregationKernelFunctions.setASTolerance(this.asObject, newTolerance);
  }

  shuffleGridContent() {
    SegregationKernelFunctions.shuffleASGridData(this.asObject);
  }

  updateEmptyCellIndices() {
    SegregationKernelFunctions.updateASEmptyCellIndicesArray(this.asObject);
  }

  tick() {
    this.movingAgentIndicesLength = SegregationKernelFunctions.tickAS(
      this.asObject,
    );
    return Promise.resolve();
  }

  getMovingAgentCount() {
    return this.movingAgentIndicesLength;
  }
}
