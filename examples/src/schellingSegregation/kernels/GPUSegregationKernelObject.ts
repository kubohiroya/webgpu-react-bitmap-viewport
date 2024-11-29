export class GPUSegregationKernelObject {
  workgroupSize: number;
  dispatchSize: number;
  blockWidth: number;
  blockHeight: number;
  blockSize: number;

  agentIndices: Uint32Array;
  agentIndicesLength: Uint32Array;

  constructor(width: number, height: number, workgroupSizeMax: number) {
    this.workgroupSize = Math.min(width, workgroupSizeMax);
    this.dispatchSize = Math.min(height, workgroupSizeMax);

    this.blockWidth = Math.ceil(width / this.dispatchSize);
    this.blockHeight = Math.ceil(height / this.workgroupSize);
    this.blockSize = this.blockWidth * this.blockHeight;

    this.agentIndices = new Uint32Array(width * height);
    this.agentIndicesLength = new Uint32Array(
      this.workgroupSize * this.dispatchSize,
    );
  }
}
