import { EMPTY_VALUE } from 'webgpu-react-bitmap-viewport';
import { SegregationKernel } from './SegregationKernel';
import { SegregationUIState } from '../SegregationUIState';
import { JSSegregationKernelObject } from './JSSegregationKernelObject';
import { processConvolution, sortUint32ArrayRange } from '../utils/arrayUtil';
import { shuffleUint32ArrayWithSeed } from '../utils/shuffleUtil';

export class JSSegregationKernel extends SegregationKernel {
  protected jsObject!: JSSegregationKernelObject;

  constructor(uiState: SegregationUIState, seed: string | undefined) {
    super(uiState, seed);
  }

  updateGridSize(
    width: number,
    height: number,
    agentShares: number[],
    tolerance: number,
  ) {
    this.jsObject = new JSSegregationKernelObject(
      width,
      height,
      agentShares,
      tolerance,
    );
    this.uiState.updateSize(width, height);
  }

  setGridContent(grid: Uint32Array) {
    this.jsObject.grid.set(grid);
  }

  shuffleGridContent() {
    shuffleUint32ArrayWithSeed(
      this.jsObject.grid,
      this.jsObject.width * this.jsObject.height,
      this.rng,
    );
  }

  updateEmptyCellIndices() {
    this.jsObject.emptyCellIndicesLength = 0;
    for (let y = 0; y < this.jsObject.height; y++) {
      for (let x = 0; x < this.jsObject.width; x++) {
        const currentIndex = y * this.jsObject.width + x;
        const agentType = this.jsObject.grid[currentIndex];
        if (agentType === EMPTY_VALUE) {
          this.jsObject.emptyCellIndices[this.jsObject.emptyCellIndicesLength] =
            currentIndex;
          this.jsObject.emptyCellIndicesLength++;
        }
      }
    }
  }

  moveAgentAndSwapEmptyCell(
    grid: Uint32Array,
    emptyCellIndices: Uint32Array,
    emptyCellIndicesLength: number,
    movingAgentIndices: Uint32Array,
    movingAgentIndicesLength: number,
  ) {
    // Perform moving based on movingAgentIndices and emptyCellIndices
    const length = Math.min(emptyCellIndicesLength, movingAgentIndicesLength);

    // Perform moving based on movingAgentIndices and emptyCellIndices
    for (let i = 0; i < length; i++) {
      const emptyIndex = emptyCellIndices[i];
      const agentIndex = movingAgentIndices[i];
      if (emptyIndex !== agentIndex) {
        grid[emptyIndex] = grid[agentIndex];
        grid[agentIndex] = EMPTY_VALUE;
        emptyCellIndices[i] = agentIndex;
      } else {
        throw new Error(`${i} ${emptyIndex} == ${agentIndex}`);
      }
    }
  }

  async tick() {
    this.jsObject.movingAgentIndicesLength = 0;

    for (let y = 0; y < this.jsObject.height; y++) {
      for (let x = 0; x < this.jsObject.width; x++) {
        const currentIndex = y * this.jsObject.width + x;
        const currentAgentType = this.jsObject.grid[currentIndex];
        if (currentAgentType !== EMPTY_VALUE) {
          let neighborCount = 0;
          let similarCount = 0;
          processConvolution(
            x,
            y,
            this.jsObject.width,
            this.jsObject.height,
            (index) => {
              const agentType = this.jsObject.grid[index];
              if (agentType !== EMPTY_VALUE) {
                neighborCount++;
                if (agentType === currentAgentType) {
                  similarCount++;
                }
              }
            },
          );
          if (
            neighborCount === 0 ||
            similarCount / neighborCount < this.jsObject.tolerance
          ) {
            this.jsObject.movingAgentIndices[
              this.jsObject.movingAgentIndicesLength
            ] = currentIndex;
            this.jsObject.movingAgentIndicesLength++;
          }
        }
      }
    }
    if (this.rng) {
      sortUint32ArrayRange(
        this.jsObject.movingAgentIndices,
        0,
        this.jsObject.movingAgentIndicesLength,
      );
    }

    shuffleUint32ArrayWithSeed(
      this.jsObject.emptyCellIndices,
      this.jsObject.emptyCellIndicesLength,
      this.rng,
    );

    shuffleUint32ArrayWithSeed(
      this.jsObject.movingAgentIndices,
      this.jsObject.movingAgentIndicesLength,
      this.rng,
    );

    this.moveAgentAndSwapEmptyCell(
      this.jsObject.grid,
      this.jsObject.emptyCellIndices,
      this.jsObject.emptyCellIndicesLength,
      this.jsObject.movingAgentIndices,
      this.jsObject.movingAgentIndicesLength,
    );
    return;
  }

  getGrid(): Uint32Array {
    return this.jsObject.grid;
  }

  getGridImpl(): Uint32Array | GPUBuffer {
    return this.jsObject.grid;
  }

  getWidth(): number {
    return this.jsObject.width;
  }

  getHeight(): number {
    return this.jsObject.height;
  }

  getMovingAgentCount() {
    return this.jsObject.movingAgentIndicesLength;
  }

  setTolerance(newTolerance: number) {
    this.jsObject.tolerance = newTolerance;
  }
}
