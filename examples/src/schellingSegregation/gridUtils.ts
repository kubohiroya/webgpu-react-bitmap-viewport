import { EMPTY_VALUE } from 'webgpu-react-bitmap-viewport';

export function shuffleGridData(gridData: Uint32Array): void {
  // シャッフル関数 (Fisher–Yates shuffle)
  for (let i = gridData.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [gridData[i], gridData[j]] = [gridData[j], gridData[i]];
  }
}

export function findEmptyGridIndices(inputArray: Uint32Array): Uint32Array {
  // 0の値を持つインデックスを一時的に保存するための配列
  const emptyGridIndices: number[] = [];

  // 配列をループし、EMPTY_VALUEの要素のインデックスを収集
  for (let i = 0; i < inputArray.length; i++) {
    if (inputArray[i] === EMPTY_VALUE) {
      emptyGridIndices.push(i);
    }
  }
  // Uint32Arrayに変換して返す
  return new Uint32Array(emptyGridIndices);
}
