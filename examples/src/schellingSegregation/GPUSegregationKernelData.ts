export class GPUSegregationKernelData {
  workgroupSize: number;
  dispatchSize: number;
  random: Float32Array;

  agentIndices: Uint32Array;
  agentIndicesLength: Uint32Array;

  constructor(width: number, height: number, workgroupSizeMax: number) {
    this.workgroupSize = Math.min(width, workgroupSizeMax);
    this.dispatchSize = Math.min(height, workgroupSizeMax);
    this.random = new Float32Array(width * height);

    this.agentIndices = new Uint32Array(width * height);
    this.agentIndicesLength = new Uint32Array(
      this.workgroupSize * this.dispatchSize,
    );
  }
}
