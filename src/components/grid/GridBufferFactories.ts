import { GridContextProps } from './GridContext';
import { CanvasElementContextProps } from './CanvasElementContext';
import { F32LEN, U32LEN } from './Constants';
import { createStorageBuffer } from './WebGPUBufferFactories';

export const F32UNIFORMS_LENGTH = 8;
export const F32UNIFORMS_BYTE_LENGTH = F32UNIFORMS_LENGTH * F32LEN;

export const createF32UniformBufferSource = (
  source: Float32Array,
  canvasContext: CanvasElementContextProps,
  gridContext: GridContextProps,
  overscroll: { x: number; y: number }
) => {
  source[0] = gridContext.gridSize.numColumns;
  source[1] = gridContext.gridSize.numRows;
  source[2] = canvasContext.canvasSize.width;
  source[3] = canvasContext.canvasSize.height;
  source[4] = canvasContext.headerOffset.left;
  source[5] = canvasContext.headerOffset.top;
  source[6] = overscroll.x;
  source[7] = overscroll.y;
  return source;
};

export const U32UNIFORMS_LENGTH = 6;
export const U32UNIFORMS_BYTE_LENGTH = U32UNIFORMS_LENGTH * U32LEN;
export const createUint32BufferSource = (
  source: Uint32Array,
  gridContext: GridContextProps,
  numCellsToShow: { numColumnsToShow: number; numRowsToShow: number },
  scrollBarState: number,
  index: number
) => {
  source[0] = gridContext.gridSize.numColumns;
  source[1] = gridContext.gridSize.numRows;
  source[2] = numCellsToShow.numColumnsToShow;
  source[3] = numCellsToShow.numRowsToShow;
  source[4] = scrollBarState;
  source[5] = index;
  return source;
};

export const createViewportBuffer = (
  label: string,
  device: GPUDevice,
  numViewports: number
) => {
  return createStorageBuffer(label, device, numViewports * 4 * F32LEN);
};

