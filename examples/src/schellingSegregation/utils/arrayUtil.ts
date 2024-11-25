export function sortUint32ArrayRange(
  array: Uint32Array,
  start: number,
  end: number,
): void {
  const subArray = Array.from(array.slice(start, end));
  subArray.sort((a, b) => a - b);
  array.set(subArray, start);
}

export function createHistogram(array: Uint32Array): { [key: number]: number } {
  const histogram: { [key: number]: number } = {};

  for (const value of array) {
    if (histogram[value] !== undefined) {
      histogram[value]++;
    } else {
      histogram[value] = 1;
    }
  }

  return histogram;
}

export function findIndices(
  inputArray: Uint32Array,
  target: number,
): Uint32Array {
  const indices: number[] = [];
  for (let i = 0; i < inputArray.length; i++) {
    if (inputArray[i] === target) {
      indices.push(i);
    }
  }

  return new Uint32Array(indices);
}

export function cumulativeSum(arr: number[]): number[] {
  // 初期値として0を設定
  let sum = 0;
  // 配列をマップして、累積和を計算
  const cumulativeSumArray = arr.map((value) => (sum += value));
  if (
    cumulativeSumArray[cumulativeSumArray.length - 1] < 0 ||
    1 < cumulativeSumArray[cumulativeSumArray.length - 1]
  ) {
    throw new Error();
  }
  return cumulativeSumArray;
}

/**
 * 与えられた累積和の配列 [0.5, 0.7, 1.0] から元の配列 [0.5, 0.2, 0.3] を求める
 * @param arr
 */
export function reverseCumulativeSum(arr: number[]): number[] {
  // 初期値として、最初の要素を設定
  let previous = 0;
  // 配列をマップして、現在の値から前の値を引くことで元の要素を復元
  return arr.map((value) => {
    const original = value - previous;
    previous = value;
    return original;
  });
}

export function processConvolution(
  x: number,
  y: number,
  width: number,
  height: number,
  callback: (index: number) => void,
): void {
  // x, y の周囲の相対的な位置
  const convolution = [
    [-1, -1],
    [0, -1],
    [1, -1], // 上の行
    [-1, 0],
    [1, 0], // 左右
    [-1, 1],
    [0, 1],
    [1, 1], // 下の行
  ];
  for (let i = 0; i < convolution.length; i++) {
    const xy = convolution[i];
    // xとyの上下左右ループを考慮して、座標を計算
    const newX = (x + xy[0] + width) % width;
    const newY = (y + xy[1] + height) % height;
    // インデックスを計算
    callback(newY * width + newX);
  }
}

export function printGrid(
  grid: ArrayLike<number>,
  width: number,
  height: number,
): void {
  for (let i = 0; i < height; i++) {
    let line = '';
    for (let j = 0; j < width; j++) {
      if (j !== 0) line += ', ';
      line += grid[i * width + j];
    }
    console.log(line);
  }
}

export function print2DMatrix(
  grid: Array<Array<number>>,
  width: number,
  height: number,
): void {
  console.log(`[`);
  for (let i = 0; i < height; i++) {
    let line = '';
    for (let j = 0; j < width; j++) {
      if (j !== 0) line += ', ';
      line += grid[i][j];
    }
    console.log(line);
  }
  console.log(']');
}

export const range = (n: number): number[] =>
  Array.from({ length: n }, (_, i) => i);
