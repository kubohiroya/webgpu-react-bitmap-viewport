import SCHELLING_COMPUTE_SHADER from './SchellingModel.wgsl?raw';

export class SchellingCommandBufferBuilder{
  device: GPUDevice;
  gridWidth: number;
  gridHeight: number;
  computePipeline: GPUComputePipeline;
  bindGroup: GPUBindGroup;
  gridData: Float32Array;
  gridBuffer: GPUBuffer;
  newGridBuffer: GPUBuffer;
  paramBuffer: GPUBuffer;
  emptyCellsBuffer: GPUBuffer;
  randomTableBuffer: GPUBuffer;

  constructor(device: GPUDevice, gridWidth: number, gridHeight: number, gridData: Float32Array, tolerance: number) {
    this.device = device;
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.gridData = gridData;
    [
      this.computePipeline, this.bindGroup,
      this.gridBuffer, this.newGridBuffer, this.paramBuffer, this.emptyCellsBuffer, this.randomTableBuffer
    ] = this.createBindGroup(tolerance);
    // グリッドデータの初期化

  }

  public createBindGroup(tolerance: number): [GPUComputePipeline, GPUBindGroup, GPUBuffer, GPUBuffer, GPUBuffer, GPUBuffer, GPUBuffer] {
    // シミュレーションを継続的に実行
    const emptyCells: number[] = [];

    // ランダムにグリッドを初期化（エージェントA:1, エージェントB:2, 空き地:0）
    for (let i = 0; i < this.gridData.length; i++) {
      if (this.gridData[i] === Infinity) {
        emptyCells.push(i);  // 空き地のインデックスを収集
      }
    }

    const gridSize = this.gridWidth * this.gridHeight;
    const newGridData = new Uint32Array(gridSize);

    // 空き地インデックスのGPUバッファを作成
    const emptyCellsBuffer = this.device.createBuffer({
      size: emptyCells.length * 4,  // Uint32Arrayは4バイトなので、バッファのサイズを指定
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Uint32Array(emptyCellsBuffer.getMappedRange()).set(emptyCells);
    emptyCellsBuffer.unmap();

    // グリッドバッファの初期化
    const gridBuffer = this.device.createBuffer({
      size: this.gridData.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(gridBuffer.getMappedRange()).set(this.gridData);
    gridBuffer.unmap();

    const newGridBuffer = this.device.createBuffer({
      size: newGridData.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
      mappedAtCreation: true,
    });
    new Uint32Array(newGridBuffer.getMappedRange()).set(newGridData);
    newGridBuffer.unmap();

    const paramBuffer = this.device.createBuffer({
      size: 12,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Uint32Array(paramBuffer.getMappedRange()).set([this.gridWidth, this.gridHeight]);
    new Float32Array(paramBuffer.getMappedRange(), 8, 1).set([tolerance]);
    paramBuffer.unmap();

    // 乱数表のGPUバッファを作成
    const randomTableBuffer = this.device.createBuffer({
      size: gridSize * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const computePipeline = this.device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: this.device.createShaderModule({
          code: SCHELLING_COMPUTE_SHADER,
        }),
        entryPoint: 'main',
      },
    });

    const bindGroup = this.device.createBindGroup({
      layout: computePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: gridBuffer } },
        { binding: 1, resource: { buffer: newGridBuffer } },
        { binding: 2, resource: { buffer: paramBuffer } },
        { binding: 3, resource: { buffer: emptyCellsBuffer } }, // 空き地インデックスのバッファ
        { binding: 4, resource: { buffer: randomTableBuffer } }, // 乱数表のバッファ
      ],
    });

    return [computePipeline, bindGroup, gridBuffer, newGridBuffer, paramBuffer, emptyCellsBuffer, randomTableBuffer];
  }

  createCommandBuffer(device: GPUDevice,
                               gridWidth: number,
                               gridHeight: number,
                               randomTableBuffer: GPUBuffer,
                               pipeline: GPUComputePipeline,
                               bindGroup: GPUBindGroup) {
    const gridSize = gridWidth * gridHeight;
    const randomTable = new Float32Array(gridSize);  // ステップごとに1つの乱数を使用する仮定
    for (let i = 0; i < gridSize; i++) {
      randomTable[i] = Math.random();
    }
    device.queue.writeBuffer(randomTableBuffer, 0, randomTable.buffer, randomTable.byteLength);

    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.dispatchWorkgroups(Math.ceil(gridWidth / 8), Math.ceil(gridHeight / 8));
    passEncoder.end();
    return commandEncoder.finish();
  }


  public async execute(){

    for (let step = 0; true; step++) {

      const commandBuffer = this.createCommandBuffer(this.device, this.gridWidth, this.gridHeight,
        this.randomTableBuffer, this.computePipeline, this.bindGroup);

      this.device.queue.submit([commandBuffer]);

      // 結果をGPUから取得
      const resultBuffer = this.device.createBuffer({
        size: this.gridData.byteLength,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
      });

      const copyEncoder = this.device.createCommandEncoder();
      copyEncoder.copyBufferToBuffer(this.newGridBuffer, 0, resultBuffer, 0, this.gridData.byteLength);
      this.device.queue.submit([copyEncoder.finish()]);

      await resultBuffer.mapAsync(GPUMapMode.READ);
      const result = new Float32Array(resultBuffer.getMappedRange());
      console.log(`Step ${step + 1}:`, result);

      // newGridData を gridData に更新して次のステップへ
      // this.newGridData.set(result);
      this.gridBuffer.unmap();
      resultBuffer.unmap();
    }

  }
}

