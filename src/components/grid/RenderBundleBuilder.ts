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
import GRID_SHADER_CODE from './GridShader.wgsl?raw';
import { CanvasElementContextType } from './CanvasElementContext';
import { vertices, VERTICES_BYTE_LENGTH } from './Vertices';
import { F32LEN, U32LEN } from './Constants';
import {
  DRAW_INDIRECT_BUFFER_BYTE_INDEX,
  DRAW_INDIRECT_BUFFER_SOURCE,
  updateDrawIndirectBufferSource
} from './DrawIndirectBufferFactory';
import { BIND_GROUP_LAYOUT_DESCRIPTOR } from './BindGroupLayoutDescriptor';

import { createStorageBuffer, createUniformBuffer, createVertexBuffer, updateBuffer } from './WebGPUBufferFactories';
import { SCROLLBAR_MARGIN, SCROLLBAR_RADIUS } from './GridParamsDefault';

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

  private columnFocusSelectPipeline: GPURenderPipeline;
  private rowFocusSelectPipeline: GPURenderPipeline;
  private bodyPipeline: GPURenderPipeline;
  private viewportShadowPipeline: GPURenderPipeline;
  private leftHeaderPipeline: GPURenderPipeline;
  private topHeaderPipeline: GPURenderPipeline;
  private scrollBarBackgroundPipeline: GPURenderPipeline;
  private scrollBarBodyPipeline: GPURenderPipeline;

  private columnFocusRenderBundle: GPURenderBundle;
  private rowFocusRenderBundle: GPURenderBundle;
  private bodyRenderBundle: GPURenderBundle;
  private viewportShadowRenderBundle: GPURenderBundle;
  private topHeaderRenderBundle: GPURenderBundle;
  private leftHeaderRenderBundle: GPURenderBundle;
  private scrollBarBackgroundRenderBundle: GPURenderBundle;
  private scrollBarBodyRenderBundle: GPURenderBundle;

  constructor(
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
      code: GRID_SHADER_CODE
    });

    const bindGroupLayout = device.createBindGroupLayout(
      BIND_GROUP_LAYOUT_DESCRIPTOR
    );

    const pipelineLayout = device.createPipelineLayout({
      label: 'Grid renderer pipeline layout',
      bindGroupLayouts: [bindGroupLayout]
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
            count: canvasElementContext.multisample
          }
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
                  shaderLocation: 0
                }
              ]
            }
          ]
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
                  operation: 'add'
                },
                alpha: {
                  srcFactor: 'one',
                  dstFactor: 'one-minus-src-alpha',
                  operation: 'add'
                }
              }
            }
          ]
        }
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

    this.viewportShadowPipeline = createPipeline(
      'viewportShadow',
      device,
      'vertexViewportShadow',
      'fragmentViewportShadow'
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
          scrollBarRadius: canvasElementContext.scrollBar?.radius || SCROLLBAR_RADIUS,
          scrollBarMargin: canvasElementContext.scrollBar?.margin || SCROLLBAR_MARGIN
        }
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
      usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.COPY_DST
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

    const numCells =
      Math.max(gridSize.numColumns, gridSize.numRows) *
      F32LEN;
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
      gridSize.numColumns * gridSize.numRows * 4
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

    this.columnFocusRenderBundle = this.createColumnFocusRenderBundle();
    this.rowFocusRenderBundle = this.createRowFocusRenderBundle();
    this.bodyRenderBundle = this.createBodyRenderBundle();
    this.viewportShadowRenderBundle = this.createViewportShadowRenderBundle();
    this.topHeaderRenderBundle = this.createTopHeaderRenderBundle();
    this.leftHeaderRenderBundle = this.createLeftHeaderRenderBundle();
    this.scrollBarBodyRenderBundle = this.createScrollBarBodyRenderBundle();
    this.scrollBarBackgroundRenderBundle =
      this.createScrollBarBackgroundRenderBundle();
  }

  updateF32UniformBuffer(
    gridContext: GridContextProps,
    overscroll: { x: number; y: number },
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

  updateViewportStateStorage(
    viewportStates: Float32Array,
  ){
    updateBuffer(
      this.device,
      this.viewportStateStorage,
      viewportStates
    );
  }

  updateU32UniformBuffer(
    gridContext: GridContextProps,
    numCellsToShow: { numColumnsToShow: number; numRowsToShow: number },
    scrollBarState: number,
    index: number
  ) {
    updateBuffer(
      this.device,
      this.u32UniformBuffer,
      createUint32BufferSource(this.u32UniformBufferSource, gridContext, numCellsToShow, scrollBarState, index)
    );
  }

  updateDataBufferStorage(data: Float32Array) {
    updateBuffer(this.device, this.gridDataBufferStorage, data);
  }

  updateFocusedStateStorage(focusedState: Uint32Array) {
    updateBuffer(
      this.device,
      this.focusedStateStorage,
      focusedState
    );
  }

  updateSelectedStateStorage(selectedState: Uint32Array) {
    updateBuffer(
      this.device,
      this.selectedStateStorage,
      selectedState
    );
  }

  createBindGroup(
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
          resource: { buffer: f32UniformBuffer }
        },
        {
          binding: 1,
          resource: { buffer: u32UniformBuffer }
        },
        {
          binding: 2,
          resource: { buffer: viewportBuffer }
        },
        {
          binding: 3,
          resource: { buffer: focusedStateStorage }
        },
        {
          binding: 4,
          resource: { buffer: selectedStateStorage }
        },
        {
          binding: 5,
          resource: { buffer: gridDataBufferStorage }
        }
      ]
    });
  }

  createRenderBundle(
    label: string,
    pipeline: GPURenderPipeline,
    indirectOffset: number
  ) {
    const encoder = this.device.createRenderBundleEncoder({
      label,
      colorFormats: [this.canvasFormat]
    });
    encoder.setPipeline(pipeline);
    encoder.setVertexBuffer(0, this.vertexBuffer);
    encoder.setBindGroup(0, this.bindGroup);
    encoder.drawIndirect(this.drawIndirectBuffer, indirectOffset);
    return encoder.finish();
  }

  updateDrawIndirectBuffer(
    numColumnsToShow: number,
    numRowsToShow: number,
    numViewports: number
  ) {
    updateDrawIndirectBufferSource(
      this.drawIndirectBufferSource,
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

  createBodyRenderBundle() {
    return this.createRenderBundle(
      'body',
      this.bodyPipeline,
      DRAW_INDIRECT_BUFFER_BYTE_INDEX.get('BODY')!
    );
  }

  createViewportShadowRenderBundle() {
    return this.createRenderBundle(
      'viewportShadow',
      this.viewportShadowPipeline,
      DRAW_INDIRECT_BUFFER_BYTE_INDEX.get('VIEWPORT_SHADOW')!
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
            this.canvasElementContext.canvasSize.height
          ],
          sampleCount: multisample,
          format: this.canvasFormat,
          usage: GPUTextureUsage.RENDER_ATTACHMENT
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
          storeOp: multisample !== undefined ? 'discard' : 'store'
        }
      ]
    });
    passEncoder.executeBundles(renderBundles);
    passEncoder.end();
    this.device.queue.submit([commandEncoder.finish()]);
  }

  execute() {
    this.executeRenderBundles([
      this.columnFocusRenderBundle,
      this.rowFocusRenderBundle,
      this.viewportShadowRenderBundle,
      this.bodyRenderBundle,
      this.topHeaderRenderBundle,
      this.leftHeaderRenderBundle,
      this.scrollBarBackgroundRenderBundle,
      this.scrollBarBodyRenderBundle
    ]);
  }
}
