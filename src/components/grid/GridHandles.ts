export type GridHandles = {
  refreshData: (sourceIndex: number) => void;
  refreshFocusedState: (
    sourceIndex: number,
    columnIndex: number,
    rowIndex: number
  ) => void;
  refreshSelectedState: (
    sourceIndex: number,
    columnIndex: number,
    rowIndex: number
  ) => void;
  refreshViewportState: (sourceIndex: number) => void;
};
