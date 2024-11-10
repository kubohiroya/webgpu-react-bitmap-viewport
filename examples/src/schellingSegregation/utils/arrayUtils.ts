export function shuffleUint32Array(data: Uint32Array, length: number): void {
  // シャッフル関数 (Fisher–Yates shuffle)
  for (let i = 0; i < length; i++) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = data[i];
    data[i] = data[j];
    data[j] = tmp;
  }
}

export function shuffle(data: Array<number>): void {
  for (let i = 0; i < data.length; i++) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = data[i];
    data[i] = data[j];
    data[j] = tmp;
  }
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
  // 0の値を持つインデックスを一時的に保存するための配列
  const indices: number[] = [];

  // 配列をループし、EMPTY_VALUEの要素のインデックスを収集
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
