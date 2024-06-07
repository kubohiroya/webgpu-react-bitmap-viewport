import {
  createF32UniformBufferSource,
  createUniformBuffer,
  updateBuffer,
  createUint32BufferSource,
  createStorageBuffer,
  createVertexBuffer,
  F32UniformByteLength,
  U32UniformByteLength,
} from './WebGPUBufferFactories';
import { GridContextProps } from './GridContext';
import cellShaderCode from './CellShader.wgsl?raw';
import { CanvasElementContextValue } from './CanvasElementContext';
import { gridCellVertices } from './GridCellVertices';

export class WebGPURenderBundleBuilder {
  device: GPUDevice;
  canvasElementContext: CanvasElementContextValue;
  canvasContext: GPUCanvasContext;
  canvasFormat: GPUTextureFormat;
  bindGroup: GPUBindGroup;
  renderPassDescriptor: GPURenderPassDescriptor;

  f32UniformBuffer: GPUBuffer;
  u32UniformBuffer: GPUBuffer;
  gridDataBufferStorage: GPUBuffer;
  focusedIndicesStorage: GPUBuffer;
  selectedIndicesStorage: GPUBuffer;
  drawIndirectBufferSource: Uint32Array;
  drawIndirectBuffer: GPUBuffer;

  bodyPipeline: GPURenderPipeline;
  leftHeaderPipeline: GPURenderPipeline;
  topHeaderPipeline: GPURenderPipeline;
  verticesBuffer: GPUBuffer;

  bodyRenderBundle: GPURenderBundle;
  topHeaderRenderBundle: GPURenderBundle;
  leftHeaderRenderBundle: GPURenderBundle;

