override EMPTY_VALUE: u32 = 99999u;

const VERTICAL_MODE: u32 = 0u;
const HORIZONTAL_MODE: u32 = 1u;

override WIDTH: u32 = 32;
override HEIGHT: u32 = 32;
override height: i32 = 32;
override width: i32 = 32;

const WORKGROUP_SIZE: u32 = 64; // ワークグループの総数(並列度) 通常は64
const SEGMENTS_PER_GROUP: u32 = 4; // 1つのワークグループが処理するセグメントの数、通常は4

const SEGMENT_SIZE: u32 = 256; // マトリクス全体を処理単位である「セグメント」に分割した場合の、セグメントの総数, 通常は16x16=256

const CELLS_PER_SEGMENT: u32 = 4; // WIDTH * HEIGHT / SEGMENT_SIZE; // 1つのセグメント内のセルの数
const CELLS_PER_GROUP: u32 = 4; // CELLS_PER_SEGMENT * SEGMENTS_PER_GROUP; // 1つのワークグループが処理するセルの数

struct Params {
    mode: u32,
    tolerance: f32,
};

// シミュレーションパラメータ
@group(0) @binding(6) var<uniform> params: Params;
// 2次元グリッドのエージェント情報
@group(0) @binding(7) var<storage, read_write> grid: array<u32>;
// ランダムテーブル (乱数値を0から1の範囲で格納した配列)
@group(0) @binding(8) var<storage, read> randomTable: array<f32>;
// 各ワークグループが処理するセグメントのインデックス (シャッフルされた配列)
@group(0) @binding(9) var<storage, read> randomSegmentIndices: array<u32>;

// @group(0) @binding(10) var<storage, read_write> debug: array<u32>;

fn shuffle(startIndex: u32, length: u32, cellIndices: ptr<function, array<u32, CELLS_PER_GROUP>>) {
    for (var i = 0u; i < length; i++) {
        //let j = randomChoice(startIndex + i, length);
        let j = u32(floor(randomTable[startIndex + i] * f32(length)));
        let value = (*cellIndices)[startIndex + i];
        (*cellIndices)[startIndex + i] = (*cellIndices)[startIndex + j];
        (*cellIndices)[startIndex + j] = value;
    }
}

fn getIndex(x: i32, y: i32) -> u32 {
  return u32(y) * WIDTH + u32(x);
}

fn getCell(x: i32, y: i32) -> u32 {
  return grid[getIndex(x, y)];
}

fn countSimilarNeighbor(x: i32, y: i32, agentType: u32) -> vec2u {
  let cell = getCell((x + width) % width, (y + height) % height);
  return vec2u(select(0u, 1u, cell == agentType), select(0u, 1u, cell != EMPTY_VALUE));
}

