import { EMPTY_VALUE } from 'webgpu-react-bitmap-viewport';
import { SchellingSegregationModel } from './SchellingSegregationModel';
import { SchellingSegregationKernel } from './SchellingSegregationKernel';
import * as SchellingSegregationKernelFunctions from '../as/assembly/SchellingSegregationKernelFunctions';
import { shuffleUint32Array } from './arrayUtils';
import { SchellingSegregationModes } from './SchellingSegregationShellProps';

// TypeScript: WebGPU Implementation for Schelling's Segregation Model
export class SchellingSegregationKernelGPU extends SchellingSegregationKernel {
  private device: GPUDevice;

  private toleranceBuffer: GPUBuffer;
  private gridBuffer!: GPUBuffer;
  private agentIndicesBuffer!: GPUBuffer;
  private agentIndicesLengthBuffer!: GPUBuffer;

  private agentIndicesTargetBuffer!: GPUBuffer;
  private agentIndicesLengthTargetBuffer!: GPUBuffer;

  private bindGroupLayout: GPUBindGroupLayout;
  private computePipeline!: GPUComputePipeline;
  private bindGroup!: GPUBindGroup;
  private toleranceArray = new Float32Array(1);

  private emptyCellIndices!: Uint32Array;
  private emptyCellIndicesLength: number = 0;
  private agentIndicesArray!: Uint32Array;
  private agentIndicesLengthArray!: Uint32Array;
  private movingAgentIndicesArray!: Uint32Array;
  private movingAgentIndicesArrayLength: number = 0;

  private workgroupSize: number = -1;
  private dispatchSize: number = -1;
  private blockSize: number = -1;
  private totalCells: number = -1;
  private currentGridSize: number = -1;

