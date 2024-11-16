const width: u32 = 0u;
const height: u32 = 0u;
const blockWidth: u32 = 64u;
const blockHeight: u32 = 64u;
const blockSize: u32 = 64u;
const mooreNeighborhoodRange: u32 = 1u;
const mooreNeighborhoodSize: u32 = 3u;
const workgroupSize: u32 = 64u;
const dispatchSize: u32 = 64u;
const blockWidthWithGhostZone = 66u;
const EMPTY_VALUE: u32 = 0u;

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

fn countSimilarNeighbor(
  rowCache: ptr<function, array<array<u32, blockWidthWithGhostZone>,3>>,
  localX: u32, localY: u32, agentType: u32) -> vec2u {
  let value = rowCache[localY][localX];
  return vec2u(select(0u, 1u, value == agentType), select(0u, 1u, value != EMPTY_VALUE));
}

fn countSimilarNeighbors(localX: u32, agentType: u32,
  rowCache: ptr<function, array<array<u32, blockWidthWithGhostZone>, 3>>,
  prev: u32, current: u32, next: u32) -> vec2u {
  return countSimilarNeighbor(rowCache, localX - 1u, prev, agentType) +
         countSimilarNeighbor(rowCache, localX,      prev, agentType) +
         countSimilarNeighbor(rowCache, localX + 1u, prev, agentType) +

         countSimilarNeighbor(rowCache, localX - 1u, current, agentType) +
         countSimilarNeighbor(rowCache, localX + 1u, current, agentType) +

         countSimilarNeighbor(rowCache, localX - 1u, next, agentType) +
         countSimilarNeighbor(rowCache, localX,      next, agentType) +
         countSimilarNeighbor(rowCache, localX + 1u, next, agentType);
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

  var rowCache: array<array<u32, blockWidthWithGhostZone>, 3>;

  let globalY = (blockStartY + height) % height;
  for (var localX = 0u; localX < blockWidthWithGhostZone /*&& blockStartX + localX <= width*/; localX++) {
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

    for (var localX = 0u; localX < blockWidthWithGhostZone /*&& blockStartX + localX <= width*/; localX++) {
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

      if (totalNeighbors == 0 || f32(similarCount) / f32(totalNeighbors) < params.tolerance) {
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