import { SegregationUIProps } from './SegregationUIProps';
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
import { Box, CircularProgress, Slider } from '@mui/material';
import { GridOn } from '@mui/icons-material';
import {
  PlayControllerPanel,
  PlayControllerState,
} from './components/PlayControllerPanel';
import { SegregationKernel } from './kernels/SegregationKernel';
import { cumulativeSum } from './utils/arrayUtil';
import { hsvToRgb } from './utils/colorUtil';

import { TolerancePanel, TolerancePanelHandle } from './TolerancePanel';
import { KeyboardModifier } from 'dist/types/src/components/grid/KeyboardModifier';
import { AgentSharePanel } from './AgentSharePanel';

const SCROLLBAR = {
  radius: 5.0,
  margin: 2.0,
};

export function SegregationUI(
  props: SegregationUIProps & {
    kernel: SegregationKernel;
  },
) {
  const locked = useRef<boolean>(false);
  const gridHandlesRefs = [useRef<GridHandles>(null)];
  const tolerancePanelRef = useRef<TolerancePanelHandle>(null);
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
          kernelRef.current.setGridContent(grid);
          tolerancePanelRef.current!.update(0);
          setPlayControllerState(PlayControllerState.INITIALIZED);
          break;
        case PlayControllerState.INITIALIZED:
          kernelRef.current.shuffleGridContent();
          kernelRef.current.updateEmptyCellIndices();
          setPlayControllerState(PlayControllerState.PAUSED);
          const newMovingAgentCount = kernelRef.current.getMovingAgentCount();
          tolerancePanelRef.current!.update(newMovingAgentCount);
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
        tolerancePanelRef.current!.update(newMovingAgentCount);

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

  const gridSizeMarks = useMemo(
    () =>
      [3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((value) => ({
        value: value,
        label: (2 ** value).toString(),
      })),
    [],
  );

  const rgbValues = useMemo(
    () => calculateRGBValues(agentTypeCumulativeShares),
    [agentTypeCumulativeShares],
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

        <AgentSharePanel
          agentTypeCumulativeShares={agentTypeCumulativeShares}
          setAgentTypeCumulativeShares={setAgentTypeCumulativeShares}
          gridSize={gridSize}
          update={update}
          rgbValues={rgbValues.rgbValues}
        />
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
        <PlayControllerPanel
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

      <TolerancePanel
        ref={tolerancePanelRef}
        grid={kernelRef.current.getGrid()}
        width={gridSize}
        height={gridSize}
        x={selectedCell[0] >= 0 ? selectedCell[0] : focusedCell[0]}
        y={selectedCell[1] >= 0 ? selectedCell[1] : focusedCell[1]}
        tolerance={tolerance}
        onToleranceChange={onToleranceChange}
        valueToRGB={rgbValues.valueToRGB}
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
              data={kernelRef.current.getGridImpl()}
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

const calculateRGBValues = (agentTypeCumulativeShares: number[]) => {
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
