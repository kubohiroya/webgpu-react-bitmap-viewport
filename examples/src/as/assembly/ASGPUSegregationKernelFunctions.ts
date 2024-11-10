import { ASGPUSegregationKernelData } from './ASGPUSegregationKernelData';

@inline
function shuffleUint32Array(
  data: StaticArray<u32>,
  length: i32,
): void {
  for (let i: i32 = 0; i < length; i++) {
    const j: i32 = Mathf.floor(Mathf.random() * f32(i + 1)) as i32;
    const tmp: u32 = unchecked(data[i]);
    unchecked((data[i] = data[j]));
    unchecked((data[j] = tmp));
  }
}

@inline
function shuffleInt32Array(
  data: StaticArray<i32>,
  length: i32,
): void {
  for (let i: i32 = 0; i < length; i++) {
    const j: i32 = Mathf.floor(Mathf.random() * f32(i + 1)) as i32;
    const tmp: i32 = unchecked(data[i]);
    unchecked((data[i] = data[j]));
    unchecked((data[j] = tmp));
  }
}

@inline
function getIndex(
  dx: i32,
  dy: i32,
  x: i32,
  y: i32,
  width: i32,
  height: i32,
): i32 {
  // xとyの上下左右ループを考慮して、座標を計算
  const newX = (x + dx + width) % width;
  const newY = (y + dy + height) % height;
  // インデックスを計算
  return newY * width + newX;
}

@inline
function calcSimilarity(
  x: i32,
  y: i32,
  width: i32,
  height: i32,
  data: StaticArray<u32>,
  convolutionMembers: StaticArray<u32>,
  EMPTY_VALUE: i32,
): f32 {
  // x, y の周囲の相対的な位置
  unchecked(convolutionMembers[0] = unchecked(data[getIndex(-1, -1, x, y, width, height)]));
  unchecked(convolutionMembers[1] = unchecked(data[getIndex(0, -1, x, y, width, height)]));
  unchecked(convolutionMembers[2] = unchecked(data[getIndex(1, -1, x, y, width, height)]));
  unchecked(convolutionMembers[3] = unchecked(data[getIndex(-1, 0, x, y, width, height)]));
  unchecked(convolutionMembers[4] = unchecked(data[getIndex(1, 0, x, y, width, height)]));
  unchecked(convolutionMembers[5] = unchecked(data[getIndex(-1, 1, x, y, width, height)]));
  unchecked(convolutionMembers[6] = unchecked(data[getIndex(0, 1, x, y, width, height)]));
  unchecked(convolutionMembers[7] = unchecked(data[getIndex(1, 1, x, y, width, height)]));
  const targetAgent: u32 = unchecked(data[y * width + x]);
  let similarCount: i32 = 0;
  let neighborCount: i32 = 0;
  for (let i = 0; i < convolutionMembers.length; i++) {
    const memberAgent = unchecked(convolutionMembers[i]);
    if (memberAgent !== EMPTY_VALUE) {
      neighborCount++;
      if (memberAgent === targetAgent) {
        similarCount++;
      }
    }
  }

  return f32(similarCount) / f32(neighborCount);
}

export function getWidth(data: ASGPUSegregationKernelData): i32 {
  return data.width;
}
export function getHeight(data: ASGPUSegregationKernelData): i32 {
  return data.height;
}

export function getAgentShares(data: ASGPUSegregationKernelData): Array<f32> {
  return data.agentShares;
}

export function getGrid(data: ASGPUSegregationKernelData): StaticArray<u32> {
  return data.grid;
}

export function setGrid(
  data: ASGPUSegregationKernelData,
  grid: Array<u32>,
): void {
  data.grid = StaticArray.fromArray<u32>(grid);
}

export function setTolerance(
  data: ASGPUSegregationKernelData,
  tolerance: f32,
): void {
  data.tolerance = tolerance;
}

export function getEmptyCellIndices(
  data: ASGPUSegregationKernelData,
): StaticArray<i32> {
  return data.emptyCellIndices;
}
export function getMovingAgentIndices(
  data: ASGPUSegregationKernelData,
): StaticArray<i32> {
  return data.movingAgentIndices;
}
export function getEmptyCellIndicesLength(
  data: ASGPUSegregationKernelData,
): i32 {
  return data.emptyCellIndicesLength;
}
export function getMovingAgentIndicesLength(
  data: ASGPUSegregationKernelData,
): i32 {
  return data.movingAgentIndicesLength;
}

