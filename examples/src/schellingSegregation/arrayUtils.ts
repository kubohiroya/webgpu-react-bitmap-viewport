export function shuffleUint32Array(gridData: Uint32Array): void {
  // シャッフル関数 (Fisher–Yates shuffle)
  for (let i = gridData.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = gridData[i];
    gridData[i] = gridData[j];
    gridData[j] = tmp;
  }
}

export function shuffle(gridData: Array<number>): void {
  for (let i = gridData.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = gridData[i];
    gridData[i] = gridData[j];
    gridData[j] = tmp;
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
