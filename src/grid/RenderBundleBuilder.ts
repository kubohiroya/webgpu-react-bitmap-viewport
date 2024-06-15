import {
  createF32UniformBufferSource,
  createUniformBuffer,
  updateBuffer,
  createUint32BufferSource,
  createStorageBuffer,
  createVertexBuffer,
  F32UNIFORMS_BYTE_LENGTH,
  U32UNIFORMS_BYTE_LENGTH,
} from './GPUBufferFactories';
import { GridContextProps } from './GridContext';
import GRID_SHADER_CODE from './GridShader.wgsl?raw';
import { CanvasElementContextValue } from './CanvasElementContext';
import { vertices, VERTICES_BYTE_LENGTH } from './Vertices';
import { F32LEN, U32LEN } from './Constants';
import {
  DRAW_INDIRECT_BUFFER_SOURCE,
  DRAW_INDIRECT_BUFFER_BYTE_INDEX,
  updateDrawIndirectBufferSource,
} from './DrawIndirectBufferFactory';
import { BIND_GROUP_LAYOUT_DESCRIPTOR } from './BindGroupLayoutDescriptor';

export class RenderBundleBuilder {
  device: GPUDevice;
  canvasElementContext: CanvasElementContextValue;
  canvasContext: GPUCanvasContext;
  canvasFormat: GPUTextureFormat;
  bindGroup: GPUBindGroup;

  f32UniformBuffer: GPUBuffer;
  u32UniformBuffer: GPUBuffer;
  gridDataBufferStorage: GPUBuffer;
  focusedIndicesStorage: GPUBuffer;
  selectedIndicesStorage: GPUBuffer;
  drawIndirectBufferSource: Uint32Array;
  drawIndirectBuffer: GPUBuffer;

  columnFocusSelectPipeline: GPURenderPipeline;
  rowFocusSelectPipeline: GPURenderPipeline;
  bodyPipeline: GPURenderPipeline;
  leftHeaderPipeline: GPURenderPipeline;
  topHeaderPipeline: GPURenderPipeline;
  scrollBarBackgroundPipeline: GPURenderPipeline;
  scrollBarBodyPipeline: GPURenderPipeline;

  vertexBuffer: GPUBuffer;

  columnFocusRenderBundle: GPURenderBundle;
  rowFocusRenderBundle: GPURenderBundle;
  bodyRenderBundle: GPURenderBundle;
  topHeaderRenderBundle: GPURenderBundle;
  leftHeaderRenderBundle: GPURenderBundle;
  scrollBarBackgroundRenderBundle: GPURenderBundle;
  scrollBarBodyRenderBundle: GPURenderBundle;

  constructor(
    device: GPUDevice,
    canvasFormat: GPUTextureFormat,
    canvasContext: GPUCanvasContext,
    canvasElementContext: CanvasElementContextValue,
    gridContext: GridContextProps
  ) {
    this.device = device;
    this.canvasFormat = canvasFormat;
    this.canvasElementContext = canvasElementContext;

    const shaderModule = device.createShaderModule({
      label: 'Grid shader',
      code: GRID_SHADER_CODE,
    });

    const bindGroupLayout = device.createBindGroupLayout(
      BIND_GROUP_LAYOUT_DESCRIPTOR
    );

    const pipelineLayout = device.createPipelineLayout({
      label: 'Grid renderer pipeline layout',
      bindGroupLayouts: [bindGroupLayout],
    });

    this.canvasContext = canvasContext;

    const createPipeline = (
      label: string,
      device: GPUDevice,
      vertexEntryPoint: string,
      fragmentEntryPoint: string,
      options?: { constants?: Record<string, number> }
    ) => {
      const multisample = canvasElementContext.multisample
        ? {
            multisample: {
              count: canvasElementContext.multisample,
            },
          }
        : {};

      return device.createRenderPipeline({
        label,
        layout: pipelineLayout,
        ...multisample,
        vertex: {
          module: shaderModule,
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
          module: shaderModule,
          entryPoint: fragmentEntryPoint,
          targets: [
            {
              format: canvasFormat,
              blend: {
                color: {
                  srcFactor: 'src-alpha',
                  dstFactor: 'one-minus-src-alpha',
                  operation: 'add',
                },
                alpha: {
                  srcFactor: 'one',
                  dstFactor: 'one-minus-src-alpha',
                  operation: 'add',
                },
              },
            },
          ],
        },
      });
    };

    this.columnFocusSelectPipeline = createPipeline(
      'columnFocusSelect',
      device,
      'vertexColumnFocusSelect',
      'fragmentColumnFocusSelect'
    );
    this.rowFocusSelectPipeline = createPipeline(
      'rowFocusSelect',
      device,
      'vertexRowFocusSelect',
      'fragmentRowFocusSelect'
    );
    this.bodyPipeline = createPipeline(
      'body',
      device,
      'vertexBody',
      'fragmentBody'
    );
    this.leftHeaderPipeline = createPipeline(
      'leftHeader',
      device,
      'vertexLeftHeader',
      'fragmentLeftHeader'
    );
    this.topHeaderPipeline = createPipeline(
      'topHeader',
      device,
      'vertexTopHeader',
      'fragmentTopHeader'
    );
    this.scrollBarBackgroundPipeline = createPipeline(
      'scrollBarBackground',
      device,
      'vertexScrollBarBackground',
      'fragmentScrollBarBackground'
    );
    this.scrollBarBodyPipeline = createPipeline(
      'scrollBarBody',
      device,
      'vertexScrollBarBody',
      'fragmentScrollBarBody',
      {
        constants: {
          scrollBarRadius: canvasElementContext.scrollBar.radius,
          scrollBarMargin: canvasElementContext.scrollBar.margin,
        },
      }
    );

    this.vertexBuffer = createVertexBuffer(
      'Vertices',
      device,
      VERTICES_BYTE_LENGTH
    );

    updateBuffer(this.device, this.vertexBuffer, new Float32Array(vertices));

    this.drawIndirectBufferSource = new Uint32Array(
      DRAW_INDIRECT_BUFFER_SOURCE
    );

    this.drawIndirectBuffer = device.createBuffer({
      label: 'DrawIndirect',
      size: DRAW_INDIRECT_BUFFER_SOURCE.length * U32LEN,
      usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.COPY_DST,
    });

    this.updateDrawIndirectBuffer({ numColumnsToShow: 1, numRowsToShow: 1 });

    this.f32UniformBuffer = createUniformBuffer(
      'F32Uniforms',
      device,
      F32UNIFORMS_BYTE_LENGTH
    );
    this.u32UniformBuffer = createUniformBuffer(
      'U32Uniforms',
      device,
      U32UNIFORMS_BYTE_LENGTH
    );

    const numCells =
      Math.max(gridContext.gridSize.numColumns, gridContext.gridSize.numRows) *
      F32LEN;
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

    this.bindGroup = this.createBindGroup(
      'Grid BindGroup',
      bindGroupLayout,
      this.f32UniformBuffer,
      this.u32UniformBuffer,
      this.focusedIndicesStorage,
      this.selectedIndicesStorage,
      this.gridDataBufferStorage
    );

    this.columnFocusRenderBundle = this.createColumnFocusRenderBundle();
    this.rowFocusRenderBundle = this.createRowFocusRenderBundle();
    this.bodyRenderBundle = this.createBodyRenderBundle();
    this.topHeaderRenderBundle = this.createTopHeaderRenderBundle();
    this.leftHeaderRenderBundle = this.createLeftHeaderRenderBundle();
    this.scrollBarBodyRenderBundle = this.createScrollBarBodyRenderBundle();
    this.scrollBarBackgroundRenderBundle =
      this.createScrollBarBackgroundRenderBundle();
  }

