import { EMPTY_VALUE } from 'webgpu-react-bitmap-viewport';
import { SchellingSegregationModelHandler } from './SchellingSegregationModelHandler';
import { SchellingSegregationModelProps } from './SchellingSegregationModelProps';
import { cumulativeSum, reverseCumulativeSum } from '../utils/arrayUtils';

export class SchellingSegregationModel
  implements SchellingSegregationModelHandler
{
  gridSize!: number;
  gridData!: Uint32Array;
  tolerance!: number;
  numEmptyCells!: number;
  cellIndices!: Uint32Array;
  focusedStates!: Uint32Array;
  selectedStates!: Uint32Array;
  viewportStates!: Float32Array;

  constructor(props: SchellingSegregationModelProps) {
    this.updateInitialStateGridData(
      props.gridSize,
      cumulativeSum(props.agentTypeShares),
    );
    this.setTolerance(props.tolerance);
    this.setFrameCount(0);
  }

  updateInitialStateGridData(
    gridSize: number,
    agentTypeCumulativeShares: number[],
  ) {
    const numCells = gridSize * gridSize;
    if (this.gridSize != gridSize) {
      this.gridSize = gridSize;
      this.gridData = new Uint32Array(numCells);
      this.cellIndices = new Uint32Array(numCells);
      this.focusedStates = new Uint32Array(gridSize);
      this.selectedStates = new Uint32Array(gridSize);
      this.viewportStates = new Float32Array([0, 0, gridSize, gridSize]);
    }

    const agentTypeValues = agentTypeCumulativeShares
      .map((share: number) => Math.floor(255 * share))
      .concat(EMPTY_VALUE);

    const _agentTypeCounts = reverseCumulativeSum(
      agentTypeCumulativeShares,
    ).map((share) => Math.floor(numCells * share));
    const numEmptyCell = numCells - _agentTypeCounts.reduce((a, b) => a + b, 0);
    if (numEmptyCell < 0) {
      console.error(this.gridSize, agentTypeCumulativeShares);
      throw new Error('The sum of agentTypeShares is over 1.0');
    }
    const agentTypeCounts =
      numEmptyCell > 0
        ? _agentTypeCounts.concat(numEmptyCell)
        : _agentTypeCounts;

    let start = 0; // 各valueに対応する個数を挿入
    agentTypeValues.forEach((value: number, index: number) => {
      const length = agentTypeCounts[index];
      this.gridData.fill(value, start, start + length);
      start += length;
    });

    for (let i = 0; i < numEmptyCell; i++) {
      this.cellIndices[i] = numCells - numEmptyCell + i;
    }
    this.numEmptyCells = numEmptyCell;
  }

  setFrameCount(frameCount: number): void {
    // Do nothing
  }

  setTolerance(tolerance: number): void {
    this.tolerance = tolerance;
  }

  sync() {
    // Do nothing
  }
}
