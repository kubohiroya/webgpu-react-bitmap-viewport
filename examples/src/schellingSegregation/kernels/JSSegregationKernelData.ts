import { EMPTY_VALUE } from 'webgpu-react-bitmap-viewport';

export class JSSegregationKernelData {
  width: number;
  height: number;
  agentShares: number[];
  tolerance: number = 0.0;
  EMPTY_VALUE: number;

  grid: Uint32Array;
  emptyCellIndices: Uint32Array;
  emptyCellIndicesLength: number;
  movingAgentIndices!: Uint32Array;
  movingAgentIndicesLength!: number;

  constructor(
    width: number,
    height: number,
    agentShares: number[],
    tolerance: number,
  ) {
    this.width = width;
    this.height = height;
    this.agentShares = agentShares;
    this.tolerance = tolerance;

    this.grid = new Uint32Array(width * height);
    this.emptyCellIndicesLength = 0;
    this.movingAgentIndicesLength = 0;
    this.EMPTY_VALUE = EMPTY_VALUE;

    this.emptyCellIndices = new Uint32Array(width * height);
    this.movingAgentIndices = new Uint32Array(width * height);
  }
}
