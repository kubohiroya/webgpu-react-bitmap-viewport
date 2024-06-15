import { GridContextProps } from './GridContext';
import { CanvasElementContextProps } from './CanvasElementContext';
import { F32LEN, U32LEN } from './Constants';

const F32UniformItemLength = 14;
export const F32UNIFORMS_BYTE_LENGTH = F32UniformItemLength * F32LEN;
export const createF32UniformBufferSource = (
  canvasContext: CanvasElementContextProps,
  gridContext: GridContextProps,
  viewport: { left: number; top: number; right: number; bottom: number },
  overscroll: { x: number; y: number }
) => {
  return new Float32Array([
    gridContext.gridSize.numColumns,
    gridContext.gridSize.numRows,
    canvasContext.canvasSize.width,
    canvasContext.canvasSize.height,
    canvasContext.headerOffset.left,
    canvasContext.headerOffset.top,
    viewport.left,
    viewport.top,
    viewport.right,
    viewport.bottom,
    viewport.right - viewport.left,
    viewport.bottom - viewport.top,
    overscroll.x,
    overscroll.y,
  ]);
};

const U32UniformItemLength = 6;
export const U32UNIFORMS_BYTE_LENGTH = U32UniformItemLength * U32LEN;
export const createUint32BufferSource = (
  gridContext: GridContextProps,
  numCellsToShow: { numColumnsToShow: number; numRowsToShow: number },
  scrollBarState: number
) => {
  return new Uint32Array([
    gridContext.gridSize.numColumns,
    gridContext.gridSize.numRows,
    numCellsToShow.numColumnsToShow,
    numCellsToShow.numRowsToShow,
    scrollBarState,
    0, //padding
  ]);
};

export const createUniformBuffer = (
  label: string,
  device: GPUDevice,
  byteLength: number
) => {
  return device.createBuffer({
    label,
    size: byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
};

export const createVertexBuffer = (
  label: string,
  device: GPUDevice,
  byteLength: number
) => {
  return device.createBuffer({
    label,
    size: byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
};

export const createStorageBuffer = (
  label: string,
  device: GPUDevice,
  byteLength: number
) => {
  return device.createBuffer({
    label,
    size: byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
};

export const updateBuffer = (
  device: GPUDevice,
  buffer: GPUBuffer,
  bufferSource: BufferSource
) => {
  device.queue.writeBuffer(buffer, 0, bufferSource);
  buffer.unmap();
};
