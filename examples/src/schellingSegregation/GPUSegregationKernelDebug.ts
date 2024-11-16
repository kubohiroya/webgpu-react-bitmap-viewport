import { createInitialGridData } from './SegregationKernelService';
import {
  cumulativeSum,
  printGrid,
  shuffleUint32Array,
} from './utils/arrayUtil';
const EMPTY_VALUE: number = 999;

const width: number = 8;
const height: number = 8;
const workgroupSizeMax = 4;
const workgroupSize: number = Math.min(width, workgroupSizeMax);
const dispatchSize: number = Math.min(height, workgroupSizeMax);
const blockWidth: number = Math.ceil(width / workgroupSize);
const blockHeight: number = Math.ceil(height / dispatchSize);
const blockSize: number = blockWidth * blockHeight;
const mooreNeighborhoodRange: number = 1;
const mooreNeighborhoodSize: number = mooreNeighborhoodRange * 2 + 1;
const blockWidthWithGhostZone: number = blockWidth + mooreNeighborhoodRange * 2;

let agentIndices = new Uint32Array(width * height);
let agentIndicesLength = new Uint32Array(workgroupSize);

type Params = {
  tolerance: number;
};

let params: Params = {
  tolerance: 0.5,
};
let random: Float32Array;
let emptyCellIndices: Uint32Array;
let movingAgentIndices: Uint32Array;

let grid = createInitialGridData(
  width,
  height,
  cumulativeSum([0.4, 0.4]),
  EMPTY_VALUE,
);

function countSimilarNeighbor(
  rowCache: number[][],
  localX: number,
  localY: number,
  agentType: number,
): [number, number] {
  const value =
    rowCache[(localY + mooreNeighborhoodRange) % mooreNeighborhoodSize][localX];
  return [value === agentType ? 1 : 0, value !== EMPTY_VALUE ? 1 : 0];
}

function countSimilarNeighbors(
  rowCache: number[][],
  localX: number,
  localY: number,
  agentType: number,
): [number, number] {
  if (mooreNeighborhoodSize === 3) {
    return addVectors(
      countSimilarNeighbor(rowCache, localX, localY, agentType),
      countSimilarNeighbor(rowCache, localX + 1, localY, agentType),
      countSimilarNeighbor(rowCache, localX + 2, localY, agentType),
      countSimilarNeighbor(rowCache, localX, localY + 1, agentType),
      countSimilarNeighbor(rowCache, localX + 2, localY + 1, agentType),
      countSimilarNeighbor(rowCache, localX, localY + 2, agentType),
      countSimilarNeighbor(rowCache, localX + 1, localY + 2, agentType),
      countSimilarNeighbor(rowCache, localX + 2, localY + 2, agentType),
    );
  } else if (mooreNeighborhoodSize === 5) {
    return addVectors(
      countSimilarNeighbor(rowCache, localX, localY, agentType),
      countSimilarNeighbor(rowCache, localX + 1, localY, agentType),
      countSimilarNeighbor(rowCache, localX + 2, localY, agentType),
      countSimilarNeighbor(rowCache, localX + 3, localY, agentType),
      countSimilarNeighbor(rowCache, localX + 4, localY, agentType),
      countSimilarNeighbor(rowCache, localX, localY + 1, agentType),
      countSimilarNeighbor(rowCache, localX + 1, localY + 1, agentType),
      countSimilarNeighbor(rowCache, localX + 2, localY + 1, agentType),
      countSimilarNeighbor(rowCache, localX + 3, localY + 1, agentType),
      countSimilarNeighbor(rowCache, localX + 4, localY + 1, agentType),
      countSimilarNeighbor(rowCache, localX, localY + 2, agentType),
      countSimilarNeighbor(rowCache, localX + 1, localY + 2, agentType),
      countSimilarNeighbor(rowCache, localX + 3, localY + 2, agentType),
      countSimilarNeighbor(rowCache, localX + 4, localY + 2, agentType),
      countSimilarNeighbor(rowCache, localX, localY + 3, agentType),
      countSimilarNeighbor(rowCache, localX + 1, localY + 3, agentType),
      countSimilarNeighbor(rowCache, localX + 2, localY + 3, agentType),
      countSimilarNeighbor(rowCache, localX + 3, localY + 3, agentType),
      countSimilarNeighbor(rowCache, localX + 4, localY + 3, agentType),
      countSimilarNeighbor(rowCache, localX, localY + 4, agentType),
      countSimilarNeighbor(rowCache, localX + 1, localY + 4, agentType),
      countSimilarNeighbor(rowCache, localX + 2, localY + 4, agentType),
      countSimilarNeighbor(rowCache, localX + 3, localY + 4, agentType),
      countSimilarNeighbor(rowCache, localX + 4, localY + 4, agentType),
    );
  } else {
    let result: [number, number] = [0, 0];
    for (let y = 0; y < mooreNeighborhoodRange; y++) {
      for (let x = 0; x < mooreNeighborhoodRange; x++) {
        result = addVectors(
          result,
          countSimilarNeighbor(rowCache, localX + x, localY + y, agentType),
          countSimilarNeighbor(
            rowCache,
            localX + mooreNeighborhoodSize - 1 - x,
            localY + y,
            agentType,
          ),
          countSimilarNeighbor(
            rowCache,
            localX + x,
            localY + mooreNeighborhoodSize - 1 - y,
            agentType,
          ),
          countSimilarNeighbor(
            rowCache,
            localX + mooreNeighborhoodSize - 1 - x,
            localY + mooreNeighborhoodSize - 1 - y,
            agentType,
          ),
        );
      }
      result = addVectors(
        result,
        countSimilarNeighbor(
          rowCache,
          localX + mooreNeighborhoodRange,
          localY + y,
          agentType,
        ),
        countSimilarNeighbor(
          rowCache,
          localX + mooreNeighborhoodRange,
          localY + mooreNeighborhoodSize - 1 - y,
          agentType,
        ),
        countSimilarNeighbor(
          rowCache,
          localX + y,
          localY + mooreNeighborhoodRange,
          agentType,
        ),
        countSimilarNeighbor(
          rowCache,
          localX + mooreNeighborhoodSize - 1 - y,
          localY + mooreNeighborhoodRange,
          agentType,
        ),
      );
    }
    return result;
  }
}

