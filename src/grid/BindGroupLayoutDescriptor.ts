export const BIND_GROUP_LAYOUT_DESCRIPTOR: GPUBindGroupLayoutDescriptor = {
  label: 'Grid bindGroupLayout',
  entries: [
    {
      binding: 0,
      visibility: GPUShaderStage.VERTEX,
      buffer: {
        type: 'uniform'
      }
    },
    {
      binding: 1,
      visibility: GPUShaderStage.VERTEX,
      buffer: {
        type: 'uniform'
      }
    },
    {
      binding: 2,
      visibility: GPUShaderStage.VERTEX,
      buffer: {
        type: 'read-only-storage'
      }
    },
    {
      binding: 3,
      visibility: GPUShaderStage.VERTEX,
      buffer: {
        type: 'read-only-storage'
      }
    },
    {
      binding: 4,
      visibility: GPUShaderStage.VERTEX,
      buffer: {
        type: 'read-only-storage'
      }
    }
  ]
};
