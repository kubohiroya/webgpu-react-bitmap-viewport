export class GPUSegregationKernelData {
  workgroupSize: number;
  dispatchSize: number;
  random: Float32Array;

  agentIndicesArray: Uint32Array;
  agentIndicesLengthArray: Uint32Array;

  constructor(width: number, height: number, workgroupSizeMax: number) {
    this.workgroupSize = Math.min(width, workgroupSizeMax);
    this.dispatchSize = Math.min(height, workgroupSizeMax);
    this.random = new Float32Array(width * height);

    this.agentIndicesArray = new Uint32Array(width * height);
    this.agentIndicesLengthArray = new Uint32Array(
      this.workgroupSize * this.dispatchSize,
    );
  }
}