  constructor(model: SchellingSegregationModel, device: GPUDevice) {
    super(model);
    this.device = device;

    // Create GPUBuffer for tolerance value
    this.toleranceBuffer = this.device.createBuffer({
      label: 'toleranceBuffer',
      size: Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Create a bind group layout
    this.bindGroupLayout = this.createBindGroupLayout();

    this.updateGridSize();
  }

  createBindGroupLayout() {
    return this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {
            type: 'storage',
          },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {
            type: 'storage',
          },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {
            type: 'read-only-storage',
          },
        },
        {
          binding: 3,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {
            type: 'uniform',
          },
        },
      ],
    });
  }

  createBindGroup() {
    return this.device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.agentIndicesBuffer,
          },
        },
        {
          binding: 1,
          resource: {
            buffer: this.agentIndicesLengthBuffer,
          },
        },
        {
          binding: 2,
          resource: {
            buffer: this.gridBuffer,
          },
        },
        {
          binding: 3,
          resource: {
            buffer: this.toleranceBuffer,
          },
        },
      ],
    });
  }

  updateEmptyCellIndices() {
    this.emptyCellIndicesLength = 0;
    for (let i = 0; i < this.totalCells; i++) {
      if (this.model.grid[i] === EMPTY_VALUE) {
        this.emptyCellIndices[this.emptyCellIndicesLength] = i;
        this.emptyCellIndicesLength++;
      }
    }
  }

  updateGridSize() {
    if (this.currentGridSize === this.model.gridSize) {
      return;
    }

    this.currentGridSize = this.model.gridSize;

    this.totalCells = this.model.gridSize * this.model.gridSize;

    this.workgroupSize = Math.min(this.model.gridSize, 64);
    this.dispatchSize = Math.min(this.model.gridSize, 64);

    this.blockSize = Math.ceil(
      this.totalCells / this.workgroupSize / this.dispatchSize,
    );

    // Create GPUBuffer for input grid data
    this.gridBuffer = this.device.createBuffer({
      label: 'gridBuffer',
      size: this.model.grid.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    this.device.queue.writeBuffer(this.gridBuffer, 0, this.model.grid.buffer);

    // Create GPUBuffer for output data (agentIndices, agentIndicesLength)
    this.agentIndicesBuffer = this.device.createBuffer({
      label: 'agentIndicesBuffer',
      size: this.totalCells * Uint32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });
    this.agentIndicesTargetBuffer = this.device.createBuffer({
      label: 'agentIndicesTargetBuffer',
      size: this.totalCells * Uint32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });

    this.agentIndicesLengthBuffer = this.device.createBuffer({
      label: 'agentIndicesLengthBuffer',
      size:
        this.workgroupSize * this.dispatchSize * Uint32Array.BYTES_PER_ELEMENT,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
    });
    this.agentIndicesLengthTargetBuffer = this.device.createBuffer({
      label: 'agentIndicesLengthTargetBuffer',
      size:
        this.workgroupSize * this.dispatchSize * Uint32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    const computeShaderModule = this.createShaderModule();

    this.bindGroup = this.createBindGroup();

    // Set up compute pipeline
    this.computePipeline = this.device.createComputePipeline({
      label: 'pipeline',
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [this.bindGroupLayout],
      }),
      compute: {
        module: computeShaderModule,
        entryPoint: 'main',
      },
    });

    this.agentIndicesArray = new Uint32Array(this.totalCells);
    this.agentIndicesLengthArray = new Uint32Array(
      this.workgroupSize * this.dispatchSize,
    );
    this.emptyCellIndices = new Uint32Array(this.totalCells);
    this.movingAgentIndicesArray = new Uint32Array(this.totalCells);
    this.updateEmptyCellIndices();
  }

  private async copyBufferToArray(
    sourceBuffer: GPUBuffer,
    array: Uint32Array,
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
    await this.device.queue.onSubmittedWorkDone();
    array.set(new Uint32Array(targetBuffer.getMappedRange()));
    targetBuffer.unmap();
    if (!_targetBuffer) {
      targetBuffer.destroy();
    }
  }

  writeDataToBuffer() {
    this.updateGridSize();
    this.device.queue.writeBuffer(this.gridBuffer, 0, this.model.grid.buffer);
  }

  async execShader() {
    // Create command encoder and compute pass encoder
    const commandEncoder = this.device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(this.computePipeline);
    passEncoder.setBindGroup(0, this.bindGroup);
    passEncoder.dispatchWorkgroups(this.dispatchSize);
    passEncoder.end();
    this.device.queue.submit([commandEncoder.finish()]);
    await this.device.queue.onSubmittedWorkDone();
  }

  createShaderModule() {
    const [width, height] = [this.model.gridSize, this.model.gridSize];
    // Create the compute shader module (WGSL)
    const wgslCode = `
      const EMPTY_VALUE = ${EMPTY_VALUE};
      const width = ${width};
      const height = ${height};
      const workgroupSize = ${this.workgroupSize};
      const dispatchSize = ${this.dispatchSize};
      const blockWidth = ${Math.ceil(width / this.workgroupSize)};
      const blockHeight = ${Math.ceil(height / this.dispatchSize)};
      const blockSize = ${this.blockSize};
      const ghostZoneWidth = blockWidth + 2;

      @group(0) @binding(0) var<storage, read_write> agentIndices: array<u32>;
      @group(0) @binding(1) var<storage, read_write> agentIndicesLength: array<u32>;
      @group(0) @binding(2) var<storage, read> grid: array<u32>;
      @group(0) @binding(3) var<uniform> tolerance: f32;
      // @group(0) @binding(4) var<storage, read_write> debug: array<u32>;
      
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
      fn main(@builtin(workgroup_id) workgroup_id: vec3<u32>, @builtin(local_invocation_id) local_id: vec3<u32>) {
        let workgroupIndex = workgroup_id.x;
        let threadIndex = local_id.x;            
        let blockStartX = workgroupIndex * blockWidth;
        
        if(blockStartX < width){

          let blockStartY = threadIndex * blockHeight;
          let workItemIndex = workgroupIndex * workgroupSize + threadIndex;

          var rowCache: array<array<u32, ghostZoneWidth>, 3>;
          
          // Fill the initial rowCache (first 3 rows including ghost zones)

          let globalY = (blockStartY + height) % height;
          for (var localX = 0u; localX < ghostZoneWidth && blockStartX + localX <= width; localX++) {
            let globalX = (blockStartX + localX - 1u + width) % width;
            rowCache[0u][localX] = select(grid[(globalY - 1) * width + globalX], 
                                          grid[(height - 1) * width + globalX], 
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
              if (satisfactionRatio < tolerance) {
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
    `;
    return this.device.createShaderModule({
      code: wgslCode,
    });
  }

  private compactIndicesArray(
    movingAgentIndicesArray: Uint32Array,
    agentIndicesLengthArray: Uint32Array,
    agentIndicesArray: Uint32Array,
    blockSize: number,
  ): number {
    let movingAgentIndicesArrayLength = 0;
    for (
      let blockIndex = 0;
      blockIndex < agentIndicesLengthArray.length;
      blockIndex++
    ) {
      for (let i = 0; i < agentIndicesLengthArray[blockIndex]; i++) {
        movingAgentIndicesArray[movingAgentIndicesArrayLength] =
          agentIndicesArray[blockIndex * blockSize + i];
        movingAgentIndicesArrayLength++;
      }
    }
    return movingAgentIndicesArrayLength;
  }

  private moveAgentAndSwapEmptyCell(
    movingAgentIndices: Uint32Array,
    movingAgentIndicesLength: number,
    emptyCellIndices: Uint32Array,
    emptyCellIndicesLength: number,
    grid: Uint32Array,
    EMPTY_VALUE: number,
  ) {
    // Perform moving based on movingAgentIndices and emptyCellIndices
    const moveCount = Math.min(
      emptyCellIndicesLength,
      movingAgentIndicesLength,
    );

    // Perform moving based on movingAgentIndices and emptyCellIndices
    for (let i = 0; i < moveCount; i++) {
      const emptyIndex = emptyCellIndices[i];
      const agentIndex = movingAgentIndices[i];
      if (emptyIndex !== agentIndex) {
        grid[emptyIndex] = grid[agentIndex];
        grid[agentIndex] = EMPTY_VALUE;
        emptyCellIndices[i] = agentIndex;
      } else {
        throw new Error(`${i} ${emptyIndex} == ${agentIndex}`);
      }
    }
    return { grid, emptyCellIndices };
  }

  async updateGridData(): Promise<Uint32Array> {
    const queue = this.device.queue;

    this.toleranceArray[0] = this.model.tolerance;
    queue.writeBuffer(this.toleranceBuffer, 0, this.toleranceArray);
    queue.writeBuffer(this.gridBuffer, 0, this.model.grid.buffer);

    await this.execShader();

    await this.copyBufferToArray(
      this.agentIndicesBuffer,
      this.agentIndicesArray,
      this.agentIndicesTargetBuffer,
    );
    await this.copyBufferToArray(
      this.agentIndicesLengthBuffer,
      this.agentIndicesLengthArray,
      this.agentIndicesLengthTargetBuffer,
    );

    shuffleUint32Array(this.emptyCellIndices, this.emptyCellIndicesLength);

    if (this.model.mode === SchellingSegregationModes.WEBGPU) {
      this.movingAgentIndicesArrayLength = this.compactIndicesArray(
        this.movingAgentIndicesArray,
        this.agentIndicesLengthArray,
        this.agentIndicesArray,
        this.blockSize,
      );

      shuffleUint32Array(
        this.movingAgentIndicesArray,
        this.movingAgentIndicesArrayLength,
      );

      /*
      console.log(
        'oldGrid',
        this.model.grid.slice(0, this.model.gridSize * this.model.gridSize),
      );

      console.log(
        'empty',
        this.emptyCellIndices.slice(0, this.emptyCellIndicesLength),
      );

      console.log(
        'agent',
        this.agentIndicesArray,
        this.agentIndicesLengthArray,
      );

      console.log(
        'movingAgent',
        this.movingAgentIndicesArray.slice(
          0,
          this.movingAgentIndicesArrayLength,
        ),
      );
       */

      this.moveAgentAndSwapEmptyCell(
        this.movingAgentIndicesArray,
        this.movingAgentIndicesArrayLength,
        this.emptyCellIndices,
        this.emptyCellIndicesLength,
        this.model.grid,
        EMPTY_VALUE,
      );

      /*
      console.log(
        'empty',
        this.emptyCellIndices.slice(0, this.emptyCellIndicesLength),
      );
      console.log(
        'newGrid',
        this.model.grid.slice(0, this.model.gridSize * this.model.gridSize),
      );
       */
    } else {
      const compactIndicesArrayResult =
        SchellingSegregationKernelFunctions.compactIndicesArray(
          this.movingAgentIndicesArray,
          this.agentIndicesLengthArray,
          this.agentIndicesArray,
          this.blockSize,
        );
      this.movingAgentIndicesArray =
        compactIndicesArrayResult.movingAgentIndices;
      this.movingAgentIndicesArrayLength =
        compactIndicesArrayResult.movingAgentIndicesLength;

      // console.log(this.movingAgentIndicesArray);

      this.movingAgentIndicesArray =
        SchellingSegregationKernelFunctions.shuffleUint32Array(
          this.movingAgentIndicesArray,
          this.movingAgentIndicesArrayLength,
        );

      const moveAgentAndSwapEmptyCellResult =
        SchellingSegregationKernelFunctions.moveAgentAndSwapEmptyCell(
          this.movingAgentIndicesArray,
          this.movingAgentIndicesArrayLength,
          this.emptyCellIndices,
          this.emptyCellIndicesLength,
          this.model.grid,
          EMPTY_VALUE,
        );

      this.model.grid.set(moveAgentAndSwapEmptyCellResult.grid);
      this.emptyCellIndices.set(
        moveAgentAndSwapEmptyCellResult.emptyCellIndices,
      );
    }
    return this.model.grid;
  }
}
