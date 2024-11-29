import { GridContextProps } from '../GridContext';
import { createStorageBuffer } from './BufferFactories';
import { CanvasContextType } from '../ViewportContext';

export const F32UNIFORMS_LENGTH = 8;
export const F32UNIFORMS_BYTE_LENGTH =
  F32UNIFORMS_LENGTH * Uint32Array.BYTES_PER_ELEMENT;

export const createF32UniformBufferSource = (
  source: Float32Array,
  canvasContext: CanvasContextType,
  gridContext: GridContextProps,
  overscroll: { x: number; y: number }
) => {
  source[0] = gridContext.numColumns;
  source[1] = gridContext.numRows;
  source[2] = canvasContext.canvasSize.width;
  source[3] = canvasContext.canvasSize.height;
  source[4] = canvasContext.headerOffset.left;
  source[5] = canvasContext.headerOffset.top;
  source[6] = overscroll.x;
  source[7] = overscroll.y;
  return source;
};

export const U32UNIFORMS_LENGTH = 6;
export const U32UNIFORMS_BYTE_LENGTH =
  U32UNIFORMS_LENGTH * Uint32Array.BYTES_PER_ELEMENT;

export const createUint32BufferSource = (
  source: Uint32Array,
  gridContext: GridContextProps,
  numCellsToShow: { numColumnsToShow: number; numRowsToShow: number },
  scrollBarState: number,
  index: number
) => {
  source[0] = gridContext.numColumns;
  source[1] = gridContext.numRows;
  source[2] = numCellsToShow.numColumnsToShow;
  source[3] = numCellsToShow.numRowsToShow;
  source[4] = scrollBarState;
  source[5] = index;
  return source;
};

const VIEWPORT_STATE_ITEM_LENGTH = 4; // left, top, right, bottom

export const createViewportStateBuffer = (
  label: string,
  device: GPUDevice,
  numViewports: number
) => {
  return createStorageBuffer(
    label,
    device,
    numViewports * VIEWPORT_STATE_ITEM_LENGTH * Float32Array.BYTES_PER_ELEMENT
  );
};
