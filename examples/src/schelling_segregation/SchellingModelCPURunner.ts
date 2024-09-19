import { EMPTY_VALUE } from 'webgpu-react-grid';

export const SchellingModelCPURunner =
  (
    gridSize: { numRows: number; numColumns: number },
    tolerance: number,
    gridData: Uint32Array,
    emptyGridIndices: Uint32Array
  ) =>
  async () => {
    function getSurroundingIndices(
      x: number,
      y: number,
      width: number,
      height: number
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

    for (let y = 0; y < gridSize.numRows; y++) {
      for (let x = 0; x < gridSize.numColumns; x++) {
        const currentIndex = y * gridSize.numColumns + x;
        const agentType = gridData[currentIndex];
        if (agentType === EMPTY_VALUE) {
          continue;
        }
        const surroundingIndices = getSurroundingIndices(
          x,
          y,
          gridSize.numColumns,
          gridSize.numRows
        );
        const surroundingAgentTypes = surroundingIndices.map(
          (index) => gridData[index]
        );
        const similarCount = surroundingAgentTypes.filter(
          (value) => value === agentType
        ).length;
        const neighborCount = surroundingAgentTypes.filter(
          (value) => value !== EMPTY_VALUE
        ).length;
        if (neighborCount > 0 && similarCount / neighborCount < tolerance) {
          const randomIndex = Math.floor(
            Math.random() * emptyGridIndices.length
          );
          const emptyGridIndex = emptyGridIndices[randomIndex];
          if (gridData[emptyGridIndex] === EMPTY_VALUE) {
            gridData[emptyGridIndex] = agentType;
            gridData[currentIndex] = EMPTY_VALUE;
            emptyGridIndices[randomIndex] = currentIndex;
          }
        }
      }
    }

    return gridData;
  };
