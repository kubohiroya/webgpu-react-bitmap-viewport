export class ASSegregationKernelData {
  width: i32;
  height: i32;
  agentShares: Array<f32>;
  tolerance: f32;
  EMPTY_VALUE: i32;
  grid: Uint32Array;
  movingAgentIndices: Uint32Array;
  movingAgentIndicesLength: i32;
  emptyCellIndices: Uint32Array;
  emptyCellIndicesLength: i32;

  constructor(
    width: i32,
    height: i32,
    agentShares: Array<f32>,
    tolerance: f32,
    EMPTY_VALUE: i32,
  ) {
    this.width = width;
    this.height = height;
    this.agentShares = agentShares;
    this.tolerance = tolerance;
    this.EMPTY_VALUE = EMPTY_VALUE;
    this.grid = new Uint32Array(width * height);
    this.movingAgentIndices = new Uint32Array(width * height);
    this.movingAgentIndicesLength = 0;
    this.emptyCellIndices = new Uint32Array(width * height);
    this.emptyCellIndicesLength = 0;
  }
}
