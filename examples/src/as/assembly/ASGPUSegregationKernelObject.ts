import { ASSegregationKernelObject } from './ASSegregationKernelObject';

export class ASGPUSegregationKernelObject extends ASSegregationKernelObject {
  workgroupSize: i32;
  dispatchSize: i32;
  blockWidth: i32;
  blockHeight: i32;
  blockSize: i32;

  agentIndices: Uint32Array;
  agentIndicesLength: Uint32Array;

  constructor(
    width: i32,
    height: i32,
    tolerance: f32,
    EMPTY_VALUE: i32,
    workgroupSizeMax: i32,
  ) {
    super(width, height, tolerance, EMPTY_VALUE);
    const workgroupSize = width < workgroupSizeMax ? width : workgroupSizeMax;
    const dispatchSize = height < workgroupSizeMax ? height : workgroupSizeMax;
    const blockWidth = i32(Math.ceil(f32(width) / f32(dispatchSize)));
    const blockHeight = i32(Math.ceil(f32(height) / f32(workgroupSize)));
    this.blockWidth = blockWidth;
    this.blockHeight = blockHeight;
    this.blockSize = blockWidth * blockHeight;
    this.workgroupSize = workgroupSize;
    this.dispatchSize = dispatchSize;

    this.agentIndices = new Uint32Array(width * height);
    this.agentIndicesLength = new Uint32Array(workgroupSize * dispatchSize);
  }
}
