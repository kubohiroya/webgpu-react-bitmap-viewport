/**
 * Properties for the Grid component.
 */
export type GridProps = {
  /** The ID of the canvas element. */
  canvasId: string;

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

  /** The initial viewport settings for the grid. */
  initialViewport?: {
    /** The top boundary of the viewport. */
    top: number;
    /** The bottom boundary of the viewport. */
    bottom: number;
    /** The left boundary of the viewport. */
    left: number;
    /** The right boundary of the viewport. */
    right: number;
  };

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

  onDataChange?: (sourceId: string, data: Float32Array) => void;
  onFocusedStatesChange?: (sourceId: string, columnIndex: number, rowIndex: number) => void;
  onSelectedStatesChange?: (sourceId: string, columnIndex: number, rowIndex: number) => void;
};

export const SCROLLBAR_RADIUS = 5.0;
export const SCROLLBAR_MARGIN = 2.0;

export default GridProps;