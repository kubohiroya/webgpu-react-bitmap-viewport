import { SchellingSegregationModes } from './SchellingSegregationShellProps';

export type SchellingSegregationModelProps = {
  mode: SchellingSegregationModes;
  gridSize: number;
  agentTypeShares: number[];
  tolerance: number;
  frameCount?: number;
};
