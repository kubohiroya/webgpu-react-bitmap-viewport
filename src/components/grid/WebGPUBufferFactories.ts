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
