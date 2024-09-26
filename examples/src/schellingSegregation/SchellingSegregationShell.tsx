import { SchellingSegregationShellProps } from './SchellingSegregationShellProps';
import { SchellingSegregationModelProps } from './SchellingSegregationModelProps';
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
import { cumulativeSum, reverseCumulativeSum } from '../utils/arrayUtils';
import { Box, CircularProgress, Slider } from '@mui/material';
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
import { SchellingSegregationKernel } from './SchellingSegregationKernel';
import { findEmptyCells, shuffleGridData } from './gridUtils';

const SCROLLBAR = {
  radius: 5.0,
  margin: 2.0,
};

export function SchellingSegregationShell(
  props: SchellingSegregationShellProps &
    SchellingSegregationModelProps & {
      kernel: SchellingSegregationKernel;
    },
) {
  const frameRef = useRef<number | null>(null);
  const gridHandlesRefs = [useRef<GridHandles>(null)];
  const kernelRef = useRef<SchellingSegregationKernel>(props.kernel);

  const [speed, setSpeed] = useState<number>(0.5);
  const [frameCount, setFrameCount] = useState<number>(0);

  const [playControllerState, setPlayControllerState] =
    useState<PlayControllerState>(PlayControllerState.INITIALIZED);
  const [isResettable, setIsResettable] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(true);
  const [isStepped, setIsStepped] = useState<boolean>(true);
  const [isPlayed, setIsPlayed] = useState<boolean>(false);

  const [gridSize, setGridSize] = useState(props.gridSize);
  const [tolerance, setTolerance] = useState<number>(props.tolerance || 0.5);
  const [agentTypeCumulativeShares, setAgentTypeCumulativeShares] = useState<
    number[]
  >(cumulativeSum(props.agentTypeShares));

  const updateInitialStateGridData = useCallback(() => {
    setFrameCount(() => 0);
    // kernelRef.current.setGridSize(gridSize);
    kernelRef.current.updateInitialStateGridData(
      reverseCumulativeSum(agentTypeCumulativeShares),
      agentTypeCumulativeShares,
    );
  }, []);

  const updateGridSize = useCallback((gridSize: number) => {
    kernelRef.current.setGridSize(gridSize);
    updateInitialStateGridData();

    gridHandlesRefs.forEach((ref) => {
      ref.current?.refreshData(0);
      ref.current?.refreshViewportState(0);
    });
  }, []);

  const updateAgentTypeShares = useCallback(
    (agentTypeShares: number[], agentTypeCumulativeShares: number[]) => {
      kernelRef.current.updateInitialStateGridData(
        agentTypeShares,
        agentTypeCumulativeShares,
      );
      setFrameCount(() => 0);

      gridHandlesRefs.forEach((ref) => {
        ref.current?.refreshData(0);
        ref.current?.refreshViewportState(0);
      });
    },
    [],
  );

  const updateTolerance = useCallback((value: number) => {
    kernelRef.current.setTolerance(value);
  }, []);

  const onGridSizeChange = useCallback(
    (_: Event | SyntheticEvent, newValue: number | number[]) => {
      const newGridSize = newValue as number;
      setGridSize(() => newGridSize);
      setIsPlayed(() => false);
      updateGridSize(newGridSize);
    },
    [agentTypeCumulativeShares, tolerance],
  );

  const onGridSizeChangeTransient = useCallback(
    (event: Event | SyntheticEvent, newValue: number | number[]) => {
      setPlayControllerState(() => PlayControllerState.INITIALIZING);
      onGridSizeChange(event, newValue);
    },
    [agentTypeCumulativeShares, tolerance],
  );

  const onGridSizeChangeCommit = useCallback(
    (event: Event | SyntheticEvent, newValue: number | number[]) => {
      setPlayControllerState(PlayControllerState.INITIALIZED);
      onGridSizeChange(event, newValue);
    },
    [agentTypeCumulativeShares, tolerance],
  );

  const onAgentTypeCumulativeSharesChange = useCallback(
    (values: number[]) => {
      setAgentTypeCumulativeShares(() => values);
      setIsPlayed(() => false);
      setPlayControllerState(PlayControllerState.INITIALIZED);
      updateAgentTypeShares(reverseCumulativeSum(values), values);
    },
    [gridSize, tolerance],
  );

  const onToleranceChange = useCallback(
    (_: Event, newValue: number | number[]) => {
      const value = newValue as number;
      setTolerance(() => value);
      updateTolerance(value);
    },
    [],
  );

  const _updateFrame = async (): Promise<boolean> => {
    /*
    count % 100 === 0 &&
      console.log(
        props.mode === SchellingSegregationModes.CPU
          ? '@'
          : props.mode === SchellingSegregationModes.GPU
          ? '#'
          : '##',
        props.mode,
        new Date()
      );
     */
    await kernelRef.current.updateGridData();
    // count % 500 === 0 && console.log('*', state.current.gridData);

    gridHandlesRefs?.forEach((ref, index) => {
      ref.current?.refreshData(index);
    });

    return props.iterations ? frameCount < props.iterations : true;
  };

  const updateFrame = async () => {
    if (
      playControllerState === PlayControllerState.PAUSED ||
      playControllerState === PlayControllerState.INITIALIZED
    ) {
      return;
    }

    const isContinued = frameCount == 0 || (await _updateFrame());

    if (
      isContinued &&
      (playControllerState === PlayControllerState.RUNNING ||
        playControllerState === PlayControllerState.STEP_RUNNING)
    ) {
      setFrameCount(() => frameCount + 1);
      if (playControllerState === PlayControllerState.STEP_RUNNING) {
        setPlayControllerState(PlayControllerState.PAUSED);
      }
    } else {
      onPause();
    }
  };

  useEffect(() => {
    if (
      !frameRef.current &&
      (playControllerState === PlayControllerState.RUNNING ||
        playControllerState === PlayControllerState.STEP_RUNNING)
    ) {
      const delay = Math.pow(1.0 - speed, 2) * 1000;
      setTimeout(
        () => (frameRef.current = requestAnimationFrame(updateFrame)),
        delay,
      );
      frameRef.current = null;
    }

    return () => {
      frameRef.current && cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [
    //gridSize,
    //agentTypeCumulativeShares,
    playControllerState,
    frameCount,
    /*
    isPlayed,
    isStepped,
    isPaused,
     */
  ]);

  const onSpeedChange = (value: number) => {
    setSpeed(value);
  };

  const onReset = () => {
    setIsResettable(() => false);
    setIsPaused(() => true);
    setIsStepped(() => true);
    setIsPlayed(() => false);
    updateGridSize(gridSize);
    // updateInitialStateGridData();
    setPlayControllerState(() => PlayControllerState.INITIALIZED);
  };

  const onPause = () => {
    setIsPlayed(() => false);
    setIsStepped(() => true);
    setIsPaused(() => true);
    setPlayControllerState(PlayControllerState.PAUSED);
    setIsResettable(() => true);
  };

  const onPlayOrStep = () => {
    if (frameCount === 0) {
      shuffleGridData(kernelRef.current.getModel().gridData);
      kernelRef.current.getModel().emptyCellIndices = findEmptyCells(
        kernelRef.current.getModel().gridData,
      );

      kernelRef.current.sync();

      gridHandlesRefs.forEach((ref) => {
        ref.current?.refreshData(0);
      });
    }
  };

  const onStep = () => {
    setIsPaused(() => true);
    setIsStepped(() => true);
    setIsPlayed(() => false);
    setPlayControllerState(PlayControllerState.STEP_RUNNING);
    setIsResettable(() => true);
    onPlayOrStep();
  };

  const onPlay = () => {
    setIsPaused(() => false);
    setIsStepped(() => false);
    setIsPlayed(() => true);
    setPlayControllerState(PlayControllerState.RUNNING);
    setIsResettable(() => false);
    onPlayOrStep();
  };

  const getOnFocusedStateChange = useCallback(() => {
    return (sourceIndex: number, columnIndex: number, rowIndex: number) => {
      gridHandlesRefs
        .filter((_, index) => index !== 0)
        .forEach((ref) =>
          ref.current?.refreshFocusedState(sourceIndex, columnIndex, rowIndex),
        );
    };
  }, []);

  const getOnSelectedStateChange = useCallback(
    () => (sourceIndex: number, columnIndex: number, rowIndex: number) => {
      gridHandlesRefs
        .filter((_, index) => index !== 0)
        .forEach((ref) =>
          ref.current?.refreshSelectedState(sourceIndex, columnIndex, rowIndex),
        );
    },
    [],
  );

  const getOnViewportStateChange = useCallback(
    () => (sourceIndex: number) => {
      gridHandlesRefs
        .filter((_, index) => index !== 0)
        .forEach((ref) => ref.current?.refreshViewportState(sourceIndex));
    },
    [],
  );

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
            value={gridSize}
            min={8}
            max={512}
            step={null}
            marks={[
              {
                value: 8,
                label: '8',
              },
              {
                value: 16,
                label: '',
              },
              {
                value: 32,
                label: '',
              },
              {
                value: 64,
                label: '64',
              },
              {
                value: 128,
                label: '128',
              },
              {
                value: 256,
                label: '256',
              },
              {
                value: 512,
                label: '512',
              },
            ]}
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
          speed={0.5}
          isResettable={isResettable}
          isPaused={isPaused}
          isStepped={isStepped}
          isPlayed={isPlayed}
          onReset={onReset}
          onPause={onPause}
          onStep={onStep}
          onPlay={onPlay}
          onSpeedChange={onSpeedChange}
          frameCount={frameCount}
        />
      </Box>

      <Box style={{ display: 'flex', columnGap: '18px', padding: '16px' }}>
        <SentimentVeryDissatisfied />
        <Slider
          aria-label="tolerance"
          min={0}
          max={1.0}
          step={null}
          marks={[0, 1, 2, 3, 4, 5, 6, 7, 8].map((value) => ({
            value: value / 8,
            label: `${value} / 8`,
          }))}
          value={tolerance}
          onChange={onToleranceChange}
          valueLabelDisplay="auto"
        />
      </Box>

      {!kernelRef.current ||
      playControllerState === PlayControllerState.INITIALIZING ? (
        <Box
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            display: 'flex',
            width: props.canvasSize.width + 'px',
            height: props.canvasSize.height + 'px',
          }}
        >
          <CircularProgress
            size="64px"
            style={{
              margin: 'auto',
            }}
          />
        </Box>
      ) : (
        <>
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
            data={kernelRef.current.getModel().gridData}
            focusedStates={kernelRef.current.getModel().focusedStates}
            selectedStates={kernelRef.current.getModel().selectedStates}
            viewportStates={kernelRef.current.getModel().viewportStates}
            onFocusedStateChange={getOnFocusedStateChange}
            onSelectedStateChange={getOnSelectedStateChange}
            onViewportStateChange={getOnViewportStateChange}
          />
        </>
      )}
    </>
  );
}
