import { ASSegregationKernelData } from './ASSegregationKernelData';

export class ASGPUSegregationKernelData extends ASSegregationKernelData {
  agentIndicesArray: Uint32Array;
  agentIndicesLengthArray: Uint32Array;
  constructor(
    width: i32,
    height: i32,
    agentShares: Array<f32>,
    tolerance: f32,
    workgroupSize: i32,
    EMPTY_VALUE: i32,
  ) {
    super(width, height, agentShares, tolerance, EMPTY_VALUE);
    this.agentIndicesArray = new Uint32Array(width * height);
    this.agentIndicesLengthArray = new Uint32Array(workgroupSize);
  }
}