  constructor(
    device: GPUDevice,
    view: GPUTextureView,
    canvasFormat: GPUTextureFormat,
    canvasElementContext: CanvasElementContextValue,
    canvasContext: GPUCanvasContext,
    gridContext: GridContextProps
  ) {
    this.canvasFormat = canvasFormat;
    this.canvasElementContext = canvasElementContext;

    const cellShaderModule = device.createShaderModule({
      label: 'Cell shader',
      code: cellShaderCode,
    });

    const bindGroupLayout = device.createBindGroupLayout({
      label: 'bindGroupLayout',
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: 'uniform',
          },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: 'uniform',
          },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: 'read-only-storage',
          },
        },
        {
          binding: 3,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: 'read-only-storage',
          },
        },
        {
          binding: 4,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: 'read-only-storage',
          },
        },
      ],
    });

    const pipelineLayout = device.createPipelineLayout({
      label: 'Cell renderer pipeline layout',
      bindGroupLayouts: [bindGroupLayout],
    });

    this.renderPassDescriptor = {
      colorAttachments: [
        {
          view,
          clearValue: { r: 1, g: 1, b: 1, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    };

    this.device = device;
    this.canvasContext = canvasContext;

    const createPipeline = (
      label: string,
      pipelineLayout: GPUPipelineLayout,
      cellShaderModule: GPUShaderModule,
      canvasFormat: GPUTextureFormat,
      vertexEntryPoint: string,
      fragmentEntryPoint: string
    ) => {
      return this.device.createRenderPipeline({
        label,
        layout: pipelineLayout,
        vertex: {
          module: cellShaderModule,
          entryPoint: vertexEntryPoint,
          buffers: [
            {
              arrayStride: 8,
              attributes: [
                {
                  format: 'float32x2',
                  offset: 0,
                  shaderLocation: 0,
                },
              ],
            },
          ],
        },
        fragment: {
          module: cellShaderModule,
          entryPoint: fragmentEntryPoint,
          targets: [
            {
              format: canvasFormat,
            },
          ],
        },
      });
    };

    this.bodyPipeline = createPipeline(
      'body',
      pipelineLayout,
      cellShaderModule,
      canvasFormat,
      'vertexBody',
      'fragmentBody'
    );
    this.leftHeaderPipeline = createPipeline(
      'leftHeader',
      pipelineLayout,
      cellShaderModule,
      canvasFormat,
      'vertexLeftHeader',
      'fragmentLeftHeader'
    );
    this.topHeaderPipeline = createPipeline(
      'topHeader',
      pipelineLayout,
      cellShaderModule,
      canvasFormat,
      'vertexTopHeader',
      'fragmentTopHeader'
    );

    this.verticesBuffer = createVertexBuffer(
      'Vertices',
      device,
      gridCellVertices.length * 4
    );

    updateBuffer(
      this.device,
      this.verticesBuffer,
      new Float32Array(gridCellVertices)
    );
    this.f32UniformBuffer = createUniformBuffer(
      'F32Uniforms',
      device,
      F32UniformByteLength
    );
    this.u32UniformBuffer = createUniformBuffer(
      'U32Uniforms',
      device,
      U32UniformByteLength
    );

    const numCells =
      Math.max(gridContext.gridSize.numColumns, gridContext.gridSize.numRows) *
      4;
    this.focusedIndicesStorage = createStorageBuffer(
      'FocusedIndexBuffer',
      device,
      numCells
    );
    this.selectedIndicesStorage = createStorageBuffer(
      'SelectedIndexBuffer',
      device,
      numCells
    );
    this.gridDataBufferStorage = createStorageBuffer(
      'GridDataBuffer',
      device,
      gridContext.gridSize.numColumns * gridContext.gridSize.numRows * 4
    );

    this.bindGroup = this.createBindGroup(bindGroupLayout);

    this.drawIndirectBuffer = device.createBuffer({
      size: 16 * 3, // 4つのuint32で足りるサイズ * 3バンドル
      usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.COPY_DST,
    });

    this.drawIndirectBufferSource = new Uint32Array([
      gridCellVertices.length / 2, // vertexCount
      0, // instanceCount
      0, // firstVertex
      0, // firstInstance
      gridCellVertices.length / 2, // vertexCount
      0, // instanceCount
      0, // firstVertex
      0, // firstInstance
      gridCellVertices.length / 2, // vertexCount
      0, // instanceCount
      0, // firstVertex
      0, // firstInstance
    ]);
    this.updateDrawIndirectBuffer({ numColumnsToShow: 1, numRowsToShow: 1 });

    this.bodyRenderBundle = this.createBodyRenderBundle();
    this.topHeaderRenderBundle = this.createTopHeaderRenderBundle();
    this.leftHeaderRenderBundle = this.createLeftHeaderRenderBundle();
  }

  updateF32UniformBuffer(
    gridContext: GridContextProps,
    viewport: {
      left: number;
      top: number;
      right: number;
      bottom: number;
    },
    viewportOffset: { x: number; y: number }
  ) {
    updateBuffer(
      this.device,
      this.f32UniformBuffer,
      createF32UniformBufferSource(
        this.canvasElementContext,
        gridContext,
        viewport,
        viewportOffset
      )
    );
  }

  updateU32UniformBuffer(
    gridContext: GridContextProps,
    numCellsToShow: { numColumnsToShow: number; numRowsToShow: number }
  ) {
    updateBuffer(
      this.device,
      this.u32UniformBuffer,
      createUint32BufferSource(gridContext, numCellsToShow)
    );
  }

  setDataBufferStorage(data: Float32Array) {
    updateBuffer(this.device, this.gridDataBufferStorage, data);
  }

  setFocusedIndicesStorage(focusedIndices: number[]) {
    updateBuffer(
      this.device,
      this.focusedIndicesStorage,
      new Uint32Array(focusedIndices)
    );
  }

  setSelectedIndicesStorage(selectedIndices: number[]) {
    updateBuffer(
      this.device,
      this.selectedIndicesStorage,
      new Uint32Array(selectedIndices)
    );
  }

  createBindGroup(bindGroupLayout: GPUBindGroupLayout) {
    return this.device.createBindGroup({
      label: 'Cell renderer bind group',
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.f32UniformBuffer },
        },
        {
          binding: 1,
          resource: { buffer: this.u32UniformBuffer },
        },
        {
          binding: 2,
          resource: { buffer: this.focusedIndicesStorage },
        },
        {
          binding: 3,
          resource: { buffer: this.selectedIndicesStorage },
        },
        {
          binding: 4,
          resource: { buffer: this.gridDataBufferStorage },
        },
      ],
    });
  }

  createRenderBundle(
    label: string,
    pipeline: GPURenderPipeline,
    indirectOffset: number
  ) {
    const encoder = this.device.createRenderBundleEncoder({
      label,
      colorFormats: [this.canvasFormat],
    });
    encoder.setPipeline(pipeline);
    encoder.setVertexBuffer(0, this.verticesBuffer);
    encoder.setBindGroup(0, this.bindGroup);
    encoder.drawIndirect(this.drawIndirectBuffer, indirectOffset);
    return encoder.finish();
  }

  updateDrawIndirectBuffer({
    numColumnsToShow,
    numRowsToShow,
  }: {
    numColumnsToShow: number;
    numRowsToShow: number;
  }) {
    this.drawIndirectBufferSource[1] = numColumnsToShow * numRowsToShow;
    this.drawIndirectBufferSource[5] = numColumnsToShow;
    this.drawIndirectBufferSource[9] = numRowsToShow;
    this.device.queue.writeBuffer(
      this.drawIndirectBuffer,
      0,
      this.drawIndirectBufferSource
    );
  }

  createBodyRenderBundle() {
    return this.createRenderBundle('body', this.bodyPipeline, 0);
  }

  createTopHeaderRenderBundle() {
    return this.createRenderBundle('topHeader', this.topHeaderPipeline, 16);
  }

  createLeftHeaderRenderBundle() {
    return this.createRenderBundle('leftHeader', this.leftHeaderPipeline, 32);
  }

  executeRenderBundles(renderBundles: GPURenderBundle[]) {
    const commandEncoder = this.device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.canvasContext.getCurrentTexture().createView(),
          clearValue: { r: 1, g: 1, b: 1, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });
    passEncoder.executeBundles(renderBundles);
    passEncoder.end();
    this.device.queue.submit([commandEncoder.finish()]);
  }

  execute() {
    this.executeRenderBundles([
      this.bodyRenderBundle,
      this.topHeaderRenderBundle,
      this.leftHeaderRenderBundle,
    ]);
  }
}
