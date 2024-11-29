import { KeyboardModifier } from './KeyboardModifier';

export type GridUIProps = {
  numColumns: number;
  numRows: number;
  focusedCellPosition: Uint32Array;
  selectedStates: Uint32Array;
  onDataChanged?: (
    sourceIndex: number,
    gridData: Float32Array | Uint32Array | GPUBuffer
  ) => void;
  onFocusedCellPositionChange?: (
    sourceIndex: number,
    columnIndex: number,
    rowIndex: number
  ) => void;
  onSelectedStatesChange?: (
    sourceIndex: number,
    columnIndex: number,
    rowIndex: number,
    keyboardModifier: KeyboardModifier
  ) => void;
  onViewportStatesChange?: (sourceIndex: number) => void;
};