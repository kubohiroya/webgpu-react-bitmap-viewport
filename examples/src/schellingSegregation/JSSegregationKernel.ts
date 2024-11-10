import { EMPTY_VALUE } from 'webgpu-react-bitmap-viewport';
import { SegregationKernel } from './SegregationKernel';
import { SegregationUIState } from './SegregationUIState';
import { JSSegregationKernelData } from './JSSegregationKernelData';
import { shuffleUint32Array } from './utils/arrayUtils';

export class JSSegregationKernel extends SegregationKernel {
  protected data!: JSSegregationKernelData;

  constructor(uiState: SegregationUIState) {
    super(uiState);
  }

  updateGridSize(
    width: number,
    height: number,
    agentShares: number[],
    tolerance: number,
  ) {
    this.data = new JSSegregationKernelData(
      width,
      height,
      agentShares,
      tolerance,
    );
    this.uiState.updateSize(width, height);
  }

  syncGridContent(grid: Uint32Array) {
    this.data.grid.set(grid);
  }

  shuffleGridContent() {
    shuffleUint32Array(this.data.grid, this.data.width * this.data.height);
  }

  updateEmptyCellIndices(_emptyCellIndices?: Uint32Array) {
    const emptyCellIndices = _emptyCellIndices
      ? _emptyCellIndices
      : this.data.emptyCellIndices;
    this.data.emptyCellIndicesLength = 0;
    for (let y = 0; y < this.data.height; y++) {
      for (let x = 0; x < this.data.width; x++) {
        const currentIndex = y * this.data.width + x;
        const agentType = this.data.grid[currentIndex];
        if (agentType === EMPTY_VALUE) {
          emptyCellIndices[this.data.emptyCellIndicesLength] = currentIndex;
          this.data.emptyCellIndicesLength++;
        }
      }
    }
  }

  processConvolution(
    x: number,
    y: number,
    width: number,
    height: number,
    callback: (index: number) => void,
  ): void {
    // x, y の周囲の相対的な位置
    [
      [-1, -1],
      [0, -1],
      [1, -1], // 上の行
      [-1, 0],
      [1, 0], // 左右
      [-1, 1],
      [0, 1],
      [1, 1], // 下の行
    ].forEach(([dx, dy]) => {
      // xとyの上下左右ループを考慮して、座標を計算
      const newX = (x + dx + width) % width;
      const newY = (y + dy + height) % height;
      // インデックスを計算
      callback(newY * width + newX);
    });
  }

  moveAgentAndSwapEmptyCell(
    grid: Uint32Array,
    emptyCellIndices: Uint32Array,
    emptyCellIndicesLength: number,
    movingAgentIndices: Uint32Array,
    movingAgentIndicesLength: number,
  ) {
    // Perform moving based on movingAgentIndices and emptyCellIndices
    const length = Math.min(emptyCellIndicesLength, movingAgentIndicesLength);

    // Perform moving based on movingAgentIndices and emptyCellIndices
    for (let i = 0; i < length; i++) {
      const emptyIndex = emptyCellIndices[i];
      const agentIndex = movingAgentIndices[i];
      if (emptyIndex !== agentIndex) {
        grid[emptyIndex] = grid[agentIndex];
        grid[agentIndex] = EMPTY_VALUE;
        emptyCellIndices[i] = agentIndex;
      } else {
        throw new Error(`${i} ${emptyIndex} == ${agentIndex}`);
      }
    }
  }

  async tick() {
    this.data.movingAgentIndicesLength = 0;

    for (let y = 0; y < this.data.height; y++) {
      for (let x = 0; x < this.data.width; x++) {
        const currentIndex = y * this.data.width + x;
        const currentAgentType = this.data.grid[currentIndex];
        if (currentAgentType !== EMPTY_VALUE) {
          let neighborCount = 0;
          let similarCount = 0;
          this.processConvolution(
            x,
            y,
            this.data.width,
            this.data.height,
            (index) => {
              const agentType = this.data.grid[index];
              if (agentType !== EMPTY_VALUE) {
                neighborCount++;
                if (agentType === currentAgentType) {
                  similarCount++;
                }
              }
            },
          );
          if (
            neighborCount === 0 ||
            similarCount / neighborCount < this.data.tolerance
          ) {
            this.data.movingAgentIndices[this.data.movingAgentIndicesLength] =
              currentIndex;
            this.data.movingAgentIndicesLength++;
          }
        }
      }
    }

    shuffleUint32Array(
      this.data.emptyCellIndices,
      this.data.emptyCellIndicesLength,
    );

    shuffleUint32Array(
      this.data.movingAgentIndices,
      this.data.movingAgentIndicesLength,
    );

    this.moveAgentAndSwapEmptyCell(
      this.data.grid,
      this.data.emptyCellIndices,
      this.data.emptyCellIndicesLength,
      this.data.movingAgentIndices,
      this.data.movingAgentIndicesLength,
    );
    return this.data.grid;
  }

  getGrid(): Uint32Array {
    return this.data.grid;
  }

  getWidth(): number {
    return this.data.width;
  }

  getHeight(): number {
    return this.data.height;
  }

  getAgentShares(): number[] {
    return this.data.agentShares;
  }

  setTolerance(newTolerance: number) {
    this.data.tolerance = newTolerance;
  }
}
