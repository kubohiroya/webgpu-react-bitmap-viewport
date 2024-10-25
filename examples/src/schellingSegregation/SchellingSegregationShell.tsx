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
  const gridHandlesRefs = [useRef<GridHandles>(null)];
  const kernelRef = useRef<SchellingSegregationKernel>(props.kernel);

  const [playControllerState, setPlayControllerState] =
    useState<PlayControllerState>(PlayControllerState.INITIALIZING);

  const [gridSize, setGridSize] = useState(props.gridSize);

  const [tolerance, setTolerance] = useState<number>(
    props.tolerance !== undefined ? props.tolerance : 0.5,
  );
  const [agentTypeCumulativeShares, setAgentTypeCumulativeShares] = useState<
    number[]
  >(cumulativeSum(props.agentTypeShares));

  const updateFrameCount = useCallback((frameCount: number) => {
    kernelRef.current.getModel().setFrameCount(frameCount);
  }, []);

  const updateGridData = useCallback(
    async (
      playControllerState: PlayControllerState,
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
          setPlayControllerState(PlayControllerState.PAUSED);
          kernelRef.current.updateEmptyCellIndices();
          break;
        case PlayControllerState.RUNNING:
          await kernelRef.current.updateGridData();
          break;
        case PlayControllerState.STEP_RUNNING:
          await kernelRef.current.updateGridData();
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
      setGridSize(newGridSizeSource);
    },
    [],
  );

  const onGridSizeChangeCommit = useCallback(
    (_: Event | SyntheticEvent, newValueSource: number | number[]) => {
      const newGridSizeSource = newValueSource as number;
      setGridSize(newGridSizeSource);
      updateGridData(
        PlayControllerState.INITIALIZING,
        newGridSizeSource,
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

  const tick = useCallback(async () => {
    if (playControllerState === PlayControllerState.PAUSED) {
      return false;
    }
    if (
      playControllerState === PlayControllerState.INITIALIZED ||
      playControllerState === PlayControllerState.RUNNING ||
      playControllerState === PlayControllerState.STEP_RUNNING
    ) {
      await updateGridData(
        playControllerState,
        gridSize,
        agentTypeCumulativeShares,
      );
      gridHandlesRefs?.forEach((ref, index) => {
        ref.current?.refreshData(index);
      });
      if (playControllerState === PlayControllerState.STEP_RUNNING) {
        onPause();
      }
      return true;
    } else {
      return false;
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

  const onStep = useCallback(async () => {
    switch (playControllerState) {
      case PlayControllerState.INITIALIZED:
        await updateGridData(
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
      await updateGridData(
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
    (async () => {
      await updateGridData(
        PlayControllerState.INITIALIZING,
        gridSize,
        agentTypeCumulativeShares,
      );
      if (props.autoStart) {
        await updateGridData(
          PlayControllerState.INITIALIZED,
          gridSize,
          agentTypeCumulativeShares,
        );
        setPlayControllerState(PlayControllerState.RUNNING);
      }
    })();
  }, []);

  /*
  function calculateValue(value: number) {
    return 2 ** value;
  }*/

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
            min={2}
            max={1024}
            step={1}
            marks={[
              {
                value: 2,
                label: '2',
              },
              {
                value: 4,
                label: '4',
              },
              {
                value: 8,
                label: '8',
              },
              {
                value: 16,
                label: '16',
              },
              {
                value: 32,
                label: '32',
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
              {
                value: 1024,
                label: '1024',
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
              data={kernelRef.current.getModel().grid}
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
