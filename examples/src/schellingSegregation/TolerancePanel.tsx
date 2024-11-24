import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { Box, Slider, Typography } from '@mui/material';
import {
  SentimentVeryDissatisfied,
  SentimentVerySatisfied,
} from '@mui/icons-material';
import MooreNeighborhood from './MooreNeighborhood';
import { EMPTY_VALUE } from 'webgpu-react-bitmap-viewport';
import { range } from './utils/arrayUtil';

type ToleranceControllerProps = {
  tolerance: number;
  grid: Uint32Array;
  width: number;
  height: number;
  x: number;
  y: number;
  onToleranceChange: (event: Event, value: number | number[]) => void;
  valueToRGB: (value: number) => number[];
  torus: boolean;
  mooreNeighborhoodSize: number;
  canvasWidth: number;
  canvasHeight: number;
  movingAgentCount: number;
};

export type TolerancePanelHandle = {
  update: (movingAgentCount: number) => void;
};

const createMarks = (agentCount: number) => {
  return range(agentCount + 1).map((value) => ({
    value: value / agentCount,
    label: `${value}/${agentCount}`,
  }));
};

export const TolerancePanel = React.memo(
  forwardRef<TolerancePanelHandle, ToleranceControllerProps>((props, ref) => {
    const {
      tolerance,
      grid,
      width,
      height,
      x,
      y,
      onToleranceChange,
      valueToRGB,
      torus,
      mooreNeighborhoodSize,
      canvasWidth,
      canvasHeight,
    } = props;

    const [count, setCount] = useState(0);
    const [mooreNeighborhoodData, setMooreNeighborhoodData] =
      useState<Uint32Array>(new Uint32Array(mooreNeighborhoodSize ** 2));
    const [marks, setMarks] = useState<Array<{ value: number; label: string }>>(
      createMarks(8),
    );
    const [similarAgentCount, setSimilarAgentCount] = useState(0);
    const [agentCount, setAgentCount] = useState(0);
    const [movingAgentCount, setMovingAgentCount] = useState(0);
    useImperativeHandle(ref, () => ({
      update: (movingAgentCount: number) => {
        setCount((prev) => prev + 1);
        setMovingAgentCount(movingAgentCount);
      },
    }));

    useEffect(() => {
      if (x < 0 || x >= width || y < 0 || y >= height) {
        return;
      }

      const neighborhoodRadius = Math.floor(mooreNeighborhoodSize / 2);

      // 各セルのサイズ（ピクセル単位）
      let agentCount = 0;
      let similarAgentCount = 0;

      const centerValue = grid[y * width + x];

      for (let row = 0; row < mooreNeighborhoodSize; row++) {
        for (let col = 0; col < mooreNeighborhoodSize; col++) {
          const dx = x - neighborhoodRadius + col;
          const dy = y - neighborhoodRadius + row;
          // ビットマップデータの範囲を超える場合はスキップ
          if (!torus && (dx < 0 || dx >= width || dy < 0 || dy >= height)) {
            mooreNeighborhoodData[row * mooreNeighborhoodSize + col] =
              EMPTY_VALUE;
          } else {
            const index =
              ((dy + height) % height) * width + ((dx + width) % width);
            const value = grid[index];
            mooreNeighborhoodData[row * mooreNeighborhoodSize + col] = value;
            if (centerValue === EMPTY_VALUE) {
              continue;
            }
            if (col !== neighborhoodRadius || row !== neighborhoodRadius) {
              if (value === EMPTY_VALUE) {
                continue;
              }
              agentCount++;
              if (centerValue === value) {
                similarAgentCount++;
              }
            }
          }
        }
      }
      setMooreNeighborhoodData(new Uint32Array(mooreNeighborhoodData));
      setMarks(createMarks(agentCount === 0 ? 8 : agentCount));
      setAgentCount(agentCount);
      setSimilarAgentCount(similarAgentCount);
    }, [grid, width, x, y, mooreNeighborhoodSize, valueToRGB, count]);

    const isSatisfied = useMemo(
      () => agentCount === 0 || tolerance < similarAgentCount / agentCount,
      [agentCount, tolerance, similarAgentCount],
    );

    return (
      <>
        <Box style={{ display: 'flex', columnGap: '18px', padding: '10px' }}>
          <SentimentVeryDissatisfied
            color={'error'}
            titleAccess={'want to move'}
          />
          <Slider
            aria-label="tolerance"
            color={isSatisfied ? 'primary' : 'error'}
            min={0}
            max={1.0}
            step={0.01}
            marks={marks}
            value={tolerance}
            onChange={onToleranceChange}
            valueLabelDisplay="auto"
          />
          <SentimentVerySatisfied
            color={'primary'}
            titleAccess={'want to stay'}
          />
          <MooreNeighborhood
            mooreNeighborhoodData={mooreNeighborhoodData}
            mooreNeighborhoodSize={mooreNeighborhoodSize}
            valueToRGB={valueToRGB}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
          />
          <Box style={{ alignSelf: 'center', width: '15%' }}>
            <Typography fontSize={11} color={isSatisfied ? 'primary' : 'error'}>
              {similarAgentCount} / {agentCount}
            </Typography>
          </Box>
        </Box>
        <Box
          style={{
            width: '100%',
            display: 'flex',
            gap: '10px',
            justifyContent: 'center',
          }}
        >
          <Typography fontSize={11}>
            moves: {movingAgentCount?.toLocaleString() || 0}
          </Typography>
          <Typography fontSize={11}>/</Typography>
          <Typography fontSize={11}>
            gridSize: {(width * height).toLocaleString()} (
            {width.toLocaleString()} x {height.toLocaleString()})
          </Typography>
        </Box>
      </>
    );
  }),
);
