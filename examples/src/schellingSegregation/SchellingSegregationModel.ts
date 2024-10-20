import { EMPTY_VALUE } from 'webgpu-react-bitmap-viewport';
import { SchellingSegregationModelHandler } from './SchellingSegregationModelHandler';
import { SchellingSegregationModelProps } from './SchellingSegregationModelProps';
import { cumulativeSum, reverseCumulativeSum } from '../utils/arrayUtils';
import { findIndices, shuffleUint32Array } from './arrayUtils';

export class SchellingSegregationModel
  implements SchellingSegregationModelHandler
{
  gridSize!: number;
  grid!: Uint32Array;
  frameCount: number;
  tolerance!: number;
  numEmptyCells!: number;
  cellIndices!: Uint32Array;
  focusedStates!: Uint32Array;
  selectedStates!: Uint32Array;
  viewportStates!: Float32Array;

  constructor(props: SchellingSegregationModelProps) {
    this.updatePrimaryStateGridData(
      props.gridSize,
      cumulativeSum(props.agentTypeShares),
    );
    this.setTolerance(props.tolerance);
    this.frameCount = 0;
  }

  updatePrimaryStateGridData(
    gridSize: number,
    agentTypeCumulativeShares: number[],
  ) {
    const numCells = gridSize * gridSize;
    if (this.gridSize != gridSize) {
      this.gridSize = gridSize;
      this.grid = new Uint32Array(numCells);
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
      this.grid.fill(value, start, start + length);
      start += length;
    });

    for (let i = 0; i < numEmptyCell; i++) {
      this.cellIndices[i] = numCells - numEmptyCell + i;
    }
    this.numEmptyCells = numEmptyCell;
  }

  updateSecondaryStateGridData() {
    shuffleUint32Array(this.grid);
    this.cellIndices = findIndices(this.grid, EMPTY_VALUE);
  }

  setFrameCount(frameCount: number): void {
    this.frameCount = frameCount;
  }

  setTolerance(tolerance: number): void {
    this.tolerance = tolerance;
  }
}
