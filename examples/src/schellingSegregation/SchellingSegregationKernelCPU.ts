import { EMPTY_VALUE } from 'webgpu-react-bitmap-viewport';
import { SchellingSegregationKernel } from './SchellingSegregationKernel';
import { shuffle } from './arrayUtils';
import { SchellingSegregationModes } from './SchellingSegregationShellProps';
import * as SchellingSegregationKernelFunctions from '../as/assembly/SchellingSegregationKernelFunctions';
import { SchellingSegregationModel } from './SchellingSegregationModel';

function getSurroundingIndices(
  x: number,
  y: number,
  width: number,
  height: number,
): number[] {
  // x, y の周囲の相対的な位置
  const deltas = [
    [-1, -1],
    [0, -1],
    [1, -1], // 上の行
    [-1, 0],
    [1, 0], // 左右
    [-1, 1],
    [0, 1],
    [1, 1], // 下の行
  ];

  return deltas.map(([dx, dy]) => {
    // xとyの上下左右ループを考慮して、座標を計算
    const newX = (x + dx + width) % width;
    const newY = (y + dy + height) % height;
    // インデックスを計算
    return newY * width + newX;
  });
}

export class SchellingSegregationKernelCPU extends SchellingSegregationKernel {
  private emptyCellIndices!: Uint32Array;
  private emptyCellIndicesLength: number = 0;
  private agentIndicesArray!: Uint32Array;
  private agentIndicesLengthArray!: Uint32Array;
  private movingAgentIndicesArray!: Uint32Array;
  private movingAgentIndicesArrayLength: number = 0;

  constructor(model: SchellingSegregationModel) {
    super(model);
    const totalCells = this.model.gridSize * this.model.gridSize;
    this.agentIndicesArray = new Uint32Array(totalCells);
    this.agentIndicesLengthArray = new Uint32Array(totalCells);
    this.emptyCellIndices = new Uint32Array(totalCells);
    this.movingAgentIndicesArray = new Uint32Array(totalCells);
  }

  async updateGridData() {
    if (this.model.mode === SchellingSegregationModes.JS) {
      const emptyCells: number[] = [];
      const movingAgents: number[] = [];

      for (let y = 0; y < this.model.gridSize; y++) {
        for (let x = 0; x < this.model.gridSize; x++) {
          const currentIndex = y * this.model.gridSize + x;
          const agentType = this.model.grid[currentIndex];
          if (agentType === EMPTY_VALUE) {
            emptyCells.push(currentIndex);
          } else {
            const surroundingIndices = getSurroundingIndices(
              x,
              y,
              this.model.gridSize,
              this.model.gridSize,
            );
            const surroundingAgentTypes = surroundingIndices.map(
              (index) => this.model.grid[index],
            );
            const similarCount = surroundingAgentTypes.filter(
              (value) => value === agentType,
            ).length;
            const neighborCount = surroundingAgentTypes.filter(
              (value) => value !== EMPTY_VALUE,
            ).length;

            if (similarCount / neighborCount < this.model.tolerance) {
              movingAgents.push(currentIndex);
            }
          }
        }
      }

      const [shorterArray, longerArray] =
        emptyCells.length < movingAgents.length
          ? [emptyCells, movingAgents]
          : [movingAgents, emptyCells];

      shuffle(shorterArray);
      shuffle(longerArray);

      for (let i = 0; i < shorterArray.length; i++) {
        const emptyCellIndex = emptyCells[i];
        const movingAgentIndex = movingAgents[i];
        if (emptyCellIndex !== movingAgentIndex) {
          this.model.grid[emptyCellIndex] = this.model.grid[movingAgentIndex];
          this.model.grid[movingAgentIndex] = EMPTY_VALUE;
        }
      }
      return this.model.grid;
    } else {
      const createEmptyCellIndicesArrayResult =
        SchellingSegregationKernelFunctions.createEmptyCellIndicesArray(
          this.model.grid,
          this.model.gridSize * this.model.gridSize,
          this.emptyCellIndices,
          EMPTY_VALUE,
        );

      this.emptyCellIndices =
        createEmptyCellIndicesArrayResult.emptyCellIndices;
      this.emptyCellIndicesLength =
        createEmptyCellIndicesArrayResult.emptyCellIndicesLength;

      this.emptyCellIndices =
        SchellingSegregationKernelFunctions.shuffleUint32Array(
          this.emptyCellIndices,
          this.emptyCellIndicesLength,
        );

      const createMovingAgentIndicesResult =
        SchellingSegregationKernelFunctions.createMovingAgentIndicesArray(
          this.model.grid,
          this.model.gridSize,
          this.model.gridSize,
          this.movingAgentIndicesArray,
          EMPTY_VALUE,
          this.model.tolerance,
        );
      this.movingAgentIndicesArray =
        createMovingAgentIndicesResult.movingAgentIndices;
      this.movingAgentIndicesArrayLength =
        createMovingAgentIndicesResult.movingAgentIndicesLength;

      this.movingAgentIndicesArray =
        SchellingSegregationKernelFunctions.shuffleUint32Array(
          this.movingAgentIndicesArray,
          this.movingAgentIndicesArrayLength,
        );

      const moveAgentAndSwapEmptyCellResult =
        SchellingSegregationKernelFunctions.moveAgentAndSwapEmptyCell(
          this.movingAgentIndicesArray,
          this.movingAgentIndicesArrayLength,
          this.emptyCellIndices,
          this.emptyCellIndicesLength,
          this.model.grid,
          EMPTY_VALUE,
        );

      this.model.grid.set(moveAgentAndSwapEmptyCellResult.grid);
      this.emptyCellIndices.set(
        moveAgentAndSwapEmptyCellResult.emptyCellIndices,
      );
    }
    return this.model.grid;
  }
}
