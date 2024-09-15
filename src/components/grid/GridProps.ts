import { GridShaderMode } from './GridShaderMode';

/**
 * Properties for the Grid component.
 */
export type GridProps = {
  /** The shader mode to use for the grid.
   * ShaderMode.SINGLE_VALUE: Single value shader mode.
   * ShaderMode.RGB: RGB shader mode.
   * */
  mode: GridShaderMode;

  /** The ID of the canvas element. */
  viewportIndex: number;

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

  /** The data to be displayed in the grid, stored in a Float32Array for SingleValueGrid or Uint32Array for RGBAGrid. */
  data: Float32Array | Uint32Array;

  /** The focused states of the grid, stored in a Uint32Array: notFocused=0, verticalFocused=1, horizontalFocused=2, verticalAndHorizontalFocused=3*/
  focusedStates: Uint32Array;
  /** The selected states of the grid, stored in a Uint32Array: notSelected=0, verticalSelected=1, horizontalSelected=2, verticalAndHorizontalSelected=3*/
  selectedStates: Uint32Array;

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

  onDataChange?: (sourceIndex: number) => void;
  onFocusedStateChange?: (
    sourceIndex: number,
    columnIndex: number,
    rowIndex: number
  ) => void;
  onSelectedStateChange?: (
    sourceIndex: number,
    columnIndex: number,
    rowIndex: number
  ) => void;
  onViewportStateChange?: (sourceIndex: number) => void;
};

export default GridProps;
