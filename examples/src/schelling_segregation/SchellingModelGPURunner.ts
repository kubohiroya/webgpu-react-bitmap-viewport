import SCHELLING_COMPUTE_SHADER from './SchellingModelShader.wgsl?raw';
import SCHELLING_PARALLEL_COMPUTE_SHADER from './SchellingParallelModelShader.wgsl?raw';
import { EMPTY_VALUE } from 'webgpu-react-grid';

export type SchellingModelRunnerProps = {
  device: GPUDevice;
  gridWidth: number;
  gridHeight: number;
  gridData: Uint32Array;
  tolerance: number;
  parallel?: boolean;
};

export const SchellingModelGPURunner = (props: SchellingModelRunnerProps) => {
  const _emptyGridIndices: number[] = [];
  for (let i = 0; i < props.gridData.length; i++) {
    if (props.gridData[i] === EMPTY_VALUE) {
      _emptyGridIndices.push(i); // 空き地のインデックスを収集
    }
  }
  const emptyGridIndices = new Uint32Array(_emptyGridIndices);
  const gridSize = props.gridWidth * props.gridHeight;

  // 空き地インデックスのGPUバッファを作成
  const emptyGridIndicesBuffer = props.device.createBuffer({
    label: 'S:EmptyCellsBuffer',
    size: gridSize * 4, // Uint32Arrayは4バイトなので、バッファのサイズを指定
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  props.device.queue.writeBuffer(emptyGridIndicesBuffer, 0, emptyGridIndices);

  // グリッドバッファの初期化
  const gridBuffer = props.device.createBuffer({
    label: 'S:GridBuffer',
    size: props.gridData.byteLength,
    usage:
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.COPY_DST |
      GPUBufferUsage.COPY_SRC,
  });
  props.device.queue.writeBuffer(gridBuffer, 0, props.gridData.buffer);

  const paramBuffer = props.device.createBuffer({
    label: 'S:ParamBuffer',
    size: 12,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  props.device.queue.writeBuffer(
    paramBuffer,
    0,
    new Uint32Array([props.gridWidth, props.gridHeight])
  );
  props.device.queue.writeBuffer(
    paramBuffer,
    8,
    new Float32Array([props.tolerance])
  );

  // 乱数表のGPUバッファを作成
  const randomTableBuffer = props.device.createBuffer({
    label: 'S:RandomTableBuffer',
    size: gridSize * 4,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  const readerGridBuffer = props.device.createBuffer({
    label: 'S:RetGridBuffer',
    size: props.gridData.byteLength,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });

  const computePipeline = props.device.createComputePipeline({
    label: 'S:SchellingComputePipeline',
    layout: 'auto',
    compute: {
      module: props.device.createShaderModule({
        code: props.parallel
          ? SCHELLING_PARALLEL_COMPUTE_SHADER
          : SCHELLING_COMPUTE_SHADER,
      }),
      constants: {
        EMPTY_VALUE: EMPTY_VALUE,
      },
      entryPoint: 'main',
    },
  });

  const bindGroup = props.device.createBindGroup({
    label: 'S:SchellingBindGroup',
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 6, resource: { buffer: gridBuffer } },
      { binding: 7, resource: { buffer: paramBuffer } },
      { binding: 8, resource: { buffer: randomTableBuffer } }, // 乱数表のバッファ
      { binding: 9, resource: { buffer: emptyGridIndicesBuffer } }, // 空き地インデックスのバッファ
    ],
  });

  const writeRandomTableBuffer = (randomTableBuffer: GPUBuffer) => {
    const randomTable = new Float32Array(gridSize); // ステップごとに1つの乱数を使用する仮定
    for (let i = 0; i < gridSize; i++) {
      randomTable[i] = Math.random();
    }
    props.device.queue.writeBuffer(
      randomTableBuffer,
      0,
      randomTable.buffer,
      randomTable.byteLength
    );
  };

  const createCommandBuffer = (
    pipeline: GPUComputePipeline,
    bindGroup: GPUBindGroup
  ) => {
    const commandEncoder = props.device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);

    if (props.parallel) {
      const workgroupSize = 8;
      passEncoder.dispatchWorkgroups(
        Math.ceil(props.gridWidth / workgroupSize),
        Math.ceil(props.gridHeight / workgroupSize)
      );
    } else {
      passEncoder.dispatchWorkgroups(1);
    }
    passEncoder.end();
    return commandEncoder.finish();
  };

  return async (): Promise<Uint32Array> => {
    writeRandomTableBuffer(randomTableBuffer);
    const commandBuffer = createCommandBuffer(computePipeline, bindGroup);
    props.device.queue.submit([commandBuffer]);
    const copyEncoder = props.device.createCommandEncoder();
    copyEncoder.copyBufferToBuffer(
      gridBuffer,
      0,
      readerGridBuffer,
      0,
      props.gridData.byteLength
    );
    props.device.queue.submit([copyEncoder.finish()]);
    await readerGridBuffer.mapAsync(GPUMapMode.READ);
    props.gridData.set(new Uint32Array(readerGridBuffer.getMappedRange()));
    readerGridBuffer.unmap();
    return props.gridData;
  };
};
export default SchellingModelGPURunner;