  updateF32UniformBuffer(
    gridContext: GridContextProps,
    viewport: {
      left: number;
      top: number;
      right: number;
      bottom: number;
    },
    overscroll: { x: number; y: number }
  ) {
    updateBuffer(
      this.device,
      this.f32UniformBuffer,
      createF32UniformBufferSource(
        this.canvasElementContext,
        gridContext,
        viewport,
        overscroll
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

  createBindGroup(
    label: string,
    bindGroupLayout: GPUBindGroupLayout,
    f32UniformBuffer: GPUBuffer,
    u32UniformBuffer: GPUBuffer,
    focusedIndicesStorage: GPUBuffer,
    selectedIndicesStorage: GPUBuffer,
    gridDataBufferStorage: GPUBuffer
  ) {
    return this.device.createBindGroup({
      label,
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: f32UniformBuffer },
        },
        {
          binding: 1,
          resource: { buffer: u32UniformBuffer },
        },
        {
          binding: 2,
          resource: { buffer: focusedIndicesStorage },
        },
        {
          binding: 3,
          resource: { buffer: selectedIndicesStorage },
        },
        {
          binding: 4,
          resource: { buffer: gridDataBufferStorage },
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
    encoder.setVertexBuffer(0, this.vertexBuffer);
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
    updateDrawIndirectBufferSource(
      this.drawIndirectBufferSource,
      numColumnsToShow,
      numRowsToShow
    );
    this.device.queue.writeBuffer(
      this.drawIndirectBuffer,
      0,
      this.drawIndirectBufferSource
    );
  }

  createBodyRenderBundle() {
    return this.createRenderBundle(
      'body',
      this.bodyPipeline,
      DRAW_INDIRECT_BUFFER_BYTE_INDEX.get('BODY')!
    );
  }

  createColumnFocusRenderBundle() {
    return this.createRenderBundle(
      'columnFocus',
      this.columnFocusSelectPipeline,
      DRAW_INDIRECT_BUFFER_BYTE_INDEX.get('TOP_HEADER')!
    );
  }

  createRowFocusRenderBundle() {
    return this.createRenderBundle(
      'rowFocus',
      this.rowFocusSelectPipeline,
      DRAW_INDIRECT_BUFFER_BYTE_INDEX.get('LEFT_HEADER')!
    );
  }

  createTopHeaderRenderBundle() {
    return this.createRenderBundle(
      'topHeader',
      this.topHeaderPipeline,
      DRAW_INDIRECT_BUFFER_BYTE_INDEX.get('TOP_HEADER')!
    );
  }

  createLeftHeaderRenderBundle() {
    return this.createRenderBundle(
      'leftHeader',
      this.leftHeaderPipeline,
      DRAW_INDIRECT_BUFFER_BYTE_INDEX.get('LEFT_HEADER')!
    );
  }

  createScrollBarBackgroundRenderBundle() {
    return this.createRenderBundle(
      'scrollBarBackground',
      this.scrollBarBackgroundPipeline,
      DRAW_INDIRECT_BUFFER_BYTE_INDEX.get('SCROLLBAR_BACKGROUND')!
    );
  }

  createScrollBarBodyRenderBundle() {
    return this.createRenderBundle(
      'scrollBarBody',
      this.scrollBarBodyPipeline,
      DRAW_INDIRECT_BUFFER_BYTE_INDEX.get('SCROLLBAR_BODY')!
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
          clearValue: { r: 0, g: 0, b: 0, a: 0 }, // 0.5->0.0
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
      this.scrollBarBackgroundRenderBundle,
      this.scrollBarBodyRenderBundle,
    ]);
  }
}