export function createSegregationKernelData(
  width: i32,
  height: i32,
  agentShares: Array<f32>,
  tolerance: f32,
  workgroupSize: i32,
  EMPTY_VALUE: i32,
): ASGPUSegregationKernelData {
  return new ASGPUSegregationKernelData(
    width,
    height,
    agentShares,
    tolerance,
    workgroupSize,
    EMPTY_VALUE,
  );
}

export function compactIndicesArray(
  data: ASGPUSegregationKernelData,
  blockSize: i32,
): void {
  data.movingAgentIndicesLength = 0;
  for (
    let blockIndex: i32 = 0;
    blockIndex < data.agentIndicesLengthArray.length;
    blockIndex++
  ) {
    if (data.agentIndicesLengthArray[blockIndex] > 0) {
      const start = blockIndex * blockSize;
      const end = start + data.agentIndicesLengthArray[blockIndex];
      for (let i: i32 = start; i < end; i++) {
        unchecked(
          (data.movingAgentIndices[data.movingAgentIndicesLength] =
            data.agentIndicesArray[i]),
        );
        data.movingAgentIndicesLength++;
      }
    }
  }
}
export function updateEmptyCellIndicesArray(
  data: ASGPUSegregationKernelData,
): void {
  const dataLength = data.width * data.height;
  data.emptyCellIndicesLength = 0;
  for (let i: i32 = 0; i < dataLength; i++) {
    if (unchecked(data.grid[i]) == data.EMPTY_VALUE) {
      unchecked((data.emptyCellIndices[data.emptyCellIndicesLength] = i));
      data.emptyCellIndicesLength++;
    }
  }
}

export function updateMovingAgentIndicesArray(
  data: ASGPUSegregationKernelData,
): void {
  data.movingAgentIndicesLength = 0;
  const convolutionMembers = new StaticArray<u32>(8);
  for (let y: i32 = 0; y < data.height; y++) {
    for (let x: i32 = 0; x < data.width; x++) {
      const currentIndex = x + y * data.width;
      const agentType = unchecked(data.grid[currentIndex]);
      if (agentType !== data.EMPTY_VALUE) {
        const similarity = calcSimilarity(
          x,
          y,
          data.width,
          data.height,
          data.grid,
          convolutionMembers,
          data.EMPTY_VALUE,
        );
        if (similarity < data.tolerance) {
          unchecked(
            (data.movingAgentIndices[data.movingAgentIndicesLength] =
              currentIndex),
          );
          data.movingAgentIndicesLength++;
        }
      }
    }
  }
}

export function shuffleGridData(data: ASGPUSegregationKernelData): void {
  shuffleUint32Array(data.grid, data.width * data.height);
}

export function shuffleCellIndices(data: ASGPUSegregationKernelData): void {
  shuffleInt32Array(data.emptyCellIndices, data.emptyCellIndicesLength);
}

export function shuffleMovingAgents(data: ASGPUSegregationKernelData): void {
  shuffleInt32Array(data.movingAgentIndices, data.movingAgentIndicesLength);
}

export function moveAgentAndSwapEmptyCell(
  data: ASGPUSegregationKernelData,
): void {
  const moveCount =
    data.emptyCellIndicesLength < data.movingAgentIndicesLength
      ? data.emptyCellIndicesLength
      : data.movingAgentIndicesLength;

  for (let i: i32 = 0; i < moveCount; i++) {
    const emptyIndex: i32 = unchecked(data.emptyCellIndices[i]);
    const agentIndex: i32 = unchecked(data.movingAgentIndices[i]);
    if (emptyIndex !== agentIndex) {
      unchecked((data.grid[emptyIndex] = data.grid[agentIndex]));
      unchecked((data.grid[agentIndex] = data.EMPTY_VALUE));
      unchecked((data.emptyCellIndices[i] = agentIndex));
    }
  }
}

export function tick(data: ASGPUSegregationKernelData): StaticArray<u32> {
  updateEmptyCellIndicesArray(data);
  updateMovingAgentIndicesArray(data);
  shuffleCellIndices(data);
  shuffleMovingAgents(data);
  moveAgentAndSwapEmptyCell(data);
  return data.grid;
}