function addVectors(...vectors: [number, number][]): [number, number] {
  return vectors.reduce(
    (acc, curr) => [acc[0] + curr[0], acc[1] + curr[1]],
    [0, 0],
  );
}

function main(workgroupId: number, localId: number) {
  const workgroupIndex = workgroupId;
  const threadIndex = localId;
  const blockStartX = workgroupIndex * blockWidth;

  if (blockStartX < width) {
    const blockStartY = threadIndex * blockHeight;
    const workItemIndex = workgroupIndex * dispatchSize + threadIndex;
    const rowCache: number[][] = Array.from(
      { length: mooreNeighborhoodSize },
      () => Array.from<number>({ length: blockWidthWithGhostZone }).fill(0),
    );

    // const rowCacheIndex = new Array(mooreNeighborhoodSize);

    for (let localY = 0; localY < mooreNeighborhoodSize - 1; localY++) {
      const y =
        (blockStartY + localY + height - mooreNeighborhoodRange) % height;
      const rowY = localY % mooreNeighborhoodSize;

      for (let localX = 0; localX < blockWidthWithGhostZone; localX++) {
        const x =
          (blockStartX + localX + width - mooreNeighborhoodRange) % width;
        rowCache[rowY][localX] = grid[y * width + x];
      }
    }

    const agentIndexBase = workItemIndex * blockSize;
    let agentCounter = 0;

    for (
      let localY = 0;
      localY < blockHeight && blockStartY + localY < height;
      localY++
    ) {
      const y = (blockStartY + localY + height) % height;
      const nextY = (blockStartY + localY + height + 1) % height;

      const lastRowY =
        (localY + mooreNeighborhoodSize - 1) % mooreNeighborhoodSize;

      for (let localX = 0; localX < blockWidthWithGhostZone; localX++) {
        const x =
          (blockStartX + localX + width - mooreNeighborhoodRange) % width;
        rowCache[lastRowY][localX] = grid[nextY * width + x];
      }

      // print2DMatrix(rowCache, blockWidthWithGhostZone, mooreNeighborhoodSize);

      const firstRowY = localY % mooreNeighborhoodSize;
      const centerRowY =
        (localY + mooreNeighborhoodRange) % mooreNeighborhoodSize;

      for (
        let localX = 0;
        localX < blockWidth && blockStartX + localX < width;
        localX++
      ) {
        const centerColX = localX + mooreNeighborhoodRange;
        const agentType = rowCache[centerRowY][centerColX];
        console.log(
          [blockStartX + localX, y],
          [centerColX, centerRowY],
          agentType,
        );
        if (agentType === EMPTY_VALUE) {
          continue;
        }

        const neighbors = countSimilarNeighbors(
          rowCache,
          localX,
          firstRowY,
          agentType,
        );
        const similarCount = neighbors[0];
        const totalNeighbors = neighbors[1];

        if (
          totalNeighbors === 0 ||
          similarCount / totalNeighbors < params.tolerance
        ) {
          // Write the unsatisfied agent's original index
          const globalX = blockStartX + localX;
          agentIndices[agentIndexBase + agentCounter] =
            (blockStartY + localY) * width + globalX;
          agentCounter++;
        }
      }
    }
    agentIndicesLength[workItemIndex] = agentCounter;
  }
}

shuffleUint32Array(grid, width * height);
printGrid(grid, width, height);

for (let i = 0; i < workgroupSize; i++) {
  for (let j = 0; j < dispatchSize; j++) {
    main(i, j);
  }
}

console.log({ blockSize, workgroupSize, dispatchSize });
printGrid(
  agentIndices,
  Math.ceil((width * height) / workgroupSize),
  workgroupSize,
);
console.log({ agentIndices, agentIndicesLength });
