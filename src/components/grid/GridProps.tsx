export type GridProps = {
  canvasId: string;
  headerOffset: {
    left: number;
    top: number;
  };
  canvasSize: {
    width: number;
    height: number;
  };
  gridSize: {
    numColumns: number;
    numRows: number;
  };
  data: Float32Array;
  initialViewport?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  initialOverscroll?: {
    x: number;
    y: number;
  };
  scrollBar: {
    radius: number;
    margin: number;
  };
};