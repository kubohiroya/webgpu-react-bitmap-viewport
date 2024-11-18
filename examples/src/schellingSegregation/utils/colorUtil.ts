const rgb = (r: number, b: number, g: number): [number, number, number] => [
  Math.round(r * 255),
  Math.round(g * 255),
  Math.round(b * 255),
];

export function hsvToRgb(
  h: number,
  s: number,
  v: number,
): [number, number, number] {
  if (h < 0 || h > 1 || s < 0 || s > 1 || v < 0 || v > 1) {
    throw new Error('Input values must be in the range [0.0, 1.0]');
  }

  const hue = h * 360; // 0.0-1.0 を 0-360 に変換
  const c = v * s; // 彩度の影響による輝度の変化
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1)); // 中間色
  const m = v - c;

  if (0 <= hue && hue < 60) {
    return rgb(c + m, x + m, m);
  } else if (60 <= hue && hue < 120) {
    return rgb(x + m, c + m, m);
  } else if (120 <= hue && hue < 180) {
    return rgb(m, c + m, x + m);
  } else if (180 <= hue && hue < 240) {
    return rgb(m, x + m, c + m);
  } else if (240 <= hue && hue < 300) {
    return rgb(x + m, m, c + m);
  } else if (300 <= hue && hue < 360) {
    return rgb(c + m, m, x + m);
  } else {
    return [0, 0, 0];
  }
}
