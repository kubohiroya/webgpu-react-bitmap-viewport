import { EMPTY_VALUE } from 'webgpu-react-bitmap-viewport';
import { SegregationUIState } from './SegregationUIState';
import { GPUSegregationKernelData } from './GPUSegregationKernelData';
import { JSSegregationKernel } from './JSSegregationKernel';
import { shuffleUint32Array } from './utils/arrayUtils';

export class GPUSegregationKernel extends JSSegregationKernel {
  protected gpuData!: GPUSegregationKernelData;
  protected device: GPUDevice;
  protected workgroupSizeMax: number;

  protected paramsBuffer: GPUBuffer;
  protected gridBuffer!: GPUBuffer;
  protected randomBuffer!: GPUBuffer;
  protected emptyCellIndicesBuffer!: GPUBuffer;
  protected agentIndicesBuffer!: GPUBuffer;
  protected agentIndicesLengthBuffer!: GPUBuffer;
  protected movingAgentIndicesBuffer!: GPUBuffer;

  protected targetBuffer!: GPUBuffer[];

  protected bindGroupLayout: GPUBindGroupLayout;
  protected computePipelines!: Array<GPUComputePipeline>;
  protected bindGroup!: GPUBindGroup;

  protected toleranceArray = new Float32Array(1);

  constructor(
    uiState: SegregationUIState,
    device: GPUDevice,
    workgroupSizeMax: number,
  ) {
    super(uiState);
    this.device = device;
    this.workgroupSizeMax = workgroupSizeMax;
    this.paramsBuffer = this.device.createBuffer({
      label: 'paramsBuffer',
      size: Uint32Array.BYTES_PER_ELEMENT + Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Create a bind group layout
    this.bindGroupLayout = this.createBindGroupLayout([
      'uniform',
      'read-only-storage',
      'storage',
      'storage',
      'storage',
      'storage',
      'storage',
    ]);
  }

  private createBindGroup(bindGroupLayout: GPUBindGroupLayout) {
    return this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            label: 'params',
            buffer: this.paramsBuffer,
          },
        },
        {
          binding: 1,
          resource: {
            label: 'random',
            buffer: this.randomBuffer,
          },
        },
        {
          binding: 2,
          resource: {
            label: 'grid',
            buffer: this.gridBuffer,
          },
        },
        {
          binding: 3,
          resource: {
            label: 'emptyIndices',
            buffer: this.emptyCellIndicesBuffer,
          },
        },
        {
          binding: 4,
          resource: {
            label: 'agentIndices',
            buffer: this.agentIndicesBuffer,
          },
        },
        {
          binding: 5,
          resource: {
            label: 'agentIndicesLength',
            buffer: this.agentIndicesLengthBuffer,
          },
        },
        {
          binding: 6,
          resource: {
            label: 'movingAgentIndices',
            buffer: this.movingAgentIndicesBuffer,
          },
        },
      ],
    });
  }

  private createBindGroupLayout(
    types: Array<'uniform' | 'storage' | 'read-only-storage'>,
  ) {
    return this.device.createBindGroupLayout({
      entries: types.map((type, index) => {
        return {
          binding: index,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {
            type,
          },
        };
      }),
    });
  }

  private async copyBufferToUint32Array(
    sourceBuffer: GPUBuffer,
    array: Uint32Array,
    _targetBuffer?: GPUBuffer,
    offset = 0,
    size = array.byteLength,
  ) {
    const targetBuffer: GPUBuffer =
      _targetBuffer ||
      this.device.createBuffer({
        size: array.byteLength,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      });
    const copyEncoder = this.device.createCommandEncoder();
    copyEncoder.copyBufferToBuffer(sourceBuffer, offset, targetBuffer, 0, size);
    this.device.queue.submit([copyEncoder.finish()]);
    await this.device.queue.onSubmittedWorkDone();
    await targetBuffer.mapAsync(GPUMapMode.READ);
    array.set(new Uint32Array(targetBuffer.getMappedRange(0, size)));
    await this.device.queue.onSubmittedWorkDone();

    targetBuffer.unmap();
    if (!_targetBuffer) {
      targetBuffer.destroy();
    }
  }

  private async copyBufferToFloat32Array(
    sourceBuffer: GPUBuffer,
    array: Float32Array,
    _targetBuffer?: GPUBuffer,
  ) {
    const targetBuffer: GPUBuffer =
      _targetBuffer ||
      this.device.createBuffer({
        size: array.byteLength,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      });
    const copyEncoder = this.device.createCommandEncoder();
    copyEncoder.copyBufferToBuffer(
      sourceBuffer,
      0,
      targetBuffer,
      0,
      array.byteLength,
    );
    this.device.queue.submit([copyEncoder.finish()]);
    await this.device.queue.onSubmittedWorkDone();
    await targetBuffer.mapAsync(GPUMapMode.READ);
    array.set(new Float32Array(targetBuffer.getMappedRange()));

    targetBuffer.unmap();
    if (!_targetBuffer) {
      targetBuffer.destroy();
    }
  }

  updateGridSize(
    width: number,
    height: number,
    agentShares: number[],
    tolerance: number,
  ) {
    super.updateGridSize(width, height, agentShares, tolerance);
    this.setTolerance(tolerance);
    const totalCells = width * height;
    this.data.emptyCellIndices = new Uint32Array(totalCells + 1); // last item is length of the array body
    this.data.movingAgentIndices = new Uint32Array(totalCells + 1); // last item is length of the array body

    this.randomBuffer && this.randomBuffer.destroy();
    this.gridBuffer && this.gridBuffer.destroy();

    this.emptyCellIndicesBuffer && this.emptyCellIndicesBuffer.destroy();
    this.agentIndicesBuffer && this.agentIndicesBuffer.destroy();
    this.agentIndicesLengthBuffer && this.agentIndicesLengthBuffer.destroy();
    this.movingAgentIndicesBuffer && this.movingAgentIndicesBuffer.destroy();
    this.targetBuffer?.[0] && this.targetBuffer[0].destroy();
    this.targetBuffer?.[1] && this.targetBuffer[1].destroy();
    this.targetBuffer?.[2] && this.targetBuffer[2].destroy();

    this.gpuData = new GPUSegregationKernelData(
      width,
      height,
      this.workgroupSizeMax,
    );

    this.randomBuffer = this.device.createBuffer({
      label: 'randomBuffer',
      size: totalCells * Uint32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    // Create GPUBuffer for input grid data
    this.gridBuffer = this.device.createBuffer({
      label: 'gridBuffer',
      size: totalCells * Uint32Array.BYTES_PER_ELEMENT,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_SRC |
        GPUBufferUsage.COPY_DST,
    });

    this.emptyCellIndicesBuffer = this.device.createBuffer({
      label: 'emptyCellIndicesBuffer',
      size: (totalCells + 1) * Uint32Array.BYTES_PER_ELEMENT,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_SRC |
        GPUBufferUsage.COPY_DST,
    });

    const totalItems = this.gpuData.workgroupSize * this.gpuData.dispatchSize;
    // Create GPUBuffer for output data (agentIndices, agentIndicesLength)
    this.agentIndicesBuffer = this.device.createBuffer({
      label: 'agentIndicesBuffer',
      size: (totalCells + 1) * Uint32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });
    this.agentIndicesLengthBuffer = this.device.createBuffer({
      label: 'agentIndicesLengthBuffer',
      size: totalItems * Uint32Array.BYTES_PER_ELEMENT,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
    });
    this.movingAgentIndicesBuffer = this.device.createBuffer({
      label: 'movingAgentIndicesBuffer',
      size: (totalCells + 1) * Uint32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    this.targetBuffer = [
      this.device.createBuffer({
        label: 'targetBuffer0',
        size: totalCells * Uint32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
      }),
      this.device.createBuffer({
        label: 'targetBuffer1',
        size: (totalItems + 1) * Uint32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
      }),
      this.device.createBuffer({
        label: 'targetBuffer2',
        size: totalItems * Uint32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
      }),
    ];
    /*
    this.targetBuffer2 = this.device.createBuffer({
      label: 'targetBuffer2',
      size: (totalCells + 1) * Uint32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });
     */

    const computeShaderModule = this.createShaderModule();

    this.bindGroup = this.createBindGroup(this.bindGroupLayout);

    // Set up compute pipeline
    this.computePipelines = [
      this.device.createComputePipeline({
        label: 'pipeline0',
        layout: this.device.createPipelineLayout({
          bindGroupLayouts: [this.bindGroupLayout],
        }),
        compute: {
          module: computeShaderModule,
          entryPoint: 'main0',
        },
      }),
      this.device.createComputePipeline({
        label: 'pipeline1',
        layout: this.device.createPipelineLayout({
          bindGroupLayouts: [this.bindGroupLayout],
        }),
        compute: {
          module: computeShaderModule,
          entryPoint: 'main1',
        },
      }),
      this.device.createComputePipeline({
        label: 'pipeline2',
        layout: this.device.createPipelineLayout({
          bindGroupLayouts: [this.bindGroupLayout],
        }),
        compute: {
          module: computeShaderModule,
          entryPoint: 'main2',
        },
      }),
      this.device.createComputePipeline({
        label: 'pipeline3',
        layout: this.device.createPipelineLayout({
          bindGroupLayouts: [this.bindGroupLayout],
        }),
        compute: {
          module: computeShaderModule,
          entryPoint: 'main3',
        },
      }),
      this.device.createComputePipeline({
        label: 'pipeline4',
        layout: this.device.createPipelineLayout({
          bindGroupLayouts: [this.bindGroupLayout],
        }),
        compute: {
          module: computeShaderModule,
          entryPoint: 'main4',
        },
      }),
    ];
  }

  syncGridContent(grid: Uint32Array) {
    super.syncGridContent(grid);
    this.device.queue.writeBuffer(this.gridBuffer, 0, this.data.grid);
    this.updateEmptyCellIndices();

    this.data.emptyCellIndices[this.data.emptyCellIndices.length - 1] =
      this.data.emptyCellIndicesLength;
    this.device.queue.writeBuffer(
      this.emptyCellIndicesBuffer,
      0,
      this.data.emptyCellIndices,
    );
  }

  updateEmptyCellIndices() {
    super.updateEmptyCellIndices(this.data.emptyCellIndices);
  }
  private getBlockWidth = () => {
    return Math.ceil(this.data.width / this.gpuData.workgroupSize);
  };
  private getBlockHeight = () => {
    return Math.ceil(this.data.height / this.gpuData.dispatchSize);
  };

  createShaderModule() {
    // Create the compute shader module (WGSL)
    const wgslCode = `
      const EMPTY_VALUE = ${EMPTY_VALUE};
      const width = ${this.data.width};
      const height = ${this.data.height};
      const workgroupSize = ${this.gpuData.workgroupSize};
      const dispatchSize = ${this.gpuData.dispatchSize};
      const blockWidth = ${Math.ceil(this.data.width / this.gpuData.workgroupSize)};
      const blockHeight = ${Math.ceil(this.data.height / this.gpuData.dispatchSize)};
      const blockSize = ${this.getBlockWidth() * this.getBlockHeight()};
      const ghostZoneWidth = blockWidth + 2;

      struct Params {
        tolerance: f32,
      }

      @group(0) @binding(0) var<uniform> params: Params;
      @group(0) @binding(1) var<storage, read> random: array<f32>;
      @group(0) @binding(2) var<storage, read_write> grid: array<u32>;
      @group(0) @binding(3) var<storage, read_write> emptyCellIndices: array<u32>;
      @group(0) @binding(4) var<storage, read_write> agentIndices: array<u32>;
      @group(0) @binding(5) var<storage, read_write> agentIndicesLength: array<u32>;
      @group(0) @binding(6) var<storage, read_write> movingAgentIndices: array<u32>;
      
      fn countSimilarNeighbor(localX: u32, 
        rowRingBuffer: ptr<function, array<array<u32, ghostZoneWidth>,3>>, localY: u32, agentType: u32) -> vec2u{
        let value = rowRingBuffer[localY][localX];
        return vec2u(select(0u, 1u, value == agentType), select(0u, 1u, value != EMPTY_VALUE));
      }

      fn countSimilarNeighbors(localX: u32, agentType: u32, 
        rowCache: ptr<function, array<array<u32, ghostZoneWidth>, 3>>,
        prev: u32, current: u32, next: u32) -> vec2u {
          return countSimilarNeighbor(localX - 1, rowCache, prev, agentType) +
                 countSimilarNeighbor(localX,     rowCache, prev, agentType) +
                 countSimilarNeighbor(localX + 1, rowCache, prev, agentType) +
      
                 countSimilarNeighbor(localX - 1, rowCache, current, agentType) +
                 countSimilarNeighbor(localX + 1, rowCache, current, agentType) +
      
                 countSimilarNeighbor(localX - 1, rowCache, next, agentType) +
                 countSimilarNeighbor(localX,     rowCache, next, agentType) +
                 countSimilarNeighbor(localX + 1, rowCache, next, agentType);
      }

      @compute @workgroup_size(workgroupSize)
      fn main0(@builtin(workgroup_id) workgroup_id: vec3<u32>, @builtin(local_invocation_id) local_id: vec3<u32>) {
        // CREATE AGENT IDICES ARRAY  
        let workgroupIndex = workgroup_id.x;
        let threadIndex = local_id.x;            
        let blockStartX = workgroupIndex * blockWidth;
        
        if(blockStartX < width){

          let blockStartY = threadIndex * blockHeight;
          let workItemIndex = workgroupIndex * dispatchSize + threadIndex;

          var rowCache: array<array<u32, ghostZoneWidth>, 3>;
          
          // Fill the initial rowCache (first 3 rows including ghost zones)

          let globalY = (blockStartY + height) % height;
          for (var localX = 0u; localX < ghostZoneWidth && blockStartX + localX <= width; localX++) {
            let globalX = (blockStartX + localX - 1u + width) % width;
            rowCache[0u][localX] = select(grid[(globalY - 1u) * width + globalX], 
                                          grid[(height - 1u) * width + globalX], 
                                          blockStartY == 0u);
            rowCache[1u][localX] = grid[globalY * width + globalX];
          }
          
          let agentIndexBase = workItemIndex * blockSize;
          var agentCounter = 0u;
          
          for(var localY = 0u; localY < blockHeight && blockStartY + localY < height; localY++){
            let globalY = blockStartY + localY;
            
            for (var localX = 0u; localX < ghostZoneWidth && blockStartX + localX <= width; localX++) {
              let globalX = (blockStartX + localX - 1u + width) % width;
              rowCache[(localY + 2u) % 3u][localX] = select(grid[globalX],
                                      grid[(blockStartY + localY + 1u) * width + globalX],
                                      blockStartY + localY != height - 1u);
            }
            
            for(var localX = 0u; localX < blockWidth && blockStartX + localX < width; localX++){

              let ghostZoneX = localX + 1u;
              let currentAgent = rowCache[(localY + 1u) % 3u][ghostZoneX];
              if (currentAgent == EMPTY_VALUE) {
                continue;
              }

              let neighbors = countSimilarNeighbors(ghostZoneX, currentAgent, &rowCache, localY % 3u, (localY + 1u) % 3u, (localY + 2u) % 3u);
              let similarCount = neighbors.x;
              let totalNeighbors = neighbors.y;
              if(totalNeighbors == 0){
                continue;
              }
              
              let satisfactionRatio = f32(similarCount) / f32(totalNeighbors);
              if (satisfactionRatio < params.tolerance) {
                // Write the unsatisfied agent's original index
                let globalX = blockStartX + localX;
                agentIndices[agentIndexBase + agentCounter] = globalY * width + globalX;
                agentCounter++;
              }
            }                
          }
          agentIndicesLength[workItemIndex] = agentCounter;
        }
      }

      @compute @workgroup_size(1)
      fn main1() {
        // TOTALIZE AGENT IDICES LENGTH ARRAY  
        var total = 0u;
        for(var i = 0u; i < workgroupSize * dispatchSize; i++){
          let current = agentIndicesLength[i];
          total += current;
          agentIndicesLength[i] = total;
        }
        movingAgentIndices[arrayLength(&movingAgentIndices) - 1u] = total;
      }

      @compute @workgroup_size(workgroupSize)
      fn main2(@builtin(workgroup_id) workgroup_id: vec3<u32>, @builtin(local_invocation_id) local_id: vec3<u32>) {
        // REDUCE AGENT IDICES ARRAY  
        let workgroupIndex = workgroup_id.x;
        let threadIndex = local_id.x;
        let workitemIndex = workgroupSize * workgroupIndex + threadIndex;
        
        let start = select(agentIndicesLength[workitemIndex - 1u], 0, workitemIndex == 0);
        let end = agentIndicesLength[workitemIndex];
        for(var i = 0u; i < end - start; i++){
          movingAgentIndices[start + i] = agentIndices[workitemIndex * blockSize + i];
        }
      }

      @compute @workgroup_size(2)
      fn main3(@builtin(workgroup_id) workgroup_id: vec3<u32>, @builtin(local_invocation_id) local_id: vec3<u32>) {
        // SHUFFLE EMPTY CELL INDICES AND AGENT IDICES ARRAY
        let workgroupIndex = workgroup_id.x;
        let threadIndex = local_id.x;
        if(workgroupIndex == 0){
          var length = emptyCellIndices[arrayLength(&emptyCellIndices) - 1u];
          for(var i = 0u; i < length; i++){
            let randomIndex = u32(floor(random[i] * f32(length)));
            let newValue = emptyCellIndices[randomIndex];
            emptyCellIndices[randomIndex] = emptyCellIndices[i];
            emptyCellIndices[i] = newValue;
          }
        }else{
          let length = movingAgentIndices[arrayLength(&movingAgentIndices) - 1u];
          let base = arrayLength(&random) - length - 1;
          for(var i = 0u; i < length; i++){
            let randomIndex = u32(floor(random[base + i] * f32(length)));
            let newValue = movingAgentIndices[randomIndex];
            movingAgentIndices[randomIndex] = movingAgentIndices[i];
            movingAgentIndices[i] = newValue;
          }
        }
      }

      @compute @workgroup_size(workgroupSize)
      fn main4(@builtin(workgroup_id) workgroup_id: vec3<u32>, @builtin(local_invocation_id) local_id: vec3<u32>) {
        // MOVE AGENTS
        let workgroupIndex = workgroup_id.x;
        let threadIndex = local_id.x;
        let workitemIndex = workgroupSize * workgroupIndex + threadIndex;
        let emptyIndicesLength = emptyCellIndices[arrayLength(&emptyCellIndices) - 1u];
        let movingAgentIndicesLength = movingAgentIndices[arrayLength(&movingAgentIndices) - 1u];
        let length = min(emptyIndicesLength, movingAgentIndicesLength);
        let blockLength = u32(ceil(f32(length) / f32(workgroupSize * dispatchSize)));
        let start = blockLength * workitemIndex;
        let end = min(blockLength * (workitemIndex + 1u), length);
        for(var i = start; i < end; i++){
          let emptyCellIndex = emptyCellIndices[i];
          let movingAgentIndex = movingAgentIndices[i];
          grid[emptyCellIndex] = grid[movingAgentIndex];
          grid[movingAgentIndex] = EMPTY_VALUE;
          emptyCellIndices[i] = movingAgentIndex;
        }
      }
    `;
    return this.device.createShaderModule({
      code: wgslCode,
    });
  }

  private updateRandomBuffer = (size: number): ArrayBufferLike => {
    const base = this.data.width * this.data.height - size;
    for (let i = 0; i < size; i++) {
      this.gpuData.random[i] = Math.random();
      this.gpuData.random[base + i] = Math.random();
    }
    return this.gpuData.random.buffer;
  };

  async debugUint32(label: string, gpuBuffer: GPUBuffer, arrayLength: number) {
    const debugData = new Uint32Array(arrayLength);
    await this.copyBufferToUint32Array(gpuBuffer, debugData);
    console.log(label, debugData);
  }

  async debugFloat32(label: string, gpuBuffer: GPUBuffer, arrayLength: number) {
    const debugData = new Float32Array(arrayLength);
    await this.copyBufferToFloat32Array(gpuBuffer, debugData);
    console.log(label, debugData);
  }

  private createCommandBuffer(
    computePipeline: GPUComputePipeline,
    dispatchSize: number,
  ) {
    // Create command encoder and compute pass encoder
    const commandEncoder = this.device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(computePipeline);
    passEncoder.setBindGroup(0, this.bindGroup);
    passEncoder.dispatchWorkgroups(dispatchSize);
    passEncoder.end();
    return commandEncoder.finish();
  }

  private compactIndicesArray(
    agentIndicesArray: Uint32Array,
    agentIndicesLengthArray: Uint32Array,
    movingAgentIndices: Uint32Array,
  ): number {
    let movingAgentIndicesLength = 0;
    const blockSize = this.getBlockWidth() * this.getBlockHeight();
    for (
      let blockIndex = 0;
      blockIndex < agentIndicesLengthArray.length;
      blockIndex++
    ) {
      for (let i = 0; i < agentIndicesLengthArray[blockIndex]; i++) {
        movingAgentIndices[movingAgentIndicesLength] =
          agentIndicesArray[blockIndex * blockSize + i];
        movingAgentIndicesLength++;
      }
    }
    return movingAgentIndicesLength;
  }

  async tick(): Promise<Uint32Array> {
    const DEBUG = false;
    const BULK_RANDOM = true;
    const FULL_WEBGPU = false;

    if (BULK_RANDOM) {
      this.updateRandomBuffer(this.data.width * this.data.height);
      this.device.queue.writeBuffer(this.randomBuffer, 0, this.gpuData.random);
    }

    const command0 = this.createCommandBuffer(
      this.computePipelines[0],
      this.gpuData.dispatchSize,
    ); // count

    if (FULL_WEBGPU) {
      const command1 = this.createCommandBuffer(this.computePipelines[1], 1); // totalize
      const command2 = this.createCommandBuffer(
        this.computePipelines[2],
        this.gpuData.dispatchSize,
      ); // reduce
      const command3 = this.createCommandBuffer(this.computePipelines[3], 1); // shuffle
      const command4 = this.createCommandBuffer(
        this.computePipelines[4],
        this.gpuData.dispatchSize,
      );
      if (BULK_RANDOM) {
        this.device.queue.submit([
          command0,
          command1,
          command2,
          command3,
          command4,
        ]);
      } else {
        this.device.queue.submit([command0, command1 /*, command2*/]);
        await this.device.queue.onSubmittedWorkDone();
        const movingAgentLengthArray = new Uint32Array(1);
        await this.copyBufferToUint32Array(
          this.movingAgentIndicesBuffer,
          movingAgentLengthArray,
          this.targetBuffer[0],
          this.data.movingAgentIndices.byteLength -
            Uint32Array.BYTES_PER_ELEMENT,
          Uint32Array.BYTES_PER_ELEMENT,
        );
        const movingAgentIndicesLength = movingAgentLengthArray[0];

        // console.log({movingAgentLength,emptyCellIndicesLength: this.data.emptyCellIndicesLength,});

        this.updateRandomBuffer(
          Math.min(movingAgentIndicesLength, this.data.emptyCellIndicesLength),
        );
        this.device.queue.writeBuffer(
          this.randomBuffer,
          0,
          this.gpuData.random,
        );
        this.device.queue.submit([command3, command4]);
      }

      await this.device.queue.onSubmittedWorkDone();
      await this.copyBufferToUint32Array(
        this.gridBuffer,
        this.data.grid,
        this.targetBuffer[0],
      );
      DEBUG &&
        (await this.debugUint32(
          'emptyCellIndices',
          this.emptyCellIndicesBuffer,
          this.data.width * this.data.height + 1,
        ));
      DEBUG &&
        (await this.debugUint32(
          'movingAgentIndices',
          this.movingAgentIndicesBuffer,
          this.data.width * this.data.height + 1,
        ));
    } else {
      this.device.queue.submit([command0]);
      /*
      console.log(
        this.agentIndicesLengthBuffer.size,
        this.gpuData.agentIndicesLengthArray.length,
        this.targetBuffer[1].size,
      );
       */
      await Promise.all([
        this.copyBufferToUint32Array(
          this.agentIndicesBuffer,
          this.gpuData.agentIndicesArray,
        ),
        this.copyBufferToUint32Array(
          this.agentIndicesLengthBuffer,
          this.gpuData.agentIndicesLengthArray,
        ),
      ]);

      DEBUG &&
        console.log(
          `blockSize ${this.getBlockWidth()} * ${this.getBlockHeight()}`,
        );
      DEBUG && console.log('agentIndicesArray', this.gpuData.agentIndicesArray);
      DEBUG &&
        console.log(
          'agentIndicesLengthArray',
          this.gpuData.agentIndicesLengthArray,
        );

      this.data.movingAgentIndicesLength = this.compactIndicesArray(
        this.gpuData.agentIndicesArray,
        this.gpuData.agentIndicesLengthArray,
        this.data.movingAgentIndices,
      );

      DEBUG && console.log('movingAgentIndices', this.data.movingAgentIndices);
      DEBUG &&
        console.log(
          'movingAgentIndicesLength',
          this.data.movingAgentIndicesLength,
        );

      shuffleUint32Array(
        this.data.emptyCellIndices,
        this.data.emptyCellIndicesLength,
      );
      shuffleUint32Array(
        this.data.movingAgentIndices,
        this.data.movingAgentIndicesLength,
      );

      DEBUG && console.log(this.data.movingAgentIndices);

      this.moveAgentAndSwapEmptyCell(
        this.data.grid,
        this.data.emptyCellIndices,
        this.data.emptyCellIndicesLength,
        this.data.movingAgentIndices,
        this.data.movingAgentIndicesLength,
      );
      this.device.queue.writeBuffer(this.gridBuffer, 0, this.data.grid);
    }

    return this.data.grid;
  }

  setTolerance(newTolerance: number) {
    this.toleranceArray[0] = newTolerance;
    this.device.queue.writeBuffer(
      this.paramsBuffer,
      0,
      this.toleranceArray,
      0,
      this.toleranceArray.length,
    );
  }
}
