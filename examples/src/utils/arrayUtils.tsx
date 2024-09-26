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
