export type GridHandles = {
  updateData: (sourceId: string, data: Float32Array) => void,
  updateFocusedIndices: (sourceId: string, columnIndex: number, rowIndex: number) => void,
  updateSelectedIndices: (sourceId: string, columnIndex: number, rowIndex: number) => void,
};