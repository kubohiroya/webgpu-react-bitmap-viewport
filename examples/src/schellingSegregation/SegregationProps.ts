import { SegregationModes } from './SegregationUIProps';

export type SegregationProps = {
  mode: SegregationModes;
  gridSize: number;
  agentTypeShares: number[];
  tolerance: number;
  seed?: string;
};
