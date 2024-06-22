export type GridHandles = {
  updateData: (sourceIndex: number, data: Float32Array) => void,
  updateFocusedState: (sourceIndex: number, columnIndex: number, rowIndex: number) => void,
  updateSelectedState: (sourceIndex: number, columnIndex: number, rowIndex: number) => void,
  refreshViewportState: (sourceIndex: number) => void,
};