import { EMPTY_VALUE } from 'webgpu-react-bitmap-viewport';
import { SchellingSegregationKernel } from './SchellingSegregationKernel';
import { findIndices, shuffle, shuffleUint32Array } from './arrayUtils';

export class SchellingSegregationKernelCPU extends SchellingSegregationKernel {
  updateGridData = async () => {
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

    const emptyCells: number[] = [];
    const movingAgents: number[] = [];

    for (let y = 0; y < this.model.gridSize; y++) {
      for (let x = 0; x < this.model.gridSize; x++) {
        const currentIndex = y * this.model.gridSize + x;
        const agentType = this.model.gridData[currentIndex];
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
            (index) => this.model.gridData[index],
          );
          const similarCount = surroundingAgentTypes.filter(
            (value) => value === agentType,
          ).length;
          const neighborCount = surroundingAgentTypes.filter(
            (value) => value !== EMPTY_VALUE,
          ).length;

          if (
            neighborCount > 0 &&
            similarCount / neighborCount < this.model.tolerance
          ) {
            movingAgents.push(currentIndex);
          }
        }
      }
    }

    const [shorterArray, longerArray] =
      emptyCells.length < movingAgents.length
        ? [emptyCells, movingAgents]
        : [movingAgents, emptyCells];

    shuffle(shorterArray, shorterArray.length);
    shuffle(longerArray, longerArray.length);

    for (let i = 0; i < shorterArray.length; i++) {
      const emptyCellIndex = emptyCells[i];
      const movingAgentIndex = movingAgents[i];
      if (emptyCellIndex !== movingAgentIndex) {
        this.model.gridData[emptyCellIndex] =
          this.model.gridData[movingAgentIndex];
        this.model.gridData[movingAgentIndex] = EMPTY_VALUE;
      }
    }

    return this.model.gridData;
  };
}
