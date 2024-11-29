export class SegregationUIState {
  focusedCellPosition!: Uint32Array;
  selectedStates!: Uint32Array;
  viewportStates!: Float32Array;

  constructor(props: { width: number; height: number }) {
    this.updateSize(props.width, props.height);
  }

  updateSize(width: number, height: number): void {
    this.focusedCellPosition = new Uint32Array([-1, -1]);
    this.selectedStates = new Uint32Array(Math.ceil((width * height) / 32));
    this.viewportStates = new Float32Array([0, 0, width, height]);
  }
}
