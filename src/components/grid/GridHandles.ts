export type GridHandles = {
  updateData: (sourceId: string, data: Float32Array) => void,
  updateFocusedState: (sourceId: string, columnIndex: number, rowIndex: number) => void,
  updateSelectedState: (sourceId: string, columnIndex: number, rowIndex: number) => void,
};