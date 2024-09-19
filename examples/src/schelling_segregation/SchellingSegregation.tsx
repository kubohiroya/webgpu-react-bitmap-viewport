import {
  EMPTY_VALUE,
  Grid,
  GridHandles,
  GridShaderMode,
} from 'webgpu-react-grid';
import { useEffect, useRef } from 'react';
import SchellingModelGPURunner from './SchellingModelGPURunner';
import { SchellingModelCPURunner } from './SchellingModelCPURunner';

export enum SchellingSegregationModes {
  'CPU' = 'CPU',
  'GPU' = 'GPU',
  'GPU_PARALLEL' = 'GPU_PARALLEL',
}

const ITERATIONS_DEFAULT = 10000;

type SchellingSegregationModelProps = {
  mode: SchellingSegregationModes;
  canvasSize: {
    width: number;
    height: number;
  };
  headerOffset: {
    top: number;
    left: number;
  };
  gridSize: {
    numColumns: number;
    numRows: number;
  };
  density: number;
  shares: number[];
  values: number[];
  tolerance: number;
  iterations?: number;
};

type SchellingSegregationModel = {
  gridData: Uint32Array;
  emptyGridIndicesIndices: Uint32Array;
  focusedStates: Uint32Array;
  selectedStates: Uint32Array;
  viewportStates: Float32Array;
};

export default function SchellingSegregation(
  props: SchellingSegregationModelProps
) {
  const frameRef = useRef<number | null>(null);
  const gridHandlesRefs = [useRef<GridHandles>(null)];

  function createGridModel(): SchellingSegregationModel {
    function createRandomizedNumbers(): Uint32Array {
      const { density, shares, values } = props;
      const size = props.gridSize.numColumns * props.gridSize.numRows;

      const valueCounts = shares.map((share) =>
        Math.floor(size * density * share)
      );

      // 配列の長さと密度を基に0を配置する個数
      const zeroCount = size - valueCounts.reduce((a, b) => a + b, 0);

      let result = Array(zeroCount).fill(EMPTY_VALUE);

      // 各valueに対応する個数を挿入
      values.forEach((value, index) => {
        result = result.concat(Array(valueCounts[index]).fill(value));
      });

      // シャッフル関数 (Fisher–Yates shuffle)
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }

      return new Uint32Array(result);
    }

    function findZeroIndices(inputArray: Uint32Array): Uint32Array {
      // 0の値を持つインデックスを一時的に保存するための配列
      const zeroIndices: number[] = [];

      // 配列をループし、EMPTY_VALUEの要素のインデックスを収集
      for (let i = 0; i < inputArray.length; i++) {
        if (inputArray[i] === EMPTY_VALUE) {
          zeroIndices.push(i);
        }
      }
      // Uint32Arrayに変換して返す
      return new Uint32Array(zeroIndices);
    }

    function createInitialGridData(): Uint32Array {
      return createRandomizedNumbers();
    }

    const { width, height } = {
      width: props.gridSize.numColumns,
      height: props.gridSize.numRows,
    };

    const gridSize = { numColumns: width, numRows: height };
    const gridSizeMax: number = Math.max(gridSize.numColumns, gridSize.numRows);

    const gridData = createInitialGridData();
    const zeroIndices = findZeroIndices(gridData);

    return {
      gridData,
      emptyGridIndicesIndices: zeroIndices,
      focusedStates: new Uint32Array(gridSizeMax),
      selectedStates: new Uint32Array(gridSizeMax),
      viewportStates: new Float32Array([
        0,
        0,
        gridSize.numColumns,
        gridSize.numRows,
      ]),
    };
  }

  const state = useRef<SchellingSegregationModel>(createGridModel());

  const engine = useRef<{
    gpu?: () => Promise<Uint32Array>;
    cpu?: () => Promise<Uint32Array>;
  }>({});

  useEffect(() => {
    (async () => {
      if (!navigator.gpu) {
        console.error('WebGPU is not supported');
        return;
      }
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        console.error('WebGPU is not supported');
        return;
      }

      engine.current.gpu = await SchellingModelGPURunner({
        device: await adapter.requestDevice(),
        gridWidth: props.gridSize.numColumns,
        gridHeight: props.gridSize.numRows,
        gridData: state.current.gridData,
        tolerance: props.tolerance,
        parallel: props.mode === SchellingSegregationModes.GPU_PARALLEL,
      });

      engine.current.cpu = await SchellingModelCPURunner(
        {
          numRows: props.gridSize.numRows,
          numColumns: props.gridSize.numColumns,
        },
        props.tolerance,
        state.current.gridData,
        state.current.emptyGridIndicesIndices
      );

      let count = 0;

      const update = async (): Promise<boolean> => {
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

        if (
          engine.current.cpu &&
          props.mode === SchellingSegregationModes.CPU
        ) {
          state.current.gridData.set(await engine.current.cpu());
          // console.log('<1>', state.current.gridData);
        } else if (
          engine.current.gpu &&
          (props.mode === SchellingSegregationModes.GPU ||
            props.mode === SchellingSegregationModes.GPU_PARALLEL)
        ) {
          state.current.gridData.set(await engine.current.gpu());
        } else {
          // console.log('else', engine.current.cpu, engine.current.gpu);
        }
        //count % 500 === 0 && console.log('*', state.current.gridData);
        count++;

        gridHandlesRefs?.forEach((ref, index) => {
          ref.current?.refreshData(index);
        });

        return count < (props.iterations || ITERATIONS_DEFAULT);
      };

      const loop = async () => {
        const isContinued = await update();
        if (isContinued) {
          frameRef.current = requestAnimationFrame(loop);
        }
      };

      frameRef.current = requestAnimationFrame(loop);
    })();

    return () => {
      console.log('cancelAnimationFrame');
      frameRef.current && cancelAnimationFrame(frameRef.current);
    };
  }, []);

  if (!state.current) {
    return null;
  }

  return (
    <Grid
      ref={gridHandlesRefs[0]}
      numViewports={1}
      viewportIndex={0}
      mode={GridShaderMode.CUSTOM}
      gridSize={props.gridSize}
      headerOffset={props.headerOffset}
      scrollBar={{
        radius: 5.0,
        margin: 2.0,
      }}
      canvasSize={props.canvasSize}
      data={state.current.gridData}
      focusedStates={state.current.focusedStates}
      selectedStates={state.current.selectedStates}
      viewportStates={state.current.viewportStates}
      onFocusedStateChange={(
        sourceIndex: number,
        columnIndex: number,
        rowIndex: number
      ) => {
        gridHandlesRefs
          .filter((ref, index) => index !== 0)
          .forEach((ref) =>
            ref.current?.refreshFocusedState(sourceIndex, columnIndex, rowIndex)
          );
      }}
      onSelectedStateChange={(
        sourceIndex: number,
        columnIndex: number,
        rowIndex: number
      ) => {
        gridHandlesRefs
          .filter((ref, index) => index !== 0)
          .forEach((ref) =>
            ref.current?.refreshSelectedState(
              sourceIndex,
              columnIndex,
              rowIndex
            )
          );
      }}
      onViewportStateChange={(sourceIndex: number) => {
        gridHandlesRefs
          .filter((ref, index) => index !== 0)
          .forEach((ref) => ref.current?.refreshViewportState(sourceIndex));
      }}
    />
  );
}
