import { EMPTY_VALUE } from 'webgpu-react-bitmap-viewport';
import { SchellingSegregationModelHandler } from './SchellingSegregationModelHandler';
import { SchellingSegregationModelProps } from './SchellingSegregationModelProps';
import { cumulativeSum } from '../utils/arrayUtils';

export class SchellingSegregationModel
  implements SchellingSegregationModelHandler
{
  gridSize!: number;
  gridData!: Uint32Array;
  tolerance!: number;
  numEmptyGrids!: number;
  emptyGridIndices!: Uint32Array;
  focusedStates!: Uint32Array;
  selectedStates!: Uint32Array;
  viewportStates!: Float32Array;

  constructor(props: SchellingSegregationModelProps) {
    this.setGridSize(props.gridSize);
    this.updateInitialStateGridData(
      props.agentTypeShares,
      cumulativeSum(props.agentTypeShares),
    );
    this.setTolerance(props.tolerance);
  }

  setGridSize(gridSize: number): void {
    const numCells = gridSize * gridSize;
    this.gridSize = gridSize;
    this.gridData = new Uint32Array(numCells);
    this.emptyGridIndices = new Uint32Array(numCells);
    this.focusedStates = new Uint32Array(gridSize);
    this.selectedStates = new Uint32Array(gridSize);
    this.viewportStates = new Float32Array([0, 0, gridSize, gridSize]);
  }

  updateInitialStateGridData(
    agentTypeShares: number[],
    agentTypeCumulativeShares: number[],
  ): number {
    const agentTypeValues = agentTypeCumulativeShares
      .map((share: number) => Math.floor(255 * share))
      .concat(EMPTY_VALUE);

    const numGrids = this.gridSize * this.gridSize;

    const _agentTypeCounts = agentTypeShares.map((share) =>
      Math.floor(numGrids * share),
    );
    const numEmptyGrid = numGrids - _agentTypeCounts.reduce((a, b) => a + b, 0);
    if (numEmptyGrid < 0) {
      console.error(this.gridSize, agentTypeShares);
      throw new Error('The sum of agentTypeShares is over 1.0');
    }
    const agentTypeCounts =
      numEmptyGrid > 0
        ? _agentTypeCounts.concat(numEmptyGrid)
        : _agentTypeCounts;

    let start = 0; // 各valueに対応する個数を挿入
    agentTypeValues.forEach((value: number, index: number) => {
      const length = agentTypeCounts[index];
      this.gridData.fill(value, start, start + length);
      start += length;
    });

    for (let i = 0; i < numEmptyGrid; i++) {
      this.emptyGridIndices[i] = numGrids - numEmptyGrid + i;
    }
    this.numEmptyGrids = numEmptyGrid;
    return numEmptyGrid;
  }

  setTolerance(tolerance: number): void {
    this.tolerance = tolerance;
  }

  sync() {}
}
