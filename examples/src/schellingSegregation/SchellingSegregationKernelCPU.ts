import { EMPTY_VALUE } from 'webgpu-react-bitmap-viewport';
import { SchellingSegregationKernel } from './SchellingSegregationKernel';

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

    for (let y = 0; y < this.model.gridSize; y++) {
      for (let x = 0; x < this.model.gridSize; x++) {
        const currentIndex = y * this.model.gridSize + x;
        const agentType = this.model.gridData[currentIndex];
        if (agentType === EMPTY_VALUE) {
          continue;
        }
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
          // console.log('replace ' + tolerance.current + ' ' + currentIndex);

          const randomIndex = Math.floor(
            Math.random() * this.model.cellIndices.length,
          );
          const emptyCellIndex = this.model.cellIndices[randomIndex];
          if (this.model.gridData[emptyCellIndex] === EMPTY_VALUE) {
            this.model.gridData[emptyCellIndex] = agentType;
            this.model.gridData[currentIndex] = EMPTY_VALUE;
            this.model.cellIndices[randomIndex] = currentIndex;
          }
        }
      }
    }

    return this.model.gridData;
  };
}
