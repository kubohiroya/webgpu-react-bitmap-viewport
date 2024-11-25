import { reverseCumulativeSum } from '../utils/arrayUtil';

export function findAgentTypeIndex(
  agentTypeValues: number[],
  value: number,
  EMPTY_VALUE = 0,
): number {
  return createAgentTypeValues(agentTypeValues, EMPTY_VALUE).findIndex(
    (v) => v == value,
  );
}

export function createAgentTypeValues(
  agentTypeCumulativeShares: number[],
  EMPTY_VALUE = 0,
): number[] {
  return agentTypeCumulativeShares
    .map((share: number) => Math.floor(255 * share))
    .concat(EMPTY_VALUE);
}

export const createInitialGridData = (
  width: number,
  height: number,
  agentTypeCumulativeShares: number[],
  EMPTY_VALUE = 0,
): Uint32Array => {
  const numCells = width * height;
  const agentTypeValues = createAgentTypeValues(
    agentTypeCumulativeShares,
    EMPTY_VALUE,
  );

  const _agentTypeCounts = reverseCumulativeSum(agentTypeCumulativeShares).map(
    (share) => Math.floor(numCells * share),
  );
  const numEmptyCell = numCells - _agentTypeCounts.reduce((a, b) => a + b, 0);
  if (numEmptyCell < 0) {
    throw new Error('The sum of agentTypeShares is over 1.0');
  }
  const agentTypeCounts =
    numEmptyCell > 0 ? _agentTypeCounts.concat(numEmptyCell) : _agentTypeCounts;

  let start = 0; // 各valueに対応する個数を挿入
  const grid = new Uint32Array(numCells);
  agentTypeValues.forEach((value: number, index: number) => {
    const length = agentTypeCounts[index];
    grid.fill(value, start, start + length);
    start += length;
  });
  return grid;
};
