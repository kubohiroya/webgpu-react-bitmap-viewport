import { ASGPUSegregationKernelObject } from './ASGPUSegregationKernelObject';
import { shuffleUint32Array } from './ASSegregationKernelFunctions';

export function createSegregationKernelObject(
  width: i32,
  height: i32,
  tolerance: f32,
  EMPTY_VALUE: i32,
  workgroupSizeMax: i32,
): ASGPUSegregationKernelObject {
  return new ASGPUSegregationKernelObject(
    width,
    height,
    tolerance,
    EMPTY_VALUE,
    workgroupSizeMax,
  );
}

export function getAgentIndicesPtr(
  target: ASGPUSegregationKernelObject,
): usize {
  return target.agentIndices.dataStart;
}

export function getAgentIndicesLengthPtr(
  target: ASGPUSegregationKernelObject,
): usize {
  return target.agentIndicesLength.dataStart;
}

export function getGridPtr(target: ASGPUSegregationKernelObject): usize {
  return target.grid.dataStart;
}

export function setTolerance(
  target: ASGPUSegregationKernelObject,
  tolerance: f32,
): void {
  target.tolerance = tolerance;
}

export function updateEmptyCellIndicesArray(
  target: ASGPUSegregationKernelObject,
): void {
  if (target.emptyCellIndicesLength !== 0) {
    return;
  }
  const dataLength = target.width * target.height;
  target.emptyCellIndicesLength = 0;
  for (let i: i32 = 0; i < dataLength; i++) {
    if (unchecked(target.grid[i]) == target.EMPTY_VALUE) {
      unchecked((target.emptyCellIndices[target.emptyCellIndicesLength] = i));
      target.emptyCellIndicesLength++;
    }
  }
}

function compactIndicesArray(target: ASGPUSegregationKernelObject): void {
  target.movingAgentIndicesLength = 0;
  for (
    let blockIndex: i32 = 0;
    blockIndex < target.agentIndicesLength.length;
    blockIndex++
  ) {
    if (target.agentIndicesLength[blockIndex] > 0) {
      const start = blockIndex * target.blockSize;
      const end = start + target.agentIndicesLength[blockIndex];
      for (let i: i32 = start; i < end; i++) {
        unchecked(
          (target.movingAgentIndices[target.movingAgentIndicesLength] =
            target.agentIndices[i]),
        );
        target.movingAgentIndicesLength++;
      }
    }
  }
}

/*
function updateMovingAgentIndicesArray(target: ASGPUSegregationKernelData): void {
  target.movingAgentIndicesLength = 0;
  const convolutionMembers = new Uint32Array(8);
  for (let y: i32 = 0; y < target.height; y++) {
    for (let x: i32 = 0; x < target.width; x++) {
      const currentIndex = x + y * target.width;
      const agentType = unchecked(target.grid[currentIndex]);
      if (agentType !== target.EMPTY_VALUE) {
        const similarity = calcSimilarity(
          x,
          y,
          target.width,
          target.height,
          target.grid,
          convolutionMembers,
          target.EMPTY_VALUE,
        );
        if (similarity < target.tolerance) {
          unchecked(
            (target.movingAgentIndices[target.movingAgentIndicesLength] =
              currentIndex),
          );
          target.movingAgentIndicesLength++;
        }
      }
    }
  }
}
 */

export function shuffleGridData(target: ASGPUSegregationKernelObject): void {
  shuffleUint32Array(target.grid, target.width * target.height);
  target.emptyCellIndicesLength = 0;
}

function shuffleCellIndices(target: ASGPUSegregationKernelObject): void {
  shuffleUint32Array(target.emptyCellIndices, target.emptyCellIndicesLength);
}

function shuffleMovingAgents(target: ASGPUSegregationKernelObject): void {
  shuffleUint32Array(
    target.movingAgentIndices,
    target.movingAgentIndicesLength,
  );
}

function moveAgentAndSwapEmptyCell(target: ASGPUSegregationKernelObject): void {
  const moveCount =
    target.emptyCellIndicesLength < target.movingAgentIndicesLength
      ? target.emptyCellIndicesLength
      : target.movingAgentIndicesLength;

  for (let i: i32 = 0; i < moveCount; i++) {
    const emptyIndex: i32 = unchecked(target.emptyCellIndices[i]);
    const agentIndex: i32 = unchecked(target.movingAgentIndices[i]);
    if (emptyIndex !== agentIndex) {
      unchecked((target.grid[emptyIndex] = target.grid[agentIndex]));
      unchecked((target.grid[agentIndex] = target.EMPTY_VALUE));
      unchecked((target.emptyCellIndices[i] = agentIndex));
    }
  }
}

export function tick(target: ASGPUSegregationKernelObject): number {
  compactIndicesArray(target);
  shuffleCellIndices(target);
  shuffleMovingAgents(target);
  moveAgentAndSwapEmptyCell(target);
  return target.movingAgentIndicesLength;
}
