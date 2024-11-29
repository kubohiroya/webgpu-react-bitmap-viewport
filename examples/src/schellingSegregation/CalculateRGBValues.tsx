import { hsvToRgb } from './utils/colorUtil';

export const calculateRGBValues = (agentTypeCumulativeShares: number[]) => {
  const rgbValueEntries = agentTypeCumulativeShares.map((value: number) => {
    return [Math.floor(255 * value), hsvToRgb(1 - value, 0.9, 0.9)];
  });

  const rgbValues: Array<[number, number, number]> = rgbValueEntries.map(
    ([_, rgb]) => rgb as [number, number, number],
  );

  const rgbValueMap = new Map<number, [number, number, number]>(
    rgbValueEntries as [number, [number, number, number]][],
  );

  const valueToRGB = (value: number) => {
    const rgb = rgbValueMap.get(Math.floor(255 * value));
    return rgb || [255, 255, 255];
  };

  return { rgbValues, valueToRGB };
};
