import { ASGPUSegregationKernelData } from './ASGPUSegregationKernelData';
import { shuffleUint32Array } from './ASSegregationKernelFunctions';

export function createSegregationKernelData(
  width: i32,
  height: i32,
  tolerance: f32,
  EMPTY_VALUE: i32,
  workgroupSizeMax: i32,
): ASGPUSegregationKernelData {
  return new ASGPUSegregationKernelData(
    width,
    height,
    tolerance,
    EMPTY_VALUE,
    workgroupSizeMax,
  );
}

export function getAgentIndices(data: ASGPUSegregationKernelData): usize {
  return data.agentIndices.dataStart;
}

export function getAgentIndicesLength(data: ASGPUSegregationKernelData): usize {
  return data.agentIndicesLength.dataStart;
}

export function getGrid(data: ASGPUSegregationKernelData): usize {
  return data.grid.dataStart;
}

export function setTolerance(
  data: ASGPUSegregationKernelData,
  tolerance: f32,
): void {
  data.tolerance = tolerance;
}

export function updateEmptyCellIndicesArray(
  data: ASGPUSegregationKernelData,
): void {
  if (data.emptyCellIndicesLength !== 0) {
    return;
  }
  const dataLength = data.width * data.height;
  data.emptyCellIndicesLength = 0;
  for (let i: i32 = 0; i < dataLength; i++) {
    if (unchecked(data.grid[i]) == data.EMPTY_VALUE) {
      unchecked((data.emptyCellIndices[data.emptyCellIndicesLength] = i));
      data.emptyCellIndicesLength++;
    }
  }
}

function compactIndicesArray(data: ASGPUSegregationKernelData): void {
  data.movingAgentIndicesLength = 0;
  for (
    let blockIndex: i32 = 0;
    blockIndex < data.agentIndicesLength.length;
    blockIndex++
  ) {
    if (data.agentIndicesLength[blockIndex] > 0) {
      const start = blockIndex * data.blockSize;
      const end = start + data.agentIndicesLength[blockIndex];
      for (let i: i32 = start; i < end; i++) {
        unchecked(
          (data.movingAgentIndices[data.movingAgentIndicesLength] =
            data.agentIndices[i]),
        );
        data.movingAgentIndicesLength++;
      }
    }
  }
}

/*
function updateMovingAgentIndicesArray(data: ASGPUSegregationKernelData): void {
  data.movingAgentIndicesLength = 0;
  const convolutionMembers = new Uint32Array(8);
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
 */

export function shuffleGridData(data: ASGPUSegregationKernelData): void {
  shuffleUint32Array(data.grid, data.width * data.height);
  data.emptyCellIndicesLength = 0;
}

function shuffleCellIndices(data: ASGPUSegregationKernelData): void {
  shuffleUint32Array(data.emptyCellIndices, data.emptyCellIndicesLength);
}

function shuffleMovingAgents(data: ASGPUSegregationKernelData): void {
  shuffleUint32Array(data.movingAgentIndices, data.movingAgentIndicesLength);
}

function moveAgentAndSwapEmptyCell(data: ASGPUSegregationKernelData): void {
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

export function tick(data: ASGPUSegregationKernelData): number {
  updateEmptyCellIndicesArray(data);
  compactIndicesArray(data);
  shuffleCellIndices(data);
  shuffleMovingAgents(data);
  moveAgentAndSwapEmptyCell(data);
  return data.movingAgentIndicesLength;
}
