import { KeyboardModifier } from './KeyboardModifier';

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
    rowIndex: number,
    keyboardModifier: KeyboardModifier
  ) => void;
  refreshViewportState: (sourceIndex: number) => void;
};
