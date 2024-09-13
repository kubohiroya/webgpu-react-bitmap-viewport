// シェリングの分居モデル用WGSLコンピュートシェーダ
struct Grid {
    values: array<f32>, // Infinity: 空、0.0-1.0: タイプ
};

struct Params {
    width: u32,
    height: u32,
    tolerance: f32
};

@group(1) @binding(0) var<storage, read_write> grid : Grid;
@group(1) @binding(1) var<storage, read> new_grid : Grid;
@group(1) @binding(2) var<uniform> params: Params;
@group(1) @binding(3) var<storage, read_write> empty_cells: array<u32>;  // 空き地インデックス
@group(1) @binding(4) var<storage> random_table: array<f32>;  // 乱数表

// 2次元グリッドの(x, y)座標を1次元配列インデックスに変換
fn index(x: u32, y: u32, width: u32) -> u32 {
    return y * width + x;
}

fn random_choice(empty_count: u32, step: u32) -> u32 {
    let random_value = random_table[step] * f32(empty_count);
    return u32(random_value) % empty_count;
}

// x, y の周囲8セルを確認する関数
fn count_similar_neighbors(x: u32, y: u32, width: u32, height: u32, agent_type: u32) -> u32 {
    var similar_count: u32 = 0;
    var neighbor_count: u32 = 0;
    for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
            if (dx == 0 && dy == 0) {
                continue;
            }
            let neighbor_x = (x + dx + width) % width;
            let neighbor_y = (y + dy + height) % height;
            let neighbor_index = index(neighbor_x, neighbor_y, width);
            if (grid.values[neighbor_index] == agent_type) {
                similar_count += 1;
            } else if (grid.values[neighbor_index] == Infinity) {
                neighbor_count += 1;
            }
        }
    }
    return vec2u(similar_count, neighbor_count);
}

// 引越しを行う
@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let x = global_id.x;
    let y = global_id.y;

    if (x >= params.width || y >= params.height) {
        return;
    }

    let index = index(x, y, params.width);
    let agent_type = grid.values[index];

    // エージェントが存在しない場所 (空き地) はスキップ
    if (isInf(agent_type)) {
        return;
    }

    // 似たエージェントがどれだけいるかカウント
    let count = count_similar_neighbors(x, y, params.width, params.height, agent_type);
    let similar_count = count.x;
    let neighbor_count = count.y;

    // 閾値に基づいて、引越しを決定
    let similarity_ratio = f32(similar_count) / f32(neighbor_count);

    // 引越しが必要かどうか
    if (neighbor_count > 0u &&  similarity_ratio < params.tolerance) {
        let empty_count = empty_cells.length;
        let random_index = random_choice(empty_count, global_id.z);
        let empty_index = empty_cells[random_index];
        new_grid.values[new_index] = agent_type;
        grid.values[index] = Infinity; // 元の場所は空き地にする
    }
}
