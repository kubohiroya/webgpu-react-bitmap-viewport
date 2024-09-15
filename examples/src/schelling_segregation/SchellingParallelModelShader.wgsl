override EMPTY_VALUE: u32 = 999999;
override blockSize = 8;

struct Grid {
    values: array<atomic<u32>>
};

struct Params {
    width: u32,
    height: u32,
    tolerance: f32
};

@group(0) @binding(6) var<storage, read_write> grid : Grid;
@group(0) @binding(7) var<uniform> params: Params;
@group(0) @binding(8) var<storage, read> randomTable: array<f32>;  // 乱数表
@group(0) @binding(9) var<storage, read_write> emptyCells: array<atomic<u32>>;  // 空き地インデックス

// 2次元グリッドの(x, y)座標を1次元配列インデックスに変換
fn index(x: u32, y: u32, width: u32) -> u32 {
    return y * width + x;
}

fn random_choice(emptyCount: u32, step: u32) -> u32 {
    return u32(floor(randomTable[step] * f32(emptyCount)));
}


// x, y の周囲8セルを確認する関数
fn countSimilarNeighbors(x: u32, y: u32, width: u32, height: u32, agent_type: u32) -> vec2u {
    var similar_count: u32 = 0;
    var neighbor_count: u32 = 0;
    for (var dy: u32 = 0; dy < 2; dy++) {
        for (var dx: u32 = 0; dx < 2; dx++) {
            if (dx == 0 && dy == 0) {
                continue;
            }
            let neighbor_x = (x + dx + width) % width;
            let neighbor_y = (y + dy + height) % height;
            let neighbor_index = index(neighbor_x, neighbor_y, width);
            let current = atomicLoad(&grid.values[neighbor_index]);
            if (current == agent_type) {
                similar_count += 1;
            } else if (current != EMPTY_VALUE) {
                neighbor_count += 1;
            }
        }
    }
    return vec2u(similar_count, neighbor_count);
}

// 引越しを行う
@compute @workgroup_size(blockSize, blockSize)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let x = global_id.x;
    let y = global_id.y;

    if (x >= params.width || y >= params.height) {
        return;
    }

    let currentIndex = index(x, y, params.width);
    let agentType = atomicLoad(&grid.values[currentIndex]);

    if (agentType == EMPTY_VALUE) {
        return;
    }

    let count = countSimilarNeighbors(x, y, params.width, params.height, agentType);
    let similarCount = count.x;
    let neighborCount = count.y;

    let similarityRatio = f32(similarCount) / f32(neighborCount);

    if (neighborCount > 0u &&  similarityRatio < params.tolerance) {
        let randomIndex = random_choice(arrayLength(&emptyCells), currentIndex);
        let emptyGridIndex = atomicExchange(&emptyCells[randomIndex], currentIndex);
        atomicStore(&grid.values[emptyGridIndex], agentType);
        atomicStore(&grid.values[currentIndex], EMPTY_VALUE); // 元の場所は空き地にする
    }
}
