import {
  createF32UniformBufferSource,
  createUint32BufferSource,
  createViewportBuffer,
  F32UNIFORMS_LENGTH,
  U32UNIFORMS_LENGTH,
  F32UNIFORMS_BYTE_LENGTH,
  U32UNIFORMS_BYTE_LENGTH,
} from './GridBufferFactories';
import { GridContextProps } from './GridContext';

import GRID_SHADER_RGBA_CODE from './GridShaderRGBA.wgsl?raw';
import GRID_SHADER_CODE from './GridShaderBase.wgsl?raw';
import GRID_SHADER_HUE_CODE from './GridShaderHue.wgsl?raw';
import GRID_SHADER_CUSTOM_CODE from './GridShaderCustom.wgsl?raw';

import { CanvasElementContextType } from './CanvasElementContext';
import { vertices, VERTICES_BYTE_LENGTH } from './Vertices';
import { F32LEN, U32LEN } from './Constants';
import {
  DRAW_INDIRECT_BUFFER_BYTE_INDEX,
  DRAW_INDIRECT_BUFFER_SOURCE,
  updateDrawIndirectBufferSource,
} from './DrawIndirectBufferFactory';
import { BIND_GROUP_LAYOUT_DESCRIPTOR } from './BindGroupLayoutDescriptor';

import {
  createStorageBuffer,
  createUniformBuffer,
  createVertexBuffer,
  updateBuffer,
} from './WebGPUBufferFactories';
import { SCROLLBAR_MARGIN, SCROLLBAR_RADIUS } from './GridParamsDefault';
import { GridShaderMode } from './GridShaderMode';

export class RenderBundleBuilder {
  private device: GPUDevice;
  private canvasFormat: GPUTextureFormat;
  private canvasContext: GPUCanvasContext;
  private canvasElementContext: CanvasElementContextType;

  private bindGroup: GPUBindGroup;

  private f32UniformBufferSource: Float32Array;
  private u32UniformBufferSource: Uint32Array;
  private drawIndirectBufferSource: Uint32Array;

  private vertexBuffer: GPUBuffer;
  private f32UniformBuffer: GPUBuffer;
  private u32UniformBuffer: GPUBuffer;
  private viewportStateStorage: GPUBuffer;
  private gridDataBufferStorage: GPUBuffer;
  private focusedStateStorage: GPUBuffer;
  private selectedStateStorage: GPUBuffer;
  private drawIndirectBuffer: GPUBuffer;

  private columnFocusRenderBundle: GPURenderBundle;
  private rowFocusRenderBundle: GPURenderBundle;
  private bodyRenderBundle: GPURenderBundle;
  private viewportShadowRenderBundle: GPURenderBundle;
  private topHeaderRenderBundle: GPURenderBundle;
  private leftHeaderRenderBundle: GPURenderBundle;
  private scrollBarBackgroundRenderBundle: GPURenderBundle;
  private scrollBarBodyRenderBundle: GPURenderBundle;

