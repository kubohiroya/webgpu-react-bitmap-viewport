override EMPTY_VALUE: u32 = 99999u;
override NUM_SEGMENTS: u32 = 256;
override SEGMENTS_PER_GROUP: u32 = 4;

struct Params {
    width: u32,
    height: u32,
    tolerance: f32
};

// 2次元グリッドのエージェント情報
@group(0) @binding(6) var<storage, read_write> grid: array<u32>;

// シミュレーションパラメータ
@group(0) @binding(7) var<uniform> params: Params;

// 各ワークグループが処理するセグメントのインデックス (シャッフルされた配列)
@group(0) @binding(8) var<storage, read> randomSegmentIndices: array<u32>;

// セグメントごとの空き地のインデックス管理
@group(0) @binding(9) var<storage, read_write> emptyCellIndices: array<u32>;

// セグメントごとの空き地の個数管理
@group(0) @binding(10) var<storage, read_write> numEmptyCellsPerSegment: array<u32>;

// ランダムテーブル (乱数値を0から1の範囲で格納した配列)
@group(0) @binding(11) var<storage, read> randomTable: array<f32>;

// セグメント内の空き地の最大数を取得
fn get_max_empty_cells_per_segment() -> u32 {
    return u32(ceil(f32(arrayLength(&grid.values)) / f32(NUM_SEGMENTS)));
}

// セグメント内の空き地情報を更新する関数
fn update_empty_cells(segmentIndex: u32) {
    let segmentWidth: u32 = params.width / 16;
    let segmentHeight: u32 = params.height / 16;
    let maxEmptyCells = get_max_empty_cells_per_segment();

    let startX = (segmentIndex % 16) * segmentWidth;
    let startY = (segmentIndex / 16) * segmentHeight;
    let endX = startX + segmentWidth;
    let endY = startY + segmentHeight;

    var emptyCellCount: u32 = 0;
    let baseIndex = segmentIndex * maxEmptyCells;

    for (var y = startY; y < endY; y = y + 1) {
        for (var x = startX; x < endX; x = x + 1) {
            let index = y * params.width + x;
            if (grid[index] == EMPTY_VALUE) { // 空き地なら
                if (emptyCellCount < maxEmptyCells) {
                    emptyCellIndices[baseIndex + emptyCellCount] = index;
                    emptyCellCount = emptyCellCount + 1;
                }
            }
        }
    }

    numEmptyCellsPerSegment[segmentIndex] = emptyCellCount;
}

fn getIndex(x: u32, y: u32, width: u32) -> u32 {
  return y * width + x;
}

fn getCell(x: u32, y: u32) -> u32 {
  return grid.values[getIndex(x, y, params.width)];
}

fn countSimilarNeighbor(x: i32, y: i32, width: i32, height: i32, agentType: u32) -> vec2u {
  let cell = getCell(u32((x + width) % width), u32((y + height) % height));
  return vec2u(select(0u, 1u, cell == agentType), select(0u, 1u, cell != EMPTY_VALUE));
}

fn randomChoice(size: u32, step: u32) -> u32 {
    return u32(floor(randomTable[step] * f32(size)));
}

fn countSimilarNeighbors(x: i32, y: i32, width: i32, height: i32, agentType: u32) -> vec2u {
    return countSimilarNeighbor(x - 1, y - 1, width, height, agentType) +
              countSimilarNeighbor(x, y - 1, width, height, agentType) +
              countSimilarNeighbor(x + 1, y - 1, width, height, agentType) +
              countSimilarNeighbor(x - 1, y, width, height, agentType) +
              countSimilarNeighbor(x + 1, y, width, height, agentType) +
              countSimilarNeighbor(x - 1, y + 1, width, height, agentType) +
              countSimilarNeighbor(x, y + 1, width, height, agentType) +
              countSimilarNeighbor(x + 1, y + 1, width, height, agentType);
}

// セグメントのエージェントの引越しを行う関数
fn move_agents_in_segments(segmentIndices: array<u32, SEGMENTS_PER_GROUP>, randomBaseIndex: u32) {
    let maxEmptyCells = get_max_empty_cells_per_segment();

    // 各セグメントのエージェントの移動を判定
    for (var i = 0u; i < SEGMENTS_PER_GROUP; i = i + 1u) {
        let segmentIndex = segmentIndices[i];
        let segmentWidth: u32 = params.width / 16;
        let segmentHeight: u32 = params.height / 16;

        let startX = (segmentIndex % 16) * segmentWidth;
        let startY = (segmentIndex / 16) * segmentHeight;
        let endX = startX + segmentWidth;
        let endY = startY + segmentHeight;
        let width = i32(params.width);
        let height = i32(params.height);

        for (var y = startY; y < endY; y ++) {
            for (var x = startX; x < endX; x++) {
                let index = y * params.width + x;
                let agent = grid[index];

                if (agent == EMPTY_VALUE) {
                    continue;
                }

                let neighbors = countSimilarNeighbors(i32(x), i32(y), width, height, agent);
                let similarCount = neighbors.x;
                let neighborCount = neighbors.y;
                if (neighborCount > 0u && f32(similarCount) / f32(neighborCount) < params.tolerance) {
                    let totalEmptyCells = numEmptyCellsPerSegment[segmentIndex];
                    if (totalEmptyCells > 0u) {
                        // ランダムテーブルから乱数を取得して引越し先を選択
                        let randomValue = randomTable[randomBaseIndex + index];
                        let randomIdx = u32(floor(randomValue * f32(totalEmptyCells)));
                        let emptyCellIndex = emptyCellIndices[segmentIndex * maxEmptyCells + randomIdx];

                        // 引越しを実行
                        grid[emptyCellIndex] = agent;
                        grid[index] = EMPTY_VALUE;

                        // 空き地情報を更新
                        emptyCellIndices[segmentIndex * maxEmptyCells + randomIdx] = index; // 元の位置を新しい空き地にする
                    }
                }
            }
        }
    }
}

// ワークグループサイズを 64 に設定
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let workgroupIndex = global_id.x;

    // ワークグループに対応する 4 つのセグメントインデックスを取得
    let segmentIndex1 = randomSegmentIndices[workgroupIndex * SEGMENTS_PER_GROUP];
    let segmentIndex2 = randomSegmentIndices[workgroupIndex * SEGMENTS_PER_GROUP + 1];
    let segmentIndex3 = randomSegmentIndices[workgroupIndex * SEGMENTS_PER_GROUP + 2];
    let segmentIndex4 = randomSegmentIndices[workgroupIndex * SEGMENTS_PER_GROUP + 3];

    let segmentIndices = array<u32, SEGMENTS_PER_GROUP>(segmentIndex1, segmentIndex2, segmentIndex3, segmentIndex4);

    // 空き地情報を更新
    update_empty_cells(segmentIndex1);
    update_empty_cells(segmentIndex2);
    update_empty_cells(segmentIndex3);
    update_empty_cells(segmentIndex4);

    // エージェントの引越し処理
    let randomBaseIndex = workgroupIndex * params.width * params.height; // 各ワークグループに対するランダムテーブルのオフセット
    move_agents_in_segments(segmentIndices, randomBaseIndex);
}
