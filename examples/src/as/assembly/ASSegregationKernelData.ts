export class ASSegregationKernelData {
  width: i32;
  height: i32;
  agentShares: Array<f32>;
  tolerance: f32;
  EMPTY_VALUE: i32;
  grid: StaticArray<u32>;
  movingAgentIndices: StaticArray<i32>;
  movingAgentIndicesLength: i32;
  emptyCellIndices: StaticArray<i32>;
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
    this.grid = new StaticArray<u32>(width * height);
    this.movingAgentIndices = new StaticArray<i32>(width * height);
    this.movingAgentIndicesLength = 0;
    this.emptyCellIndices = new StaticArray<i32>(width * height);
    this.emptyCellIndicesLength = 0;
  }
}
