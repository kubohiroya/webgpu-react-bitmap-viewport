import { SegregationUIState } from './SegregationUIState';
import { createInitialGridData } from './SegregationKernelService';
import seedrandom from 'seedrandom';

export abstract class SegregationKernel {
  protected uiState: SegregationUIState;
  protected rng?: seedrandom.PRNG;

  protected constructor(uiState: SegregationUIState, seed?: string) {
    this.uiState = uiState;
    seed && (this.rng = seedrandom(seed));
  }

  createInitialGridData(
    width: number,
    height: number,
    agentTypeCumulativeShares: number[],
    tolerance: number,
    EMPTY_VALUE = 0,
  ): Uint32Array {
    if (this.getWidth() !== width || this.getHeight() !== height) {
      this.updateGridSize(width, height, agentTypeCumulativeShares, tolerance);
    }
    return createInitialGridData(
      width,
      height,
      agentTypeCumulativeShares,
      EMPTY_VALUE,
    );
  }

  getUIState(): SegregationUIState {
    return this.uiState;
  }

  abstract getWidth(): number;
  abstract getHeight(): number;
  abstract updateGridSize(
    width: number,
    height: number,
    agentShares: number[],
    tolerance: number,
  ): void;
  abstract setTolerance(newTolerance: number): void;
  abstract shuffleGridContent(): void;
  abstract setGridContent(grid: Uint32Array): void;
  abstract updateEmptyCellIndices(): void;
  abstract tick(): Promise<void>;
  abstract getGrid(): Uint32Array;
  abstract getMovingAgentCount(): number;
}
