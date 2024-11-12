import { SegregationUIState } from './SegregationUIState';
import { reverseCumulativeSum } from './utils/arrayUtils';
import { EMPTY_VALUE } from 'webgpu-react-bitmap-viewport';

export function createAgentTypeValues(agentTypeCumulativeShares: number[]) {
  return agentTypeCumulativeShares
    .map((share: number) => Math.floor(255 * share))
    .concat(EMPTY_VALUE);
}

export function findAgentTypeIndex(
  agentTypeValues: number[],
  value: number,
): number {
  return createAgentTypeValues(agentTypeValues).findIndex((v) => v == value);
}

export abstract class SegregationKernel {
  protected uiState: SegregationUIState;

  protected constructor(uiState: SegregationUIState) {
    this.uiState = uiState;
  }

  getUIState(): SegregationUIState {
    return this.uiState;
  }

  createInitialGridData(
    width: number,
    height: number,
    agentTypeCumulativeShares: number[],
    tolerance: number,
  ): Uint32Array {
    const numCells = width * height;
    if (this.getWidth() !== width || this.getHeight() !== height) {
      this.updateGridSize(width, height, agentTypeCumulativeShares, tolerance);
    }
    const agentTypeValues = createAgentTypeValues(agentTypeCumulativeShares);

    const _agentTypeCounts = reverseCumulativeSum(
      agentTypeCumulativeShares,
    ).map((share) => Math.floor(numCells * share));
    const numEmptyCell = numCells - _agentTypeCounts.reduce((a, b) => a + b, 0);
    if (numEmptyCell < 0) {
      throw new Error('The sum of agentTypeShares is over 1.0');
    }
    const agentTypeCounts =
      numEmptyCell > 0
        ? _agentTypeCounts.concat(numEmptyCell)
        : _agentTypeCounts;

    let start = 0; // 各valueに対応する個数を挿入
    const grid = new Uint32Array(numCells);
    agentTypeValues.forEach((value: number, index: number) => {
      const length = agentTypeCounts[index];
      grid.fill(value, start, start + length);
      start += length;
    });
    return grid;
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
  abstract syncGridContent(grid: Uint32Array): void;
  abstract updateEmptyCellIndices(): void;
  abstract tick(): Promise<Uint32Array>;
  abstract getGrid(): Uint32Array;
}
