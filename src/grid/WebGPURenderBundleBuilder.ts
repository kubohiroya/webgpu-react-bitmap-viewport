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
import gridShaderCode from './GridShader.wgsl?raw';
import { CanvasElementContextValue } from './CanvasElementContext';
import { vertices } from './Vertices';

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
  columnFocusSelectPipeline: GPURenderPipeline;
  rowFocusSelectPipeline: GPURenderPipeline;
  scrollBarBodyPipeline: GPURenderPipeline;

  verticesBuffer: GPUBuffer;

  bodyRenderBundle: GPURenderBundle;
  topHeaderRenderBundle: GPURenderBundle;
  leftHeaderRenderBundle: GPURenderBundle;
  columnFocusRenderBundle: GPURenderBundle;
  rowFocusRenderBundle: GPURenderBundle;
  scrollBarBodyRenderBundle: GPURenderBundle;

  constructor(
    device: GPUDevice,
    view: GPUTextureView,
    canvasFormat: GPUTextureFormat,
    canvasContext: GPUCanvasContext,
    canvasElementContext: CanvasElementContextValue,
    gridContext: GridContextProps
  ) {
    this.canvasFormat = canvasFormat;
    this.canvasElementContext = canvasElementContext;

    const shaderModule = device.createShaderModule({
      label: 'Grid shader',
      code: gridShaderCode,
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
      gridShaderModule: GPUShaderModule,
      canvasFormat: GPUTextureFormat,
      vertexEntryPoint: string,
      fragmentEntryPoint: string,
      options?: { constants?: Record<string, number> }
    ) => {
      // https://zenn.dev/emadurandal/books/cb6818fd3a1b2e/viewer/msaa
      const multisample = canvasElementContext.multisample
        ? {
            multisample: {
              count: canvasElementContext.multisample,
            },
          }
        : {};

      return this.device.createRenderPipeline({
        label,
        layout: pipelineLayout,
        ...multisample,
        vertex: {
          module: gridShaderModule,
          entryPoint: vertexEntryPoint,
          ...options,
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
          module: gridShaderModule,
          entryPoint: fragmentEntryPoint,
          targets: [
            {
              format: canvasFormat,
              /*
              blend: {
                color: {
                  srcFactor: 'src-alpha',
                  dstFactor: 'one',
                  operation: 'add',
                },
                alpha: {
                  srcFactor: 'zero',
                  dstFactor: 'one',
                  operation: 'add',
                },
              },
               */
            },
          ],
        },
      });
    };

    this.bodyPipeline = createPipeline(
      'body',
      pipelineLayout,
      shaderModule,
      canvasFormat,
      'vertexBody',
      'fragmentBody'
    );
    this.leftHeaderPipeline = createPipeline(
      'leftHeader',
      pipelineLayout,
      shaderModule,
      canvasFormat,
      'vertexLeftHeader',
      'fragmentLeftHeader'
    );
    this.topHeaderPipeline = createPipeline(
      'topHeader',
      pipelineLayout,
      shaderModule,
      canvasFormat,
      'vertexTopHeader',
      'fragmentTopHeader'
    );
    this.columnFocusSelectPipeline = createPipeline(
      'columnFocusSelect',
      pipelineLayout,
      shaderModule,
      canvasFormat,
      'vertexColumnFocusSelect',
      'fragmentColumnFocusSelect'
    );
    this.rowFocusSelectPipeline = createPipeline(
      'rowFocusSelect',
      pipelineLayout,
      shaderModule,
      canvasFormat,
      'vertexRowFocusSelect',
      'fragmentRowFocusSelect'
    );
    this.scrollBarBodyPipeline = createPipeline(
      'scrollBarBody',
      pipelineLayout,
      shaderModule,
      canvasFormat,
      'vertexScrollBarBody',
      'fragmentScrollBarBody',
      {
        constants: {
          scrollBarRadius: canvasElementContext.scrollBar.radius,
          scrollBarMargin: canvasElementContext.scrollBar.margin,
        },
      }
    );

    this.verticesBuffer = createVertexBuffer(
      'Vertices',
      device,
      vertices.length * 4
    );

    updateBuffer(this.device, this.verticesBuffer, new Float32Array(vertices));
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
      label: 'DrawIndirect',
      size: 16 * 4, // 4つのuint32で足りるサイズ * 4バンドル
      usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.COPY_DST,
    });

    this.drawIndirectBufferSource = new Uint32Array([
      2 * 3, // vertexCount
      0, // instanceCount
      0, // firstVertex
      0, // firstInstance

      2 * 3, // vertexCount
      0, // instanceCount
      0, // firstVertex
      0, // firstInstance

      6, // vertexCount
      0, // instanceCount
      0, // firstVertex
      0, // firstInstance

      (2 + 24) * 3, // vertexCount
      2, // instanceCount
      0, // firstVertex
      0, // firstInstance
    ]);
    this.updateDrawIndirectBuffer({ numColumnsToShow: 1, numRowsToShow: 1 });

    this.bodyRenderBundle = this.createBodyRenderBundle();
    this.topHeaderRenderBundle = this.createTopHeaderRenderBundle();
    this.leftHeaderRenderBundle = this.createLeftHeaderRenderBundle();
    this.columnFocusRenderBundle = this.createColumnFocusRenderBundle();
    this.rowFocusRenderBundle = this.createRowFocusRenderBundle();
    this.scrollBarBodyRenderBundle = this.createScrollBarBodyRenderBundle();
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
    numCellsToShow: { numColumnsToShow: number; numRowsToShow: number },
    scrollBarState: number
  ) {
    updateBuffer(
      this.device,
      this.u32UniformBuffer,
      createUint32BufferSource(gridContext, numCellsToShow, scrollBarState)
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

  createColumnFocusRenderBundle() {
    return this.createRenderBundle(
      'columnFocus',
      this.columnFocusSelectPipeline,
      16
    );
  }

  createLeftHeaderRenderBundle() {
    return this.createRenderBundle('leftHeader', this.leftHeaderPipeline, 32);
  }

  createRowFocusRenderBundle() {
    return this.createRenderBundle('rowFocus', this.rowFocusSelectPipeline, 32);
  }

  createScrollBarBodyRenderBundle() {
    return this.createRenderBundle(
      'scrollBarBody',
      this.scrollBarBodyPipeline,
      48
    );
  }

  executeRenderBundles(renderBundles: GPURenderBundle[]) {
    const commandEncoder = this.device.createCommandEncoder();
    const multisample = this.canvasElementContext.multisample;
    const texture =
      multisample !== undefined
        ? this.device.createTexture({
            size: [
              this.canvasElementContext.canvasSize.width,
              this.canvasElementContext.canvasSize.height,
            ],
            sampleCount: multisample,
            format: this.canvasFormat,
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
          })
        : this.canvasContext.getCurrentTexture();
    const resolveTarget =
      multisample !== undefined ? { resolveTarget: texture.createView() } : {};
    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: texture.createView(),
          ...resolveTarget,
          clearValue: { r: 1, g: 1, b: 1, a: 1 },
          loadOp: 'clear',
          storeOp: multisample !== undefined ? 'discard' : 'store',
        },
      ],
    });
    passEncoder.executeBundles(renderBundles);
    passEncoder.end();
    this.device.queue.submit([commandEncoder.finish()]);
  }

  execute() {
    this.executeRenderBundles([
      this.columnFocusRenderBundle,
      this.rowFocusRenderBundle,
      this.bodyRenderBundle,
      this.topHeaderRenderBundle,
      this.leftHeaderRenderBundle,
      this.scrollBarBodyRenderBundle,
    ]);
  }
}
