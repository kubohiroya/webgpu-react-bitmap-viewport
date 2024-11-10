import { SegregationKernelDataHandler } from './SegregationKernelDataHandler';

export class SegregationUIState implements SegregationKernelDataHandler {
  frameCount: number;
  focusedStates!: Uint32Array;
  selectedStates!: Uint32Array;
  viewportStates!: Float32Array;

  constructor(props: { width: number; height: number }) {
    this.updateSize(props.width, props.height);
    this.frameCount = 0;
  }

  updateSize(width: number, height: number): void {
    const gridSize = Math.max(width, height);
    this.focusedStates = new Uint32Array(gridSize);
    this.selectedStates = new Uint32Array(gridSize);
    this.viewportStates = new Float32Array([0, 0, width, height]);
  }

  setFrameCount(frameCount: number): void {
    this.frameCount = frameCount;
  }
}
