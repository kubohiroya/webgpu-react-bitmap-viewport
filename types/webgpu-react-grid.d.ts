import * as React from 'react';

/**
 * Properties for the Grid component.
 */
export type GridProps = {
  /** The ID of the canvas element. */
  index: number;

  /** The offset of the header in the grid. */
  headerOffset: {
    /** The left offset of the header. */
    left: number;
    /** The top offset of the header. */
    top: number;
  };

  /** The size of the canvas. */
  canvasSize: {
    /** The width of the canvas in pixels. */
    width: number;
    /** The height of the canvas in pixels. */
    height: number;
  };

  numViewports: number;

  /** The size of the grid. */
  gridSize: {
    /** The number of columns in the grid. */
    numColumns: number;
    /** The number of rows in the grid. */
    numRows: number;
  };

  /** The data to be displayed in the grid, stored in a Float32Array. */
  data: Float32Array;

  /** The focused states of the grid, stored in a Uint8Array: notFocused=0, verticalFocused=1, horizontalFocused=2, verticalAndHorizontalFocused=3*/
  focusedStates: Uint8Array;
  /** The selected states of the grid, stored in a Uint8Array: notSelected=0, verticalSelected=1, horizontalSelected=2, verticalAndHorizontalSelected=3*/
  selectedStates: Uint8Array;

  /** The set of viewport left,top,right,bottom values for the grid in a Float32Array. */
  viewportStates: Float32Array;

  /** The initial overscroll settings for the grid. */
  initialOverscroll?: {
    /** The horizontal overscroll value. */
    x: number;
    /** The vertical overscroll value. */
    y: number;
  };

  /** The settings for the scroll bar in the grid. */
  scrollBar?: {
    /** The radius of the scroll bar in pixels. */
    radius: number;
    /** The margin around the scroll bar in pixels. */
    margin: number;
  };

  onDataChange?: (sourceIndex: number, data: Float32Array) => void;
  onFocusedStatesChange?: (sourceIndex: number, columnIndex: number, rowIndex: number) => void;
  onSelectedStatesChange?: (sourceIndex: number, columnIndex: number, rowIndex: number) => void;
  onViewportStateChange?: (
    sourceIndex: number
  ) => void;
};

declare const Grid: React.FC<GridProps>;
export default Grid;
