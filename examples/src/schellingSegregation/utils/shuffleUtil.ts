import seedrandom from 'seedrandom';

export function shuffleUint32ArrayWithSeed(
  data: Uint32Array,
  length: number,
  rng?: seedrandom.PRNG,
): void {
  // シャッフル関数 (Fisher–Yates shuffle)
  const random = rng ? rng : Math.random;
  for (let i = 0; i < length; i++) {
    const j = Math.floor(random() * (i + 1));
    const tmp = data[i];
    data[i] = data[j];
    data[j] = tmp;
  }
}

export function shuffle(data: Array<number>, rng?: seedrandom.PRNG): void {
  const random = rng ? rng : Math.random;
  for (let i = 0; i < data.length; i++) {
    const j = Math.floor(random() * (i + 1));
    const tmp = data[i];
    data[i] = data[j];
    data[j] = tmp;
  }
}