fn randomChoice(index: u32, size: u32) -> u32 {
    return u32(floor(randomTable[index] * f32(size)));
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

// 指定されたセグメント内の空き地情報・移動予定エージェントを更新する関数

fn updateCellIndices(workGroupSegmentIndex: u32, segmentIndex: u32,
    cellIndices: ptr<function, array<u32, CELLS_PER_GROUP>>,
    movingAgentsCounter: ptr<function, array<u32, SEGMENTS_PER_GROUP>>,
    emptyCellsCounter: ptr<function, array<u32, SEGMENTS_PER_GROUP>>) {

    var emptyCellsCount: u32 = 0u;
    var movingAgentsCount: u32 = 0u;

    let agentIndexBase = segmentIndex * CELLS_PER_SEGMENT;
    for (var agentIndex = agentIndexBase; agentIndex < agentIndexBase + CELLS_PER_SEGMENT /* && agentIndex < cellSize*/; agentIndex++) {
        let x = agentIndex % HEIGHT;
        let y = agentIndex / HEIGHT;
        let cellIndex = select(agentIndex, y + x * WIDTH, params.mode == VERTICAL_MODE);
        let agent = grid[cellIndex];
        if (agent == EMPTY_VALUE) {
            (*cellIndices)[workGroupSegmentIndex * SEGMENT_SIZE + emptyCellsCount] = agentIndex;
            emptyCellsCount++;
        }else{
            let neighbors = countSimilarNeighbors(i32(x), i32(y), agent);
            let similarCount = neighbors.x;
            let neighborCount = neighbors.y;
            if (neighborCount > 0u && f32(similarCount) / f32(neighborCount) < params.tolerance) {
                (*cellIndices)[workGroupSegmentIndex * SEGMENT_SIZE + SEGMENT_SIZE - movingAgentsCount - 1] = agentIndex;
                movingAgentsCount++;
            }
        }
    }

    (*emptyCellsCounter)[workGroupSegmentIndex] = emptyCellsCount;
    (*movingAgentsCounter)[workGroupSegmentIndex] = movingAgentsCount;

    shuffle(workGroupSegmentIndex * SEGMENT_SIZE, emptyCellsCount, cellIndices);
    shuffle(workGroupSegmentIndex * SEGMENT_SIZE + SEGMENT_SIZE - movingAgentsCount - 1, movingAgentsCount, cellIndices);
}

fn getEmptyCellObject(targetIndex: u32,
   workgroupSegmentIndices: ptr<function, array<u32, 4>>,
   emptyCellsCounter: ptr<function, array<u32, SEGMENTS_PER_GROUP>>) -> vec2u {
    var accumulatedEmptyCells: u32 = 0;
    for (var workgroupSegmentIndex = 0u; workgroupSegmentIndex < SEGMENTS_PER_GROUP; workgroupSegmentIndex++) {
        let emptyCellsCount = (*emptyCellsCounter)[workgroupSegmentIndex];
        if (targetIndex < accumulatedEmptyCells + emptyCellsCount) {
            return vec2u(
                targetIndex - accumulatedEmptyCells,
                (*workgroupSegmentIndices)[workgroupSegmentIndex]
            );
        }
        accumulatedEmptyCells += emptyCellsCount;
    }
    return vec2u(0, 0); // ここには到達しない
}

fn moveAgentsInSegment(
   workgroupSegmentIndex: u32,
   workgroupSegmentIndices: ptr<function, array<u32,4>>,
   totalEmptyCells: f32,
   cellIndices: ptr<function, array<u32, CELLS_PER_GROUP>>,
   movingAgentsCounter: ptr<function, array<u32, SEGMENTS_PER_GROUP>>,
   emptyCellsCounter: ptr<function, array<u32, SEGMENTS_PER_GROUP>>) {
    let movingAgentsCount = (*movingAgentsCounter)[workgroupSegmentIndex];
    // debug[0] = movingAgentsCount + 1;

    for (var i = 0u; i < movingAgentsCount; i++) {

        let agentPointer = workgroupSegmentIndex * SEGMENT_SIZE + SEGMENT_SIZE - i - 1u;
        let movingAgentIndex = (*cellIndices)[agentPointer];
        let agent = grid[movingAgentIndex];

        let randomValueAsAccumulatedIndex = u32(floor(randomTable[movingAgentIndex] * totalEmptyCells));

        // どのセグメントに該当するかを決定
        let emptyCellObject = getEmptyCellObject(randomValueAsAccumulatedIndex, workgroupSegmentIndices, emptyCellsCounter);
        let emptyCellIndexInSegment = emptyCellObject[0];
        let emptyCellSegmentIndex = emptyCellObject[1];
        let emptyCellPointer = emptyCellSegmentIndex * SEGMENT_SIZE + (*emptyCellsCounter)[emptyCellSegmentIndex] - 1u - emptyCellIndexInSegment;
        let emptyCellIndex = (*cellIndices)[emptyCellPointer];

        // 選択されたセグメント内の空き地インデックスを取得
        if(grid[emptyCellIndex] == EMPTY_VALUE){
            // 引越しを実行
            grid[emptyCellIndex] = agent;
            grid[movingAgentIndex] = EMPTY_VALUE;
            (*emptyCellsCounter)[emptyCellSegmentIndex]--;
            (*emptyCellsCounter)[workgroupSegmentIndex]++;
        }
    }
}

fn clear(){
    for(var y = 0u; y < HEIGHT; y++){
          for(var x = 0u; x < WIDTH; x++){
                grid[x + y * WIDTH] = EMPTY_VALUE;
          }
    }
}

@compute @workgroup_size(WORKGROUP_SIZE)
fn main(@builtin(workgroup_id) workgroup_id: vec3<u32>) {
    let workgroupIndex = workgroup_id.x;

    var cellIndices: array<u32, CELLS_PER_GROUP>;
    var emptyCellsCounter: array<u32, SEGMENTS_PER_GROUP>;
    var movingAgentsCounter: array<u32, SEGMENTS_PER_GROUP>;
    var workgroupSegmentIndices: array<u32, 4>;//SEGMENTS_PER_GROUP

    if(256u < WIDTH * HEIGHT){
        // ワークグループに対応する 4 つのセグメントインデックスを取得
        workgroupSegmentIndices[0] = randomSegmentIndices[workgroupIndex * SEGMENTS_PER_GROUP];
        workgroupSegmentIndices[1] = randomSegmentIndices[workgroupIndex * SEGMENTS_PER_GROUP + 1u];
        workgroupSegmentIndices[2] = randomSegmentIndices[workgroupIndex * SEGMENTS_PER_GROUP + 2u];
        workgroupSegmentIndices[3] = randomSegmentIndices[workgroupIndex * SEGMENTS_PER_GROUP + 3u];

        for(var i = 0u; i < SEGMENTS_PER_GROUP; i++){
            updateCellIndices(i, workgroupSegmentIndices[i], &cellIndices, &movingAgentsCounter, &emptyCellsCounter);
        }

        workgroupBarrier();
        // storageBarrier();

        var totalEmptyCells = 0.0;
        for(var i = 0u; i < SEGMENTS_PER_GROUP; i++){
          totalEmptyCells += f32(emptyCellsCounter[i]);
        }

        for(var i = 0u; i < SEGMENTS_PER_GROUP; i++){
            moveAgentsInSegment(i, &workgroupSegmentIndices, totalEmptyCells, &cellIndices, &movingAgentsCounter, &emptyCellsCounter);
        }

    }else if(workgroupIndex == 0){
        updateCellIndices(0, 0, &cellIndices, &movingAgentsCounter, &emptyCellsCounter);
        let totalEmptyCells = f32(emptyCellsCounter[0]);
        workgroupSegmentIndices[0] = 0;
        moveAgentsInSegment(0, &workgroupSegmentIndices, totalEmptyCells, &cellIndices, &movingAgentsCounter, &emptyCellsCounter);
    }

/*
    for(var i = 0u; i < CELLS_PER_GROUP; i++){
        debug[i] = cellIndices[i];
    }
*/

}
