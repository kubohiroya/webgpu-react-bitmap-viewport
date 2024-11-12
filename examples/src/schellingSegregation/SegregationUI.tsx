import { SegregationUIProps } from './SegregationUIProps';
import { SegregationKernelDataProps } from './SegregationKernelDataProps';
import React, {
  SyntheticEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Grid,
  GridHandles,
  GridShaderMode,
} from 'webgpu-react-bitmap-viewport';
import { Box, CircularProgress, Slider, Typography } from '@mui/material';
import {
  GridOn,
  PieChart,
  SentimentVeryDissatisfied,
} from '@mui/icons-material';
import SplitSlider from './components/SplitSlider';
import {
  PlayController,
  PlayControllerState,
} from './components/PlayController';
import { SegregationKernel } from './SegregationKernel';
import { cumulativeSum } from './utils/arrayUtils';
import { CellInfo } from './CellInfo';

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
          );
          kernelRef.current.syncGridContent(grid);
          setPlayControllerState(PlayControllerState.INITIALIZED);
          break;
        case PlayControllerState.INITIALIZED:
          kernelRef.current.shuffleGridContent();
          kernelRef.current.updateEmptyCellIndices();
          kernelRef.current.syncGridContent(kernelRef.current.getGrid());
          setPlayControllerState(PlayControllerState.PAUSED);
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

  const getOnFocusedStateChange = useCallback(
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

  const getOnSelectedStateChange = useCallback(
    (sourceIndex: number, columnIndex: number, rowIndex: number) => {
      gridHandlesRefs
        .filter((_, index) => index !== 0)
        .forEach((ref) =>
          ref.current?.refreshSelectedState(sourceIndex, columnIndex, rowIndex),
        );
    },
    [],
  );

  const getOnViewportStateChange = useCallback((sourceIndex: number) => {
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

  function calculateValue(value: number) {
    return 2 ** value;
  }

  const info =
    CellInfo({
      focusedCell,
      width: gridSize,
      height: gridSize,
      agentTypeCumulativeShares,
      grid: kernelRef.current.getGrid(),
    }) || '';

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
            <GridOn />
          </Box>

          <Slider
            aria-label={'grid size'}
            value={gridSizeSource}
            min={3}
            max={12}
            scale={calculateValue}
            step={1}
            marks={[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((value) => ({
              value: value,
              label: (2 ** value).toString(),
            }))}
            onChange={onGridSizeChangeTransient}
            onChangeCommitted={onGridSizeChangeCommit}
            valueLabelDisplay="auto"
          />
        </Box>
        <Box
          style={{
            display: 'flex',
            columnGap: '18px',
            alignItems: 'center',
          }}
        >
          <PieChart />
          <SplitSlider
            splitValues={agentTypeCumulativeShares}
            onChange={onAgentTypeCumulativeSharesChange}
          />
        </Box>
      </Box>
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

      <Box style={{ display: 'flex', columnGap: '18px', padding: '16px' }}>
        <SentimentVeryDissatisfied />
        <Slider
          aria-label="tolerance"
          min={0}
          max={1.0}
          step={0.01}
          marks={[0, 1, 2, 3, 4, 5, 6, 7, 8].map((value) => ({
            value: value / 8,
            label: `${value} / 8`,
          }))}
          value={tolerance}
          onChange={onToleranceChange}
          valueLabelDisplay="auto"
        />
      </Box>
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
              data={kernelRef.current.getGrid()}
              focusedStates={kernelRef.current.getUIState().focusedStates}
              selectedStates={kernelRef.current.getUIState().selectedStates}
              viewportStates={kernelRef.current.getUIState().viewportStates}
              onFocusedStateChange={getOnFocusedStateChange}
              onSelectedStateChange={getOnSelectedStateChange}
              onViewportStateChange={getOnViewportStateChange}
            />
          )}
        </Box>
        <Typography>{info || `gridSize: ${gridSize} x ${gridSize}`}</Typography>
      </Box>
    </>
  );
}
