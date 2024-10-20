function getSilhouetteArea(
  bitmap: number[][],
  startX: number,
  startY: number,
): number {
  const height = bitmap.length;
  const width = bitmap[0].length;
  const targetColor = bitmap[startY][startX];

  // 既に訪問した座標を保持するためのセット
  const visited = new Set<string>();

  // 探索するためのキュー
  const queue: [number, number][] = [];
  queue.push([startX, startY]);
  visited.add(`${startX},${startY}`);

  // 4方向の隣接を定義
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  let area = 0;

  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    area++;

    // 隣接するピクセルを探索
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const key = `${nx},${ny}`;
        if (!visited.has(key) && bitmap[ny][nx] === targetColor) {
          visited.add(key);
          queue.push([nx, ny]);
        }
      }
    }
  }

  return area;
}

function getSilhouetteAreaDistribution(
  bitmap: number[][],
  binWidth: number,
): { [key: number]: number } {
  const height = bitmap.length;
  const width = bitmap[0].length;
  const visited = new Set<string>();
  const distribution: { [key: number]: number } = {};

  // 全てのピクセルを探索
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const key = `${x},${y}`;
      if (!visited.has(key)) {
        const color = bitmap[y][x];
        const area = getSilhouetteArea(bitmap, x, y);

        // 訪問済みとしてマーク
        for (let ny = 0; ny < height; ny++) {
          for (let nx = 0; nx < width; nx++) {
            if (bitmap[ny][nx] === color) {
              visited.add(`${nx},${ny}`);
            }
          }
        }

        // 面積の度数分布を更新
        const bin = Math.floor(area / binWidth) * binWidth;
        distribution[bin] = (distribution[bin] || 0) + 1;
      }
    }
  }

  return distribution;
}

function getSilhouetteAreaDistributionByColor(bitmap: number[][]): {
  [color: number]: { [key: number]: number };
} {
  const height = bitmap.length;
  const width = bitmap[0].length;
  const visited = new Set<string>();
  const distribution: { [color: number]: { [key: number]: number } } = {};

  // 全てのピクセルを探索
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const key = `${x},${y}`;
      if (!visited.has(key)) {
        const color = bitmap[y][x];
        const area = getSilhouetteArea(bitmap, x, y);

        // 訪問済みとしてマーク
        for (let ny = 0; ny < height; ny++) {
          for (let nx = 0; nx < width; nx++) {
            if (bitmap[ny][nx] === color) {
              visited.add(`${nx},${ny}`);
            }
          }
        }

        // 面積の度数分布を更新
        if (!distribution[color]) {
          distribution[color] = {};
        }
        distribution[color][area] = (distribution[color][area] || 0) + 1;
      }
    }
  }

  return distribution;
}
