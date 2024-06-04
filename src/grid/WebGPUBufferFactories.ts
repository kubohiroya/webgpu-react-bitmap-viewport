import { GridContextProps } from './GridContext';
import { CanvasElementContextProps } from './CanvasElementContext';

export const createF32UniformBufferSource = (
  canvasContext: CanvasElementContextProps,
  gridContext: GridContextProps,
  viewport: { left: number; top: number; right: number; bottom: number },
  numColumnsToShow: number,
  numRowsToShow: number
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
    numColumnsToShow,
    numRowsToShow,
  ]);
};

export const createUint32BufferSource = (
  gridContext: GridContextProps,
  numColumnsToShow: number,
  numRowsToShow: number
) => {
  return new Uint32Array([
    gridContext.gridSize.numColumns,
    gridContext.gridSize.numRows,
    numColumnsToShow,
    numRowsToShow,
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
