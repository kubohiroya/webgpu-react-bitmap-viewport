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
};