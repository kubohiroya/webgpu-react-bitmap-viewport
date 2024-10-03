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
import { cumulativeSum } from '../utils/arrayUtils';
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

  const [playControllerState, setPlayControllerState] =
    useState<PlayControllerState>(PlayControllerState.INITIALIZING);

  const [gridSize, setGridSize] = useState(props.gridSize);
  const [tolerance, setTolerance] = useState<number>(props.tolerance || 0.5);
  const [agentTypeCumulativeShares, setAgentTypeCumulativeShares] = useState<
    number[]
  >(cumulativeSum(props.agentTypeShares));

  const updateFrameCount = useCallback((frameCount: number) => {
    kernelRef.current.getModel().setFrameCount(frameCount);
  }, []);

  const updateGridData = useCallback(
    async (
      playControllerState?: PlayControllerState,
      _gridSize?: number,
      _agentTypeCumulativeShares?: number[],
    ) => {
      switch (playControllerState) {
        case PlayControllerState.INITIALIZING:
          kernelRef.current.updatePrimaryStateGridData(
            _gridSize || gridSize,
            _agentTypeCumulativeShares || agentTypeCumulativeShares,
          );
          setPlayControllerState(PlayControllerState.INITIALIZED);
          break;
        case PlayControllerState.INITIALIZED:
          kernelRef.current.updateSecondaryStateGridData();
          break;
        case PlayControllerState.RUNNING:
        case PlayControllerState.STEP_RUNNING:
          await kernelRef.current.updateGridData();
          break;
      }
      gridHandlesRefs.forEach((ref) => {
        ref.current?.refreshData(0);
        ref.current?.refreshViewportState(0);
      });
    },
    [gridSize, agentTypeCumulativeShares],
  );

  const updateTolerance = useCallback((value: number) => {
    kernelRef.current.setTolerance(value);
  }, []);

  const onGridSizeChangeTransient = useCallback(
    (_: Event | SyntheticEvent, newValue: number | number[]) => {
      setPlayControllerState(PlayControllerState.INITIALIZING);
      const newGridSize = newValue as number;
      setGridSize(newGridSize);
    },
    [],
  );

  const onGridSizeChangeCommit = useCallback(
    (_: Event | SyntheticEvent, newValue: number | number[]) => {
      const newGridSize = newValue as number;
      setGridSize(newGridSize);
      updateGridData(
        PlayControllerState.INITIALIZING,
        newGridSize,
        agentTypeCumulativeShares,
      );
    },
    [updateGridData, agentTypeCumulativeShares],
  );

  const onAgentTypeCumulativeSharesChange = useCallback(
    (values: number[]) => {
      const newAgentTypeCumulativeShares = values;
      setAgentTypeCumulativeShares(newAgentTypeCumulativeShares);
      updateGridData(
        PlayControllerState.INITIALIZING,
        gridSize,
        newAgentTypeCumulativeShares,
      );
    },
    [updateGridData, gridSize],
  );

  const onToleranceChange = useCallback(
    (_: Event, newValue: number | number[]) => {
      const value = newValue as number;
      setTolerance(value);
      updateTolerance(value);
    },
    [updateTolerance],
  );

  const updateFrame = useCallback(async (): Promise<void> => {
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
    await updateGridData(
      playControllerState,
      gridSize,
      agentTypeCumulativeShares,
    );
    // count % 500 === 0 && console.log('*', state.current.gridData);

    gridHandlesRefs?.forEach((ref, index) => {
      ref.current?.refreshData(index);
    });
  }, [playControllerState]);

  const tick = useCallback(() => {
    if (playControllerState === PlayControllerState.PAUSED) {
      return;
    }
    if (
      playControllerState === PlayControllerState.INITIALIZED ||
      playControllerState === PlayControllerState.RUNNING ||
      playControllerState === PlayControllerState.STEP_RUNNING
    ) {
      frameRef.current = requestAnimationFrame(updateFrame);
      if (playControllerState === PlayControllerState.STEP_RUNNING) {
        onPause();
      }
    }
  }, [playControllerState]);

  const onReset = useCallback(() => {
    updateGridData(
      PlayControllerState.INITIALIZING,
      gridSize,
      agentTypeCumulativeShares,
    );
  }, [gridSize, agentTypeCumulativeShares]);

  const onPause = useCallback(() => {
    setPlayControllerState(PlayControllerState.PAUSED);
  }, []);

  const onStep = useCallback(() => {
    setPlayControllerState(PlayControllerState.STEP_RUNNING);
    updateGridData();
    tick();
  }, [tick]);

  const onPlay = useCallback(() => {
    if (playControllerState == PlayControllerState.INITIALIZED) {
      updateGridData(
        PlayControllerState.INITIALIZED,
        gridSize,
        agentTypeCumulativeShares,
      );
    }
    setPlayControllerState(PlayControllerState.RUNNING);
  }, [playControllerState]);

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

  useEffect(() => {
    if (props.autoStart) {
      (async () => {
        await updateGridData(
          PlayControllerState.INITIALIZING,
          gridSize,
          agentTypeCumulativeShares,
        );
        await updateGridData(
          PlayControllerState.INITIALIZED,
          gridSize,
          agentTypeCumulativeShares,
        );
        setPlayControllerState(PlayControllerState.RUNNING);
      })();
    } else {
      updateGridData(
        PlayControllerState.INITIALIZING,
        gridSize,
        agentTypeCumulativeShares,
      );
    }
  }, []);

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
                value: 192,
                label: '192',
              },
              {
                value: 256,
                label: '256',
              },
              {
                value: 320,
                label: '320',
              },
              {
                value: 384,
                label: '384',
              },
              {
                value: 448,
                label: '438',
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
              data={kernelRef.current.getModel().gridData}
              focusedStates={kernelRef.current.getModel().focusedStates}
              selectedStates={kernelRef.current.getModel().selectedStates}
              viewportStates={kernelRef.current.getModel().viewportStates}
              onFocusedStateChange={getOnFocusedStateChange}
              onSelectedStateChange={getOnSelectedStateChange}
              onViewportStateChange={getOnViewportStateChange}
            />
          )}
        </Box>
      </Box>
    </>
  );
}