  public constructor(
    mode: GridShaderMode,
    device: GPUDevice,
    canvasFormat: GPUTextureFormat,
    canvasContext: GPUCanvasContext,
    canvasElementContext: CanvasElementContextType,
    gridSize: { numColumns: number; numRows: number },
    numViewports: number
  ) {
    this.device = device;
    this.canvasFormat = canvasFormat;
    this.canvasContext = canvasContext;
    this.canvasElementContext = canvasElementContext;

    const shaderModule = device.createShaderModule({
      label: 'Grid shader',
      code:
        GRID_SHADER_CODE +
        (mode === GridShaderMode.HUE
          ? GRID_SHADER_HUE_CODE
          : mode === GridShaderMode.RGBA
          ? GRID_SHADER_RGBA_CODE
          : GRID_SHADER_CUSTOM_CODE),
    });

    const bindGroupLayout = device.createBindGroupLayout(
      BIND_GROUP_LAYOUT_DESCRIPTOR
    );

    const pipelineLayout = device.createPipelineLayout({
      label: 'Grid renderer pipeline layout',
      bindGroupLayouts: [bindGroupLayout],
    });

    this.canvasContext = canvasContext;

    const createRenderPipeline = (
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

    const columnFocusSelectPipeline = createRenderPipeline(
      'columnFocusSelect',
      device,
      'vertexColumnFocusSelect',
      'fragmentColumnFocusSelect'
    );
    const rowFocusSelectPipeline = createRenderPipeline(
      'rowFocusSelect',
      device,
      'vertexRowFocusSelect',
      'fragmentRowFocusSelect'
    );
    const bodyPipeline = createRenderPipeline(
      'body',
      device,
      'vertexBody',
      'fragmentBody'
    );

    const viewportShadowPipeline = createRenderPipeline(
      'viewportShadow',
      device,
      'vertexViewportShadow',
      'fragmentViewportShadow'
    );

    const leftHeaderPipeline = createRenderPipeline(
      'leftHeader',
      device,
      'vertexLeftHeader',
      'fragmentLeftHeader'
    );
    const topHeaderPipeline = createRenderPipeline(
      'topHeader',
      device,
      'vertexTopHeader',
      'fragmentTopHeader'
    );
    const scrollBarBackgroundPipeline = createRenderPipeline(
      'scrollBarBackground',
      device,
      'vertexScrollBarBackground',
      'fragmentScrollBarBackground'
    );
    const scrollBarBodyPipeline = createRenderPipeline(
      'scrollBarBody',
      device,
      'vertexScrollBarBody',
      'fragmentScrollBarBody',
      {
        constants: {
          scrollBarRadius:
            canvasElementContext.scrollBar?.radius || SCROLLBAR_RADIUS,
          scrollBarMargin:
            canvasElementContext.scrollBar?.margin || SCROLLBAR_MARGIN,
        },
      }
    );

    this.drawIndirectBufferSource = new Uint32Array(
      DRAW_INDIRECT_BUFFER_SOURCE
    );
    this.u32UniformBufferSource = new Uint32Array(U32UNIFORMS_LENGTH);
    this.f32UniformBufferSource = new Float32Array(F32UNIFORMS_LENGTH);

    this.vertexBuffer = createVertexBuffer(
      'Vertices',
      device,
      VERTICES_BYTE_LENGTH
    );

    updateBuffer(this.device, this.vertexBuffer, new Float32Array(vertices));

    this.drawIndirectBuffer = device.createBuffer({
      label: 'DrawIndirect',
      size: DRAW_INDIRECT_BUFFER_SOURCE.length * U32LEN,
      usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.COPY_DST,
    });

    this.updateDrawIndirectBuffer(1, 1, numViewports);

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

    this.viewportStateStorage = createViewportBuffer(
      'ViewportBuffer',
      device,
      numViewports
    );

    const numCells = Math.max(gridSize.numColumns, gridSize.numRows) * F32LEN;
    this.focusedStateStorage = createStorageBuffer(
      'FocusedStateBuffer',
      device,
      numCells
    );
    this.selectedStateStorage = createStorageBuffer(
      'SelectedStateBuffer',
      device,
      numCells
    );
    this.gridDataBufferStorage = createStorageBuffer(
      'GridDataBuffer',
      device,
      gridSize.numColumns *
        gridSize.numRows *
        (mode === GridShaderMode.RGBA ? U32LEN : F32LEN)
    );

    this.bindGroup = this.createBindGroup(
      'Grid BindGroup',
      bindGroupLayout,
      this.f32UniformBuffer,
      this.u32UniformBuffer,
      this.viewportStateStorage,
      this.focusedStateStorage,
      this.selectedStateStorage,
      this.gridDataBufferStorage
    );

    this.columnFocusRenderBundle = this.createColumnFocusRenderBundle(
      columnFocusSelectPipeline
    );
    this.rowFocusRenderBundle = this.createRowFocusRenderBundle(
      rowFocusSelectPipeline
    );
    this.bodyRenderBundle = this.createBodyRenderBundle(bodyPipeline);
    this.viewportShadowRenderBundle = this.createViewportShadowRenderBundle(
      viewportShadowPipeline
    );
    this.topHeaderRenderBundle =
      this.createTopHeaderRenderBundle(topHeaderPipeline);
    this.leftHeaderRenderBundle =
      this.createLeftHeaderRenderBundle(leftHeaderPipeline);
    this.scrollBarBodyRenderBundle = this.createScrollBarBodyRenderBundle(
      scrollBarBodyPipeline
    );
    this.scrollBarBackgroundRenderBundle =
      this.createScrollBarBackgroundRenderBundle(scrollBarBackgroundPipeline);
  }

  public updateF32UniformBuffer(
    gridContext: GridContextProps,
    overscroll: { x: number; y: number }
  ) {
    updateBuffer(
      this.device,
      this.f32UniformBuffer,
      createF32UniformBufferSource(
        this.f32UniformBufferSource,
        this.canvasElementContext,
        gridContext,
        overscroll
      )
    );
  }

  public updateViewportStateStorage(viewportStates: Float32Array) {
    updateBuffer(this.device, this.viewportStateStorage, viewportStates);
  }

  public updateU32UniformBuffer(
    gridContext: GridContextProps,
    numCellsToShow: { numColumnsToShow: number; numRowsToShow: number },
    scrollBarState: number,
    index: number
  ) {
    updateBuffer(
      this.device,
      this.u32UniformBuffer,
      createUint32BufferSource(
        this.u32UniformBufferSource,
        gridContext,
        numCellsToShow,
        scrollBarState,
        index
      )
    );
  }

  public updateDataBufferStorage(data: Float32Array | Uint32Array) {
    updateBuffer(this.device, this.gridDataBufferStorage, data);
  }

  public updateFocusedStateStorage(focusedState: Uint32Array) {
    updateBuffer(this.device, this.focusedStateStorage, focusedState);
  }

  public updateSelectedStateStorage(selectedState: Uint32Array) {
    updateBuffer(this.device, this.selectedStateStorage, selectedState);
  }

  private createBindGroup(
    label: string,
    bindGroupLayout: GPUBindGroupLayout,
    f32UniformBuffer: GPUBuffer,
    u32UniformBuffer: GPUBuffer,
    viewportBuffer: GPUBuffer,
    focusedStateStorage: GPUBuffer,
    selectedStateStorage: GPUBuffer,
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
          resource: { buffer: viewportBuffer },
        },
        {
          binding: 3,
          resource: { buffer: focusedStateStorage },
        },
        {
          binding: 4,
          resource: { buffer: selectedStateStorage },
        },
        {
          binding: 5,
          resource: { buffer: gridDataBufferStorage },
        },
      ],
    });
  }

  private createRenderBundle(
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

  public updateDrawIndirectBuffer(
    numColumnsToShow: number,
    numRowsToShow: number,
    numViewports: number
  ) {
    updateDrawIndirectBufferSource(
      this.drawIndirectBufferSource,
      this.canvasElementContext.canvasSize,
      this.canvasElementContext.headerOffset,
      numColumnsToShow,
      numRowsToShow,
      numViewports
    );
    this.device.queue.writeBuffer(
      this.drawIndirectBuffer,
      0,
      this.drawIndirectBufferSource
    );
  }

  private createBodyRenderBundle(pipeline: GPURenderPipeline) {
    return this.createRenderBundle(
      'body',
      pipeline,
      DRAW_INDIRECT_BUFFER_BYTE_INDEX.get('BODY')!
    );
  }

  private createViewportShadowRenderBundle(pipeline: GPURenderPipeline) {
    return this.createRenderBundle(
      'viewportShadow',
      pipeline,
      DRAW_INDIRECT_BUFFER_BYTE_INDEX.get('VIEWPORT_SHADOW')!
    );
  }

  private createColumnFocusRenderBundle(pipeline: GPURenderPipeline) {
    return this.createRenderBundle(
      'columnFocus',
      pipeline,
      DRAW_INDIRECT_BUFFER_BYTE_INDEX.get('TOP_HEADER')!
    );
  }

  private createRowFocusRenderBundle(pipeline: GPURenderPipeline) {
    return this.createRenderBundle(
      'rowFocus',
      pipeline,
      DRAW_INDIRECT_BUFFER_BYTE_INDEX.get('LEFT_HEADER')!
    );
  }

  private createTopHeaderRenderBundle(pipeline: GPURenderPipeline) {
    return this.createRenderBundle(
      'topHeader',
      pipeline,
      DRAW_INDIRECT_BUFFER_BYTE_INDEX.get('TOP_HEADER')!
    );
  }
  private createLeftHeaderRenderBundle(pipeline: GPURenderPipeline) {
    return this.createRenderBundle(
      'leftHeader',
      pipeline,
      DRAW_INDIRECT_BUFFER_BYTE_INDEX.get('LEFT_HEADER')!
    );
  }

  private createScrollBarBackgroundRenderBundle(pipeline: GPURenderPipeline) {
    return this.createRenderBundle(
      'scrollBarBackground',
      pipeline,
      DRAW_INDIRECT_BUFFER_BYTE_INDEX.get('SCROLLBAR_BACKGROUND')!
    );
  }
  private createScrollBarBodyRenderBundle(pipeline: GPURenderPipeline) {
    return this.createRenderBundle(
      'scrollBarBody',
      pipeline,
      DRAW_INDIRECT_BUFFER_BYTE_INDEX.get('SCROLLBAR_BODY')!
    );
  }

  public createCommandBuffer() {
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

    const renderBundles: GPURenderBundle[] = [
      this.columnFocusRenderBundle,
      this.rowFocusRenderBundle,
      this.bodyRenderBundle,
      this.viewportShadowRenderBundle,
      this.topHeaderRenderBundle,
      this.leftHeaderRenderBundle,
      this.scrollBarBackgroundRenderBundle,
      this.scrollBarBodyRenderBundle,
    ];
    passEncoder.executeBundles(renderBundles);
    passEncoder.end();
    return commandEncoder.finish();
  }

  public execute() {
    this.device.queue.submit([this.createCommandBuffer()]);
  }
}
