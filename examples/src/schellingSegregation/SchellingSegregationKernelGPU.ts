import { EMPTY_VALUE } from 'webgpu-react-bitmap-viewport';
import { SchellingSegregationModel } from './SchellingSegregationModel';
import { SchellingSegregationKernel } from './SchellingSegregationKernel';
import { shuffle } from './arrayUtils';

// TypeScript: WebGPU Implementation for Schelling's Segregation Model
export class SchellingSegregationKernelGPU extends SchellingSegregationKernel {
  private device: GPUDevice;
  private toleranceBuffer: GPUBuffer;
  private bindGroupLayout: GPUBindGroupLayout;
  private computePipeline!: GPUComputePipeline;

  private emptyCellIndices: number[] = [];
  private toleranceArray = new Float32Array(1);
  private initialAgentIndicesLengthArray!: Uint32Array;

  private workgroupSize: number = 64;

  private workgroupTargetCells: number = 0;
  private workgroupTargetRows: number = 0;
  private totalCells: number = 0;

  private currentGridSize: number = -1;

  private gridBuffer!: GPUBuffer;
  private agentIndicesBuffer!: GPUBuffer;
  private agentIndicesLengthBuffer!: GPUBuffer;
  private bindGroup!: GPUBindGroup;

  updateEmptyCellIndices() {
    const emptyCellIndices = [];
    for (let i = 0; i < this.totalCells; i++) {
      if (this.model.grid[i] === EMPTY_VALUE) {
        emptyCellIndices.push(i);
      }
    }
    this.emptyCellIndices = emptyCellIndices;
  }

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
    this.bindGroupLayout = this.device.createBindGroupLayout({
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

    this.updateGridSize();
  }

  updateGridSize() {
    if (this.currentGridSize === this.model.gridSize) {
      return;
    }

    this.currentGridSize = this.model.gridSize;

    this.totalCells = this.model.gridSize * this.model.gridSize;

    this.workgroupSize = Math.min(this.model.gridSize, 64);
    this.initialAgentIndicesLengthArray = new Uint32Array(this.workgroupSize);

    // const maxComputeWorkgroupStorageSize = 16384;
    // Math.ceil(this.totalCells / (256 * Uint32Array.BYTES_PER_ELEMENT));

    this.workgroupTargetCells = Math.ceil(this.totalCells / this.workgroupSize);
    this.workgroupTargetRows = Math.ceil(
      this.workgroupTargetCells / this.model.gridSize,
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

    this.agentIndicesLengthBuffer = this.device.createBuffer({
      label: 'agentIndicesLengthBuffer',
      size: this.workgroupSize * Uint32Array.BYTES_PER_ELEMENT,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
    });

    const [width, height] = [this.model.gridSize, this.model.gridSize];

    // Create the compute shader module (WGSL)
    const wgslCode = `
        const workgroupSize = ${this.workgroupSize};
        const EMPTY_VALUE = ${EMPTY_VALUE};
        const width = ${width};
        const height = ${height};
        const workgroupTargetCells = ${this.workgroupTargetCells};
        const workgroupCachingCells = ${this.workgroupTargetCells + width * 2};
        const workgroupTargetRows = ${this.workgroupTargetRows};
        
        @group(0) @binding(0) var<storage, read_write> agentIndices: array<u32>;
        @group(0) @binding(1) var<storage, read_write> agentIndicesLength: array<u32>;
        @group(0) @binding(2) var<storage, read> grid: array<u32>;
        @group(0) @binding(3) var<uniform> tolerance: f32;

        var<workgroup> workgroupGrid: array<u32, workgroupCachingCells>;
        var<workgroup> workgroupAgentIndices: array<u32, workgroupTargetCells>;
        var<workgroup> workgroupAgentIndicesLength: array<u32, workgroupTargetRows>;

        fn getIndex(x: i32, y: i32) -> u32 {
          return u32(y) * width + u32(x);
        }
        
        fn getCell(x: i32, y: i32) -> u32 {
          return workgroupGrid[getIndex(x, y)];
        }
        
        fn countSimilarNeighbor(x: i32, y: i32, agentType: u32) -> vec2u {
          let cell = getCell((x + width) % width, (y + height) % height);
          return vec2u(select(0u, 1u, cell == agentType), select(0u, 1u, cell != EMPTY_VALUE));
        }
        
        fn countSimilarNeighbors(x: i32, y: i32, agentType: u32) -> vec2u {
            return countSimilarNeighbor(x - 1, y - 1, agentType) +
                   countSimilarNeighbor(x,    y - 1, agentType) +
                   countSimilarNeighbor(x + 1, y - 1, agentType) +
        
                   countSimilarNeighbor(x - 1, y, agentType) +
                   countSimilarNeighbor(x + 1, y, agentType) +
        
                   countSimilarNeighbor(x - 1, y + 1, agentType) +
                   countSimilarNeighbor(x,    y + 1, agentType) +
                   countSimilarNeighbor(x + 1, y + 1, agentType);
        }

        @compute @workgroup_size(workgroupTargetRows)
        fn main(@builtin(workgroup_id) workgroup_id: vec3<u32>, @builtin(local_invocation_id) local_id: vec3<u32>) {
            let workgroupIndex = workgroup_id.x;
            let threadIndex = local_id.x;            

            if (threadIndex == 0u) {
                // Initialize workgroup data and copy grid to workgroup memory
                /*
                for (var i = 0u; i < workgroupTargetCells; i++) {
                    workgroupAgentIndices[i] = 0u;
                }
                for (var i = 0u; i < workgroupTargetRows; i++) {
                    workgroupAgentIndicesLength[i] = 0u;
                }
                */
                let startRow = workgroupIndex * workgroupTargetRows;
                let endRow = min(startRow + workgroupTargetRows - 1u, height - 1u);

                // Handle ghost zones
                let previousRow = select((startRow - 1u), (height - 1u), startRow == 0u);
                let nextRow = select((endRow + 1u), 0u, endRow == (height - 1u));

                // Copy previous row to ghost zone (0th row in workgroupGrid)
                for (var col = 0u; col < width; col++) {
                    workgroupGrid[col] = grid[previousRow * width + col];
                }

                // Copy the block rows
                for (var row = startRow; row <= endRow; row++) {
                    for (var col = 0u; col < width; col++) {
                        let workgroupTargetRowIndex = (row - startRow + 1u) * width + col;
                        workgroupGrid[workgroupTargetRowIndex] = grid[row * width + col];
                    }
                }

                // Copy next row to ghost zone (last row in workgroupGrid)
                for (var col = 0u; col < width; col++) {
                    let ghostZoneIndex = workgroupTargetRows * width + width + col;
                    workgroupGrid[ghostZoneIndex] = grid[nextRow * width + col];
                }                 
            }

            workgroupBarrier();
            
            let globalY = workgroupIndex * workgroupTargetRows + threadIndex;
            let localY = threadIndex;
            
            if(globalY < height) {
              for(var x = 0u; x < width; x++){
                // Each work item processes its portion of workgroupGrid, excluding ghost zones
                // Determine the row and column of the current cell
                let localGridY = localY + 1u; // Adding 1 to skip the ghost zone
    
                let currentAgent = workgroupGrid[localGridY * width + x];
    
                if (currentAgent == EMPTY_VALUE) {
                    continue;
                }
    
                let neighbors = countSimilarNeighbors(i32(x), i32(localGridY), currentAgent);
                let similarCount = neighbors.x;
                let totalNeighbors = neighbors.y;
                let satisfactionRatio = f32(similarCount) / f32(totalNeighbors);
                if (satisfactionRatio < tolerance) {
                    // Write the unsatisfied agent's original index to workgroupAgentIndices
                    let globalIndex = globalY * width + x;
                    let writeIndex = workgroupAgentIndicesLength[localY];
                    workgroupAgentIndices[localY * width + writeIndex] = globalIndex;
                    workgroupAgentIndicesLength[localY] += 1u;
                }
              }
            }
            
            workgroupBarrier();
            
            if (threadIndex == 0u) {
              // Aggregate results and copy to global memory (agentIndices and agentIndicesLength)
              let globalBaseIndex = workgroupIndex * workgroupTargetRows * width;
              let globalBaseY = workgroupIndex * workgroupTargetRows;
              
              var globalWriteIndex: u32 = 0u;
              var totalUnsatisfied: u32 = 0u;
  
              for (var localY = 0u; localY < workgroupTargetRows && globalBaseY + localY < height; localY++) {
                  let localUnsatisfiedCount = workgroupAgentIndicesLength[localY];
                  for (var i = 0u; i < localUnsatisfiedCount; i++) {
                      let localIndex = localY * width + i;
                      agentIndices[globalBaseIndex + localY * width + globalWriteIndex] = workgroupAgentIndices[localIndex];
                      globalWriteIndex++;                    
                  }
                  totalUnsatisfied += localUnsatisfiedCount;
              }
  
              // Write the total number of unsatisfied agents for this workgroup
              if(workgroupTargetRows <= height && workgroupIndex < workgroupSize) {
                agentIndicesLength[workgroupIndex] = totalUnsatisfied;
              }
           }
        }
    `;

    const computeShaderModule = this.device.createShaderModule({
      code: wgslCode,
    });

    this.bindGroup = this.device.createBindGroup({
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
  }

  private async copyBufferToArray(sourceBuffer: GPUBuffer, array: Uint32Array) {
    const targetBuffer: GPUBuffer = this.device.createBuffer({
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
    targetBuffer.destroy();
  }

  writeDataToBuffer() {
    this.updateGridSize();
    this.device.queue.writeBuffer(this.gridBuffer, 0, this.model.grid.buffer);
  }

  async execShader() {
    // Create command encoder and compute pass encoder
    const commandEncoder = this.device.createCommandEncoder({
      label: 'encoder',
    });

    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(this.computePipeline);
    passEncoder.setBindGroup(0, this.bindGroup);
    passEncoder.dispatchWorkgroups(64);
    passEncoder.end();
    this.device.queue.submit([commandEncoder.finish()]);
    await this.device.queue.onSubmittedWorkDone();
  }

  async updateGridData(): Promise<Uint32Array> {
    const queue = this.device.queue;
    const grid = this.model.grid;

    this.updateEmptyCellIndices();

    this.toleranceArray[0] = this.model.tolerance;
    queue.writeBuffer(this.toleranceBuffer, 0, this.toleranceArray);
    queue.writeBuffer(this.gridBuffer, 0, grid.buffer);

    queue.writeBuffer(
      this.agentIndicesLengthBuffer,
      0,
      this.initialAgentIndicesLengthArray,
    );

    await this.execShader();

    const agentIndicesArray = new Uint32Array(this.totalCells);
    await this.copyBufferToArray(this.agentIndicesBuffer, agentIndicesArray);

    const agentIndicesLengthArray = new Uint32Array(this.workgroupSize);
    await this.copyBufferToArray(
      this.agentIndicesLengthBuffer,
      agentIndicesLengthArray,
    );

    const movingAgentIndices = [];
    for (let i = 0; i < agentIndicesLengthArray.length; i++) {
      if (agentIndicesLengthArray[i] > 0) {
        movingAgentIndices.push(
          ...agentIndicesArray.slice(
            i * this.workgroupTargetRows,
            i * this.workgroupSize + agentIndicesLengthArray[i],
          ),
        );
      }
    }

    // Create movingAgentIndices by shuffling agentIndices
    shuffle(this.emptyCellIndices);
    shuffle(movingAgentIndices);

    // Perform moving based on movingAgentIndices and emptyCellIndices
    const moveCount = Math.min(
      this.emptyCellIndices.length,
      movingAgentIndices.length,
    );

    // Perform moving based on movingAgentIndices and emptyCellIndices
    for (let i = 0; i < moveCount; i++) {
      const emptyIndex = this.emptyCellIndices[i];
      const agentIndex = movingAgentIndices[i];
      grid[emptyIndex] = grid[agentIndex];
      grid[agentIndex] = EMPTY_VALUE;
      this.emptyCellIndices[i] = agentIndex;
    }

    return grid;
  }
}

/*
// Example usage
(async () => {
  const gridSize = 1024;
  const emptyRatio = 0.1;
  const agentRatios = [0.45, 0.45]; // Example: 2 types of agents, each 45%
  const workgroupSize = 64;
  const workitemSize = 64;
  const tolerance = 0.3;

  const device = await (await navigator.gpu.requestAdapter())?.requestDevice();
  if (device) {
    const model = new SchellingSegregationModel({
      gridSize,
      agentTypeShares: agentRatios,
      tolerance,
    });
    const segregation = new SchellingSegregationKernelGPU(model, device);
    await segregation.init(workgroupSize, workitemSize);
    const result = await segregation.updateGridData();
    console.log(result);
  }
})();
 */
