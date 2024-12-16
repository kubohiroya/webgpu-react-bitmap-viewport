import { SegregationUIState } from '../SegregationUIState';
import { createInitialGridData } from './SegregationKernelService';
import seedrandom from 'seedrandom';

export abstract class SegregationKernel {
  protected uiState: SegregationUIState;
  protected rng?: seedrandom.PRNG;

  protected constructor(uiState: SegregationUIState, seed?: string) {
    this.uiState = uiState;
    if (seed) {
      this.rng = seedrandom(seed);
    }
  }

  getUIState(): SegregationUIState {
    return this.uiState;
  }

  abstract getWidth(): number;
  abstract getHeight(): number;
  abstract updateGridSize(
    width: number,
    height: number,
    tolerance: number,
  ): void;
  abstract getGridContent(): Uint32Array;
  abstract setGridContent(grid: Uint32Array): void;
  abstract getGrid(): Uint32Array | GPUBuffer;
  abstract setTolerance(newTolerance: number): void;
  abstract shuffleGridContent(): void;
  abstract updateEmptyCellIndices(): void;
  abstract tick(): Promise<void>;
  abstract getMovingAgentCount(): number;
}
