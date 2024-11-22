import { SegregationUIProps } from './SegregationUIProps';
import { SegregationKernelDataProps } from './SegregationKernelDataProps';
import React, {
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  EMPTY_VALUE,
  Grid,
  GridHandles,
  GridShaderMode,
} from 'webgpu-react-bitmap-viewport';
import { Box, CircularProgress, Slider, Tooltip } from '@mui/material';
import { GridOn, PieChart } from '@mui/icons-material';
import SplitSlider from './components/SplitSlider';
import {
  PlayController,
  PlayControllerState,
} from './components/PlayController';
import { SegregationKernel } from './SegregationKernel';
import { cumulativeSum } from './utils/arrayUtil';
import { hsvToRgb } from './utils/colorUtil';

import {
  ToleranceController,
  ToleranceControllerHandle,
} from './ToleranceController';
import { KeyboardModifier } from 'dist/types/src/components/grid/KeyboardModifier';

const SCROLLBAR = {
  radius: 5.0,
  margin: 2.0,
};

export function SegregationUI(
  props: SegregationUIProps &
    SegregationKernelDataProps & {
      kernel: SegregationKernel;
    },
) {
  const locked = useRef<boolean>(false);
  const gridHandlesRefs = [useRef<GridHandles>(null)];
  const toleranceControllerRef = useRef<ToleranceControllerHandle>(null);
  const kernelRef = useRef<SegregationKernel>(props.kernel);

  const [playControllerState, setPlayControllerState] =
    useState<PlayControllerState>(PlayControllerState.INITIALIZING);

  const [gridSize, setGridSize] = useState(Math.max(props.width, props.height));
  const [gridSizeSource, setGridSizeSource] = useState(10);

  const [tolerance, setTolerance] = useState<number>(
    props.tolerance !== undefined ? props.tolerance : 0.5,
  );
  const [agentTypeCumulativeShares, setAgentTypeCumulativeShares] = useState<
    number[]
  >(cumulativeSum(props.agentTypeShares));

  const [focusedCell, setFocusedCell] = useState<[number, number]>([-1, -1]);
  const [selectedCell, setSelectedCell] = useState<[number, number]>([-1, -1]);
  /*
  const [selectedState, setSelectedState] = useState<Uint32Array>(
    new Uint32Array((props.width * props.height) / 32),
  );
   */

  const updateFrameCount = useCallback((frameCount: number) => {
    kernelRef.current.getUIState().setFrameCount(frameCount);
  }, []);

  const update = useCallback(
    async (
      playControllerState: PlayControllerState,
      _gridSize?: number,
      _agentTypeCumulativeShares?: number[],
    ) => {
      switch (playControllerState) {
        case PlayControllerState.INITIALIZING:
          const width = _gridSize || gridSize;
          const height = _gridSize || gridSize;
          const grid = kernelRef.current.createInitialGridData(
            width,
            height,
            _agentTypeCumulativeShares || agentTypeCumulativeShares,
            tolerance,
            EMPTY_VALUE,
          );
          kernelRef.current.syncGridContent(grid);
          toleranceControllerRef.current!.update(0);
          setPlayControllerState(PlayControllerState.INITIALIZED);
          break;
        case PlayControllerState.INITIALIZED:
          kernelRef.current.shuffleGridContent();
          kernelRef.current.updateEmptyCellIndices();
          kernelRef.current.syncGridContent(kernelRef.current.getGrid());
          setPlayControllerState(PlayControllerState.PAUSED);
          const newMovingAgentCount = kernelRef.current.getMovingAgentCount();
          toleranceControllerRef.current!.update(newMovingAgentCount);
          break;
        case PlayControllerState.RUNNING:
          await kernelRef.current.tick();
          break;
        case PlayControllerState.STEP_RUNNING:
          await kernelRef.current.tick();
          setPlayControllerState(PlayControllerState.PAUSED);
          break;
      }
      gridHandlesRefs.forEach((ref) => {
        ref.current?.refreshData(0);
        ref.current?.refreshViewportState(0);
      });
    },
    [playControllerState, gridSize, agentTypeCumulativeShares],
  );

  const updateTolerance = useCallback((value: number) => {
    kernelRef.current.setTolerance(value);
  }, []);

  const onGridSizeChangeTransient = useCallback(
    (_: Event | SyntheticEvent, newValueSource: number | number[]) => {
      setPlayControllerState(PlayControllerState.INITIALIZING);
      const newGridSizeSource = newValueSource as number;
      const newGridSize = 2 ** newGridSizeSource;
      setGridSizeSource(newGridSizeSource);
      setGridSize(newGridSize);
    },
    [],
  );

  const onGridSizeChangeCommit = useCallback(
    (_: Event | SyntheticEvent, newValueSource: number | number[]) => {
      const newGridSizeSource = newValueSource as number;
      const newGridSize = 2 ** newGridSizeSource;
      setGridSizeSource(newGridSizeSource);
      setGridSize(newGridSize);
      update(
        PlayControllerState.INITIALIZING,
        newGridSize,
        agentTypeCumulativeShares,
      );
    },
    [update, agentTypeCumulativeShares],
  );

  const onAgentTypeCumulativeSharesChange = useCallback(
    (values: number[]) => {
      const newAgentTypeCumulativeShares = values;
      setAgentTypeCumulativeShares(newAgentTypeCumulativeShares);
      update(
        PlayControllerState.INITIALIZING,
        gridSize,
        newAgentTypeCumulativeShares,
      );
    },
    [update, gridSize],
  );

  const onToleranceChange = useCallback(
    (_: Event, newValue: number | number[]) => {
      const value = newValue as number;
      setTolerance(value);
      updateTolerance(value);
    },
    [updateTolerance],
  );

  const tick = useCallback(async () => {
    if (playControllerState === PlayControllerState.PAUSED) {
      return false;
    }
    if (
      playControllerState === PlayControllerState.INITIALIZED ||
      playControllerState === PlayControllerState.RUNNING ||
      playControllerState === PlayControllerState.STEP_RUNNING
    ) {
      if (!locked.current) {
        locked.current = true;
        await update(playControllerState, gridSize, agentTypeCumulativeShares);

        gridHandlesRefs?.forEach((ref, index) => {
          ref.current?.refreshData(index);
        });

        const newMovingAgentCount = kernelRef.current.getMovingAgentCount();
        toleranceControllerRef.current!.update(newMovingAgentCount);

        if (
          playControllerState === PlayControllerState.RUNNING &&
          newMovingAgentCount === 0
        ) {
          setPlayControllerState(PlayControllerState.PAUSED);
        }
        locked.current = false;
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }, [playControllerState]);

  const onReset = useCallback(() => {
    update(
      PlayControllerState.INITIALIZING,
      gridSize,
      agentTypeCumulativeShares,
    );
  }, [gridSize, agentTypeCumulativeShares]);

  const onPause = useCallback(() => {
    setPlayControllerState(PlayControllerState.PAUSED);
  }, []);

  const onStep = useCallback(async () => {
    switch (playControllerState) {
      case PlayControllerState.INITIALIZED:
        await update(
          PlayControllerState.INITIALIZED,
          gridSize,
          agentTypeCumulativeShares,
        );
        break;
      case PlayControllerState.STEP_RUNNING:
      case PlayControllerState.PAUSED:
        setPlayControllerState(PlayControllerState.STEP_RUNNING);
        break;
    }
  }, [playControllerState]);

  const onPlay = useCallback(async () => {
    if (playControllerState == PlayControllerState.INITIALIZED) {
      await update(
        PlayControllerState.INITIALIZED,
        gridSize,
        agentTypeCumulativeShares,
      );
    }
    setPlayControllerState(PlayControllerState.RUNNING);
  }, [playControllerState]);

  const onFocusedCellPositionChange = useCallback(
    (sourceIndex: number, columnIndex: number, rowIndex: number) => {
      setFocusedCell([columnIndex, rowIndex]);
      gridHandlesRefs
        .filter((_, index) => index !== 0)
        .forEach((ref) => {
          ref.current?.refreshFocusedState(sourceIndex, columnIndex, rowIndex);
        });
    },
    [],
  );

  const onSelectedStateChange = useCallback(
    (
      sourceIndex: number,
      columnIndex: number,
      rowIndex: number,
      keyboardModifier: KeyboardModifier,
    ) => {
      gridHandlesRefs
        .filter((_, index) => index !== 0)
        .forEach((ref) =>
          ref.current?.refreshSelectedState(
            sourceIndex,
            columnIndex,
            rowIndex,
            keyboardModifier,
          ),
        );
      const bitIndex = rowIndex * gridSize + columnIndex;
      const cellIndex = Math.floor(bitIndex / 32);
      const bitPosition = bitIndex % 32;
      // console.log(kernelRef.current.getUIState().selectedStates);
      if (
        (kernelRef.current.getUIState().selectedStates[cellIndex] &
          (1 << bitPosition)) ===
        0
      ) {
        setSelectedCell([-1, -1]);
      } else {
        setSelectedCell([columnIndex, rowIndex]);
      }
    },
    [],
  );

  const onViewportStateChange = useCallback((sourceIndex: number) => {
    gridHandlesRefs
      .filter((_, index) => index !== 0)
      .forEach((ref) => ref.current?.refreshViewportState(sourceIndex));
  }, []);

  useEffect(() => {
    (async () => {
      await update(
        PlayControllerState.INITIALIZING,
        gridSize,
        agentTypeCumulativeShares,
      );
      if (props.autoStart) {
        await update(
          PlayControllerState.INITIALIZED,
          gridSize,
          agentTypeCumulativeShares,
        );
        setPlayControllerState(PlayControllerState.RUNNING);
      }
    })();
  }, []);

  const calculateGridCellCount = useCallback((value: number) => {
    return 2 ** value;
  }, []);

  const rgbValueEntries = useMemo(() => {
    return agentTypeCumulativeShares.map((value: number) => {
      return [Math.floor(255 * value), hsvToRgb(1 - value, 0.9, 0.9)];
    });
  }, [agentTypeCumulativeShares]);

  const rgbValues = useMemo(() => {
    return rgbValueEntries.map(([_, rgb]) => rgb as [number, number, number]);
  }, [rgbValueEntries]);

  const rgbValueMap = useMemo(() => {
    return new Map<number, [number, number, number]>(
      rgbValueEntries as [number, [number, number, number]][],
    );
  }, [rgbValueEntries]);

  const valueToRGB = useCallback(
    (value: number) => {
      const rgb = rgbValueMap.get(Math.floor(255 * value));
      return rgb || [255, 255, 255];
    },
    [rgbValueMap],
  );

  const splitSliderSx = useMemo(
    () => ({
      '& .MuiSlider-thumb': rgbValues
        .map((rgbValue, index) => {
          //rgb[0] = Math.floor(rgb[0]);
          return [
            `&[data-index='${index}']`,
            {
              color: `rgb(${rgbValue.join(' ')})`,
            },
          ];
        })
        .reduce<Record<string, { color: string }>>(
          (acc: Record<string, { color: string }>, [key, value]: any) => {
            acc[key] = value;
            return acc;
          },
          {},
        ),
    }),
    [agentTypeCumulativeShares],
  );

  const valueLabelFormat = useCallback(
    (value: number, index: number) => {
      const format = (value: number) => `${(value * 100).toFixed(1)}%`;
      if (index === 0 || index === -1) {
        return format(value); // 最初のサムはそのままの値を表示
      }
      return format(value - agentTypeCumulativeShares[index - 1]); // 直前の値との差を表示
    },
    [agentTypeCumulativeShares],
  );

  const empty = useMemo(
    () =>
      (
        (1 - agentTypeCumulativeShares[agentTypeCumulativeShares.length - 1]) *
        100
      ).toFixed(1),
    [agentTypeCumulativeShares],
  );

  const gridSizeMarks = useMemo(
    () =>
      [3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((value) => ({
        value: value,
        label: (2 ** value).toString(),
      })),
    [],
  );

  const grid = kernelRef.current.getGrid();

  return (
    <>
      <Box
        style={{
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: '#b3b3b3',
          borderRadius: '5px',
          padding: '8px 32px 8px 32px',
          margin: '2px 0 2px 0',
        }}
      >
        <Box
          style={{
            display: 'flex',
            columnGap: '18px',
            alignItems: 'center',
          }}
        >
          <Box style={{ marginBottom: '10px' }}>
            <GridOn titleAccess={'gridSize'} />
          </Box>

          <Slider
            aria-label={'grid size'}
            value={gridSizeSource}
            min={3}
            max={12}
            scale={calculateGridCellCount}
            step={1}
            marks={gridSizeMarks}
            onChange={onGridSizeChangeTransient}
            onChangeCommitted={onGridSizeChangeCommit}
            valueLabelDisplay="auto"
          />
        </Box>

        <Tooltip title={`AgentShares (${empty}% empty)`} placement={'right'}>
          <Box
            style={{
              display: 'flex',
              columnGap: '18px',
              alignItems: 'center',
            }}
          >
            <PieChart style={{ marginTop: '8px', marginRight: '8px' }} />
            <SplitSlider
              splitValues={agentTypeCumulativeShares}
              onChange={onAgentTypeCumulativeSharesChange}
              sx={splitSliderSx}
              valueLabelFormat={valueLabelFormat}
            />
          </Box>
        </Tooltip>
      </Box>
      <Box
        style={{
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: '#b3b3b3',
          borderRadius: '5px',
          padding: '0px 32px 0px 32px',
          margin: '2px 0 2px 0',
          alignSelf: 'center',
          justifyItems: 'center',
        }}
      >
        <PlayController
          state={playControllerState}
          speed={props.speed}
          onReset={onReset}
          onPause={onPause}
          onStep={onStep}
          onPlay={onPlay}
          tick={tick}
          updateFrameCount={updateFrameCount}
        />
      </Box>

      <ToleranceController
        ref={toleranceControllerRef}
        grid={grid}
        width={gridSize}
        height={gridSize}
        x={selectedCell[0] >= 0 ? selectedCell[0] : focusedCell[0]}
        y={selectedCell[1] >= 0 ? selectedCell[1] : focusedCell[1]}
        tolerance={tolerance}
        onToleranceChange={onToleranceChange}
        valueToRGB={valueToRGB}
        canvasWidth={48}
        canvasHeight={32}
        torus={true}
        mooreNeighborhoodSize={3}
        movingAgentCount={0}
      />

      <Box>
        <Box
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            display: 'flex',
            width: props.canvasSize.width + 'px',
            height: props.canvasSize.height + 'px',
          }}
        >
          {!kernelRef.current ||
          playControllerState === PlayControllerState.INITIALIZING ? (
            <CircularProgress
              size="64px"
              style={{
                margin: 'auto',
              }}
            />
          ) : (
            <Grid
              ref={gridHandlesRefs[0]}
              numViewports={1}
              viewportIndex={0}
              mode={GridShaderMode.CUSTOM}
              numColumns={gridSize}
              numRows={gridSize}
              headerOffset={props.headerOffset}
              scrollBar={SCROLLBAR}
              canvasSize={props.canvasSize}
              data={grid}
              focusedCellPosition={
                kernelRef.current.getUIState().focusedCellPosition
              }
              selectedStates={kernelRef.current.getUIState().selectedStates}
              viewportStates={kernelRef.current.getUIState().viewportStates}
              onFocusedCellPositionChange={onFocusedCellPositionChange}
              onSelectedStateChange={onSelectedStateChange}
              onViewportStateChange={onViewportStateChange}
            />
          )}
        </Box>
      </Box>
    </>
  );
}
