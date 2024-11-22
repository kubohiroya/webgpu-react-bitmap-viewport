import React, { useRef, useEffect } from 'react';
import { EMPTY_VALUE } from 'webgpu-react-bitmap-viewport';

type Props = {
  mooreNeighborhoodData: Uint32Array; // ビットマップデータ
  mooreNeighborhoodSize: number; // ムーア近傍の行列サイズ (奇数を想定)
  valueToRGB: (value: number) => number[]; // ビットマップデータの値をRGBに変換する関数
  canvasWidth: number; // キャンバスの横幅
  canvasHeight: number; // キャンバスの縦幅
};

const MooreNeighborhoodCanvas: React.FC<Props> = ({
  mooreNeighborhoodData,
  mooreNeighborhoodSize,
  valueToRGB,
  canvasWidth,
  canvasHeight,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const neighborhoodRadius = Math.floor(mooreNeighborhoodSize / 2);

    // 各セルのサイズ（ピクセル単位）
    const cellWidth = canvasWidth / mooreNeighborhoodSize;
    const cellHeight = canvasHeight / mooreNeighborhoodSize;

    const centerValue =
      mooreNeighborhoodData[
        neighborhoodRadius * mooreNeighborhoodSize + neighborhoodRadius
      ];

    for (let row = 0; row < mooreNeighborhoodSize; row++) {
      for (let col = 0; col < mooreNeighborhoodSize; col++) {
        // ビットマップデータの範囲を超える場合はスキップ
        const index = row * mooreNeighborhoodSize + col;
        const value = mooreNeighborhoodData[index];
        const [r, g, b] = valueToRGB(value / 255);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        if (
          centerValue === value &&
          (col !== neighborhoodRadius || row !== neighborhoodRadius)
        ) {
          ctx.fillRect(
            col * cellWidth + 1,
            row * cellHeight + 1,
            cellWidth - 2,
            cellHeight - 2,
          );
        } else if (value !== EMPTY_VALUE) {
          ctx.fillRect(
            col * cellWidth + 4,
            row * cellHeight + 3,
            cellWidth - 7,
            cellHeight - 6,
          );
        }
      }
    }
  }, [mooreNeighborhoodData, mooreNeighborhoodSize]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      style={{ border: '1px solid black' }}
    />
  );
};

export default MooreNeighborhoodCanvas;
