import { processConvolution } from '../utils/arrayUtil';
import { EMPTY_VALUE } from 'webgpu-react-bitmap-viewport';
import { findAgentTypeIndex } from '../SegregationKernelService';

function processCell(
  x: number,
  y: number,
  width: number,
  height: number,
  grid: Uint32Array,
  currentAgentType: number,
) {
  let neighborCount = 0;
  let similarCount = 0;
  processConvolution(x, y, width, height, (index: number) => {
    const agentType = grid[index];
    if (agentType !== EMPTY_VALUE) {
      neighborCount++;
      if (agentType === currentAgentType) {
        similarCount++;
      }
    }
  });
  return [neighborCount, similarCount];
}

type CellInfoProps = {
  focusedCell: number[];
  width: number;
  height: number;
  agentTypeCumulativeShares: number[];
  grid: Uint32Array;
};
export const CellInfo = (props: CellInfoProps) => {
  const { focusedCell, width, height, agentTypeCumulativeShares, grid } = props;

  const index =
    focusedCell[0] >= 0 && focusedCell[1] >= 0
      ? ((focusedCell[0] + width) % width) +
        ((focusedCell[1] + height) % height) * width
      : -1;

  const [neighborCount, similarCount] =
    index >= 0
      ? processCell(
          focusedCell[0],
          focusedCell[1],
          width,
          height,
          grid,
          grid[index],
        )
      : [];

  return index >= 0
    ? `cell:( ${focusedCell[0]}, ${focusedCell[1]} ),
          agentType:
            ${findAgentTypeIndex(agentTypeCumulativeShares, grid[index])}
          (neighborCount: ${neighborCount},
          similarCount: ${similarCount})`
    : null;
};
