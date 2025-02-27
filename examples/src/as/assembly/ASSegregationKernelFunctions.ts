import { ASSegregationKernelObject } from './ASSegregationKernelObject';

// @ts-ignore
@inline
export function shuffleUint32Array(data: Uint32Array, length: i32): void {
  for (let i: i32 = 0; i < length; i++) {
    const j: i32 = Mathf.floor(Mathf.random() * f32(i + 1)) as i32;
    const tmp: u32 = unchecked(data[i]);
    unchecked((data[i] = data[j]));
    unchecked((data[j] = tmp));
  }
}

// @ts-ignore
@inline
function getIndex(
  dx: i32,
  dy: i32,
  x: i32,
  y: i32,
  width: i32,
  height: i32,
): i32 {
  const newX = (x + dx + width) % width;
  const newY = (y + dy + height) % height;
  return newY * width + newX;
}

// @ts-ignore
@inline
export function calcSimilarity(
  x: i32,
  y: i32,
  width: i32,
  height: i32,
  data: Uint32Array,
  convolutionMembers: Uint32Array,
  EMPTY_VALUE: i32,
): f32 {
  // x, y の周囲の相対的な位置
  unchecked(
    (convolutionMembers[0] = unchecked(
      data[getIndex(-1, -1, x, y, width, height)],
    )),
  );
  unchecked(
    (convolutionMembers[1] = unchecked(
      data[getIndex(0, -1, x, y, width, height)],
    )),
  );
  unchecked(
    (convolutionMembers[2] = unchecked(
      data[getIndex(1, -1, x, y, width, height)],
    )),
  );
  unchecked(
    (convolutionMembers[3] = unchecked(
      data[getIndex(-1, 0, x, y, width, height)],
    )),
  );
  unchecked(
    (convolutionMembers[4] = unchecked(
      data[getIndex(1, 0, x, y, width, height)],
    )),
  );
  unchecked(
    (convolutionMembers[5] = unchecked(
      data[getIndex(-1, 1, x, y, width, height)],
    )),
  );
  unchecked(
    (convolutionMembers[6] = unchecked(
      data[getIndex(0, 1, x, y, width, height)],
    )),
  );
  unchecked(
    (convolutionMembers[7] = unchecked(
      data[getIndex(1, 1, x, y, width, height)],
    )),
  );
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

  if (neighborCount === 0) {
    return 0.0;
  } else {
    return f32(similarCount) / f32(neighborCount);
  }
}

export function createSegregationKernelObject(
  width: i32,
  height: i32,
  tolerance: f32,
  EMPTY_VALUE: i32,
): ASSegregationKernelObject {
  return new ASSegregationKernelObject(
    width,
    height,
    tolerance,
    EMPTY_VALUE,
  );
}

export function getGridPtr(target: ASSegregationKernelObject): usize {
  return target.grid.dataStart;
}

export function setTolerance(
  target: ASSegregationKernelObject,
  tolerance: f32,
): void {
  target.tolerance = tolerance;
}

export function updateEmptyCellIndicesArray(
  target: ASSegregationKernelObject,
): void {
  if (target.emptyCellIndicesLength !== 0) {
    return;
  }
  const dataLength = target.width * target.height;
  for (let i: i32 = 0; i < dataLength; i++) {
    if (unchecked(target.grid[i]) === target.EMPTY_VALUE) {
      unchecked((target.emptyCellIndices[target.emptyCellIndicesLength] = i));
      target.emptyCellIndicesLength++;
    }
  }
}

function updateMovingAgentIndicesArray(
  target: ASSegregationKernelObject,
): void {
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

export function shuffleGridData(target: ASSegregationKernelObject): void {
  shuffleUint32Array(target.grid, target.width * target.height);
  target.emptyCellIndicesLength = 0;
}

function shuffleCellIndices(target: ASSegregationKernelObject): void {
  shuffleUint32Array(target.emptyCellIndices, target.emptyCellIndicesLength);
}

function shuffleMovingAgents(target: ASSegregationKernelObject): void {
  shuffleUint32Array(
    target.movingAgentIndices,
    target.movingAgentIndicesLength,
  );
}

function moveAgentAndSwapEmptyCell(target: ASSegregationKernelObject): void {
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

export function tick(target: ASSegregationKernelObject): i32 {
  updateMovingAgentIndicesArray(target);
  shuffleCellIndices(target);
  shuffleMovingAgents(target);
  moveAgentAndSwapEmptyCell(target);
  return target.movingAgentIndicesLength;
}
