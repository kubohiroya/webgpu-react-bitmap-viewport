const width: u32 = 0u;
const height: u32 = 0u;
const blockWidth: u32 = 64u;
const blockHeight: u32 = 64u;
const blockSize: u32 = 64u;
const mooreNeighborhoodRange: u32 = 1u;
const mooreNeighborhoodSize: u32 = 3u;
const blockWidthWithGhostZone: u32 = 10u;
const workgroupSize: u32 = 64u;
const dispatchSize: u32 = 64u;
const EMPTY_VALUE: u32 = 0u;

struct Params {
  tolerance: f32,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> random: array<f32>;
@group(0) @binding(2) var grid: texture_storage_1d<r8uint, read_write>;
@group(0) @binding(3) var<storage, read> emptyCellIndices: array<u32>;
@group(0) @binding(4) var<storage, read_write> agentIndices: array<u32>;
@group(0) @binding(5) var<storage, read_write> agentIndicesLength: array<u32>;
@group(0) @binding(6) var<storage, read_write> movingAgentIndices: array<u32>;

fn countSimilarNeighbor(
  rowCache: ptr<function, array<array<u32, blockWidthWithGhostZone>, mooreNeighborhoodSize>>,
  localX: u32, localY: u32, agentType: u32) -> vec2u {
  let value = rowCache[localY % mooreNeighborhoodSize][localX];
  return vec2u(select(0u, 1u, value == agentType), select(0u, 1u, value != EMPTY_VALUE));
}

fn countSimilarNeighbors(
  rowCache: ptr<function, array<array<u32, blockWidthWithGhostZone>, mooreNeighborhoodSize>>,
  localX: u32, localY: u32, agentType: u32) -> vec2u {
  if (mooreNeighborhoodSize == 3u) {
    return countSimilarNeighbor(rowCache, localX, localY, agentType) +
    countSimilarNeighbor(rowCache, localX + 1u, localY, agentType) +
    countSimilarNeighbor(rowCache, localX + 2u, localY, agentType) +
    countSimilarNeighbor(rowCache, localX, localY + 1u, agentType) +
    countSimilarNeighbor(rowCache, localX + 2u, localY + 1u, agentType) +
    countSimilarNeighbor(rowCache, localX, localY + 2u, agentType) +
    countSimilarNeighbor(rowCache, localX + 1u, localY + 2u, agentType) +
    countSimilarNeighbor(rowCache, localX + 2u, localY + 2u, agentType);
  } else if(mooreNeighborhoodSize == 5u) {
    return countSimilarNeighbor(rowCache, localX, localY, agentType) +
    countSimilarNeighbor(rowCache, localX + 1u, localY, agentType) +
    countSimilarNeighbor(rowCache, localX + 2u, localY, agentType) +
    countSimilarNeighbor(rowCache, localX + 3u, localY, agentType) +
    countSimilarNeighbor(rowCache, localX + 4u, localY, agentType) +
    countSimilarNeighbor(rowCache, localX, localY + 1u, agentType) +
    countSimilarNeighbor(rowCache, localX + 1u, localY + 1u, agentType) +
    countSimilarNeighbor(rowCache, localX + 2u, localY + 1u, agentType) +
    countSimilarNeighbor(rowCache, localX + 3u, localY + 1u, agentType) +
    countSimilarNeighbor(rowCache, localX + 4u, localY + 1u, agentType) +
    countSimilarNeighbor(rowCache, localX, localY + 2u, agentType) +
    countSimilarNeighbor(rowCache, localX + 1u, localY + 2u, agentType) +
    countSimilarNeighbor(rowCache, localX + 3u, localY + 2u, agentType) +
    countSimilarNeighbor(rowCache, localX + 4u, localY + 2u, agentType) +
    countSimilarNeighbor(rowCache, localX, localY + 3u, agentType) +
    countSimilarNeighbor(rowCache, localX + 1u, localY + 3u, agentType) +
    countSimilarNeighbor(rowCache, localX + 2u, localY + 3u, agentType) +
    countSimilarNeighbor(rowCache, localX + 3u, localY + 3u, agentType) +
    countSimilarNeighbor(rowCache, localX + 4u, localY + 3u, agentType) +
    countSimilarNeighbor(rowCache, localX, localY + 4u, agentType) +
    countSimilarNeighbor(rowCache, localX + 1u, localY + 4u, agentType) +
    countSimilarNeighbor(rowCache, localX + 2u, localY + 4u, agentType) +
    countSimilarNeighbor(rowCache, localX + 3u, localY + 4u, agentType) +
    countSimilarNeighbor(rowCache, localX + 4u, localY + 4u, agentType);
  } else {
    var result = vec2u(0u, 0u);
    for(var y = 0u; y < mooreNeighborhoodRange; y++){
      for(var x = 0u; x < mooreNeighborhoodRange; x++){
        result += countSimilarNeighbor(rowCache, localX + x, localY + y, agentType) +
                  countSimilarNeighbor(rowCache, localX + mooreNeighborhoodSize - 1 - x, localY + y, agentType) +
                  countSimilarNeighbor(rowCache, localX + x, localY + mooreNeighborhoodSize - 1 - y, agentType) +
                  countSimilarNeighbor(rowCache, localX + mooreNeighborhoodSize - 1 - x, localY + mooreNeighborhoodSize - 1 - y, agentType);
      }
      result += countSimilarNeighbor(rowCache, localX + mooreNeighborhoodRange, localY + y, agentType) +
               countSimilarNeighbor(rowCache, localX + mooreNeighborhoodRange, localY + mooreNeighborhoodSize - 1 - y, agentType) +
               countSimilarNeighbor(rowCache, localX + y, localY + mooreNeighborhoodRange, agentType) +
               countSimilarNeighbor(rowCache, localX + mooreNeighborhoodSize - 1 - y, localY + mooreNeighborhoodRange, agentType);
    }
    return result;
  }
}

@compute @workgroup_size(workgroupSize)
fn main0(@builtin(workgroup_id) workgroup_id: vec3<u32>, @builtin(local_invocation_id) local_id: vec3<u32>) {
// CREATE AGENT IDICES ARRAY
    let workgroupIndex = workgroup_id.x;
    let threadIndex = local_id.x;
    let blockStartY = workgroupIndex * blockHeight;

    if(blockStartY < height){

      let blockStartX = threadIndex * blockWidth;
      let workItemIndex = workgroupIndex * dispatchSize + threadIndex;
      var rowCache: array<array<u32, blockWidthWithGhostZone>, mooreNeighborhoodSize>;

      for(var localY = 0u; localY < mooreNeighborhoodSize - 1u; localY++) {
        let y = (blockStartY + localY + height - mooreNeighborhoodRange) % height;
        for (var localX = 0u; localX < blockWidthWithGhostZone; localX++) {
          let x = (blockStartX + localX + width - mooreNeighborhoodRange) % width;
          rowCache[localY][localX] = grid[y * width + x];
        }
      }
      let agentIndexBase = workItemIndex * blockSize;
      var agentCounter = 0u;

      for(var localY = 0u; localY < blockHeight && blockStartY + localY < height; localY++){
        let y = (blockStartY + localY + height) % height;
        let nextY = (blockStartY + localY + height + mooreNeighborhoodRange) % height;

        let lastRowY = (localY + mooreNeighborhoodSize - 1u) % mooreNeighborhoodSize;
        for (var localX = 0u; localX < blockWidthWithGhostZone; localX++) {
          let x = (blockStartX + localX + width - mooreNeighborhoodRange) % width;
          rowCache[lastRowY][localX] = grid[nextY * width + x];
        }

        let firstRowY = localY % mooreNeighborhoodSize;
        let centerRowY = (localY + mooreNeighborhoodRange) % mooreNeighborhoodSize;

        for (var localX = 0u; localX < blockWidth && blockStartX + localX < width; localX++){
          let centerColX = localX + mooreNeighborhoodRange;
          let agentType = rowCache[centerRowY][centerColX];
          if (agentType == EMPTY_VALUE) {
            continue;
          }

          let neighbors = countSimilarNeighbors(
            &rowCache,
            localX, firstRowY,
            agentType);
          let similarCount = neighbors.x;
          let totalNeighbors = neighbors.y;

          if (totalNeighbors == 0u || f32(similarCount) / f32(totalNeighbors) < params.tolerance) {
            // Write the unsatisfied agent's original index
            let x = blockStartX + localX;
            agentIndices[agentIndexBase + agentCounter] = y * width + x;
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
