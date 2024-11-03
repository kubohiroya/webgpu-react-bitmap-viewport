function unchecked(value: i32): i32 {
  return value;
}

class CreateEmptyCellIndicesArray {
  emptyCellIndices: Uint32Array;
  emptyCellIndicesLength: i32;
  constructor(emptyCellIndices: Uint32Array, emptyCellIndicesLength: i32) {
    this.emptyCellIndices = emptyCellIndices;
    this.emptyCellIndicesLength = emptyCellIndicesLength;
  }
}

export function createEmptyCellIndicesArray(
  data: Uint32Array,
  dataLength: i32,
  emptyCellIndices: Uint32Array,
  EMPTY_VALUE: i32,
): CreateEmptyCellIndicesArray {
  let emptyCellIndicesLength: i32 = 0;
  for (let i: i32 = 0; i < dataLength; i++) {
    if (unchecked(data[i]) == EMPTY_VALUE) {
      unchecked((emptyCellIndices[emptyCellIndicesLength] = i));
      emptyCellIndicesLength++;
    }
  }
  return new CreateEmptyCellIndicesArray(
    emptyCellIndices,
    emptyCellIndicesLength,
  );
}

class CreateMovingAgentIndicesArrayResult {
  movingAgentIndices: Uint32Array;
  movingAgentIndicesLength: i32;
  constructor(movingAgentIndices: Uint32Array, movingAgentIndicesLength: i32) {
    this.movingAgentIndices = movingAgentIndices;
    this.movingAgentIndicesLength = movingAgentIndicesLength;
  }
}

export function createMovingAgentIndicesArray(
  data: Uint32Array,
  width: i32,
  height: i32,
  movingAgentIndices: Uint32Array,
  EMPTY_VALUE: i32,
  tolerance: f32,
): CreateMovingAgentIndicesArrayResult {
  let movingAgentIndicesLength: i32 = 0;
  // let emptyCellIndicesLength: i32 = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const currentIndex =
        ((y + height) % height) * width + ((x + width) % width);
      const agentType = unchecked(data[currentIndex]);
      if (agentType === EMPTY_VALUE) {
        //emptyCellIndices[emptyCellIndicesLength] = i;
        //emptyCellIndicesLength++;
      } else {
        const surroundingIndices = getSurroundingIndices(x, y, width, height);
        const surroundingAgentTypes = surroundingIndices.map((index) =>
          unchecked(data[index]),
        );
        const similarCount = surroundingAgentTypes.filter(
          (value) => value === agentType,
        ).length;
        const neighborCount = surroundingAgentTypes.filter(
          (value) => value !== EMPTY_VALUE,
        ).length;

        if (similarCount / neighborCount < tolerance) {
          unchecked(
            (movingAgentIndices[movingAgentIndicesLength] = x + y * width),
          );
          movingAgentIndicesLength++;
        }
      }
    }
  }
  return new CreateMovingAgentIndicesArrayResult(
    movingAgentIndices,
    movingAgentIndicesLength,
  );
}

function getSurroundingIndices(
  x: number,
  y: number,
  width: number,
  height: number,
): number[] {
  // x, y の周囲の相対的な位置
  function getIndex(dx: i32, dy: i32) {
    // xとyの上下左右ループを考慮して、座標を計算
    const newX = (x + dx + width) % width;
    const newY = (y + dy + height) % height;
    // インデックスを計算
    return newY * width + newX;
  }

  return [
    getIndex(-1, -1),
    getIndex(0, -1),
    getIndex(1, -1), // 上の行
    getIndex(-1, 0),
    getIndex(1, 0), // 左右
    getIndex(-1, 1),
    getIndex(0, 1),
    getIndex(1, 1), // 下の行
  ];
}

class CompactIndicesArrayResult {
  movingAgentIndices: Uint32Array;
  movingAgentIndicesLength: i32;
  constructor(movingAgentIndices: Uint32Array, movingAgentIndicesLength: i32) {
    this.movingAgentIndices = movingAgentIndices;
    this.movingAgentIndicesLength = movingAgentIndicesLength;
  }
}

export function compactIndicesArray(
  movingAgentIndices: Uint32Array,
  agentIndicesLengthArray: Uint32Array,
  agentIndicesArray: Uint32Array,
  blockSize: i32,
): CompactIndicesArrayResult {
  let movingAgentIndicesLength = 0;
  for (
    let blockIndex: i32 = 0;
    blockIndex < agentIndicesLengthArray.length;
    blockIndex++
  ) {
    if (agentIndicesLengthArray[blockIndex] > 0) {
      const start = blockIndex * blockSize;
      const end = start + agentIndicesLengthArray[blockIndex];
      for (let i: i32 = start; i < end; i++) {
        unchecked(
          (movingAgentIndices[movingAgentIndicesLength] = agentIndicesArray[i]),
        );
        movingAgentIndicesLength++;
      }
    }
  }
  return new CompactIndicesArrayResult(
    movingAgentIndices,
    movingAgentIndicesLength,
  );
}

export function shuffle(data: Array<i32>): Array<i32> {
  for (let i: i32 = data.length - 1; i >= 0; i--) {
    const j: i32 = Math.floor(Math.random() * (i + 1)) as i32;
    const tmp: i32 = unchecked(data[i]);
    unchecked((data[i] = data[j]));
    unchecked((data[j] = tmp));
  }
  return data;
}

export function shuffleUint32Array(
  data: Uint32Array,
  length: i32,
): Uint32Array {
  for (let i: i32 = length - 1; i >= 0; i--) {
    const j: i32 = Math.floor(Math.random() * (i + 1)) as i32;
    const tmp: i32 = unchecked(data[i]);
    unchecked((data[i] = data[j]));
    unchecked((data[j] = tmp));
  }
  return data;
}

class MoveAgentAdnSwapEmptyCellResult {
  grid: Uint32Array;
  emptyCellIndices: Uint32Array;
  constructor(grid: Uint32Array, emptyCellIndices: Uint32Array) {
    this.grid = grid;
    this.emptyCellIndices = emptyCellIndices;
  }
}

export function moveAgentAndSwapEmptyCell(
  movingAgentIndices: Uint32Array,
  movingAgentIndicesLength: i32,
  emptyCellIndices: Uint32Array,
  emptyCellIndicesLength: i32,
  grid: Uint32Array,
  EMPTY_VALUE: i32,
): MoveAgentAdnSwapEmptyCellResult {
  const moveCount: i32 =
    emptyCellIndicesLength < movingAgentIndicesLength
      ? emptyCellIndicesLength
      : movingAgentIndicesLength;

  for (let i: i32 = 0; i < moveCount; i++) {
    const emptyIndex: i32 = unchecked(emptyCellIndices[i]);
    const agentIndex: i32 = unchecked(movingAgentIndices[i]);
    if (emptyIndex != agentIndex) {
      unchecked((grid[emptyIndex] = grid[agentIndex]));
      unchecked((grid[agentIndex] = EMPTY_VALUE));
      unchecked((emptyCellIndices[i] = agentIndex));
    }
  }
  return new MoveAgentAdnSwapEmptyCellResult(grid, emptyCellIndices);
}
