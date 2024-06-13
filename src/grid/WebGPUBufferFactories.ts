import { GridContextProps } from './GridContext';
import { CanvasElementContextProps } from './CanvasElementContext';

export const F32UniformByteLength = 14 * 4;
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

export const U32UniformByteLength = 6 * 4;
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
