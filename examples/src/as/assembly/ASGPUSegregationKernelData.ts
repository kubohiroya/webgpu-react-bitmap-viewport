import { ASSegregationKernelData } from './ASSegregationKernelData';

export class ASGPUSegregationKernelData extends ASSegregationKernelData {
  workgroupSize: i32;
  dispatchSize: i32;
  agentIndices: Uint32Array;
  agentIndicesLength: Uint32Array;
  constructor(
    width: i32,
    height: i32,
    agentShares: Array<f32>,
    tolerance: f32,
    workgroupSize: i32,
    dispatchSize: i32,
    EMPTY_VALUE: i32,
  ) {
    super(width, height, agentShares, tolerance, EMPTY_VALUE);
    this.workgroupSize = workgroupSize;
    this.dispatchSize = dispatchSize;
    this.agentIndices = new Uint32Array(width * height);
    this.agentIndicesLength = new Uint32Array(workgroupSize);
  }
}
