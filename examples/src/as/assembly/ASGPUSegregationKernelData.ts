export class ASGPUSegregationKernelData /* extends ASSegregationKernelData*/ {
  width: i32;
  height: i32;
  tolerance: f32;
  EMPTY_VALUE: i32;
  grid: Uint32Array;
  movingAgentIndices: Uint32Array;
  movingAgentIndicesLength: i32;
  emptyCellIndices: Uint32Array;
  emptyCellIndicesLength: i32;

  workgroupSize: i32;
  dispatchSize: i32;
  blockWidth: i32;
  blockHeight: i32;
  blockSize: i32;

  agentIndices!: Uint32Array;
  agentIndicesLength!: Uint32Array;

  constructor(
    width: i32,
    height: i32,
    tolerance: f32,
    EMPTY_VALUE: i32,
    workgroupSizeMax: i32,
  ) {
    this.width = width;
    this.height = height;
    this.tolerance = tolerance;
    this.EMPTY_VALUE = EMPTY_VALUE;
    this.grid = new Uint32Array(width * height);
    this.movingAgentIndices = new Uint32Array(width * height);
    this.movingAgentIndicesLength = 0;
    this.emptyCellIndices = new Uint32Array(width * height);
    this.emptyCellIndicesLength = 0;

    const workgroupSize = width < workgroupSizeMax ? width : workgroupSizeMax;
    const dispatchSize = height < workgroupSizeMax ? height : workgroupSizeMax;
    this.blockWidth = i32(Math.ceil(f32(width) / f32(dispatchSize)));
    this.blockHeight = i32(Math.ceil(f32(height) / f32(workgroupSize)));
    this.blockSize = this.blockWidth * this.blockHeight;

    this.workgroupSize = workgroupSize;
    this.dispatchSize = dispatchSize;

    this.agentIndices = new Uint32Array(width * height);
    this.agentIndicesLength = new Uint32Array(workgroupSize * dispatchSize);
  }
}
