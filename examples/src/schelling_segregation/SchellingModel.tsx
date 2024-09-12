import { Grid, GridHandles, GridShaderMode } from "webgpu-react-grid";
import { useEffect, useRef, useState } from "react";

type SchellingModelProps = {
  canvasSize: {
    width: number;
    height: number;
  },
  headerOffset: {
    top: number,
    left: number,
  },
  gridSize: {
    numColumns: number;
    numRows:number;
  },
  density: number,
  shares: number[],
  values: number[],
  theta: number,
}

type SchellingState = {
  data: Float32Array;
  zeroIndices: Uint32Array;
  focusedStates: Uint32Array;
  selectedStates: Uint32Array;
  viewportStates: Float32Array;
};

const NULL_VALUE = Infinity;

export default function SchellingModel(props: SchellingModelProps) {
  const [state, setState] = useState<SchellingState|null>(null);

  function createRandomizedNumbers(props: { size: number, density: number, shares: number[], values: number[] }): Float32Array {
    const { size, density, shares, values } = props;

    // 配列の長さと密度を基に0を配置する個数
    const zeroCount = Math.floor(size * (1 - density));

    // 残りの要素数に各値をsharesに従って割り当てる
    const remainingCount = size - zeroCount;
    const valueCounts = shares.map(share => Math.floor(remainingCount * share));

    // 配列に0を挿入
    let result = Array(zeroCount).fill(NULL_VALUE);

    // 各valueに対応する個数を挿入
    values.forEach((value, index) => {
      result = result.concat(Array(valueCounts[index]).fill(value));
    });

    // シャッフル関数 (Fisher–Yates shuffle)
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }

    return new Float32Array(result);
  }

  function findZeroIndices(inputArray: Float32Array): Uint32Array {
    // 0の値を持つインデックスを一時的に保存するための配列
    const zeroIndices: number[] = [];

    // 配列をループし、NULL_VALUEの要素のインデックスを収集
    for (let i = 0; i < inputArray.length; i++) {
      if (inputArray[i] === NULL_VALUE) {
        zeroIndices.push(i);
      }
    }
    // Uint32Arrayに変換して返す
    return new Uint32Array(zeroIndices);
  }


  function createInitialData(width: number, height: number, density: number, shares: number[], values: number[]): Float32Array {
    return createRandomizedNumbers({
      size: width * height,
      density,
      shares,
      values
    });
  }


  function tick(){
    if(!state){
      return;
    }
    let numMoved = 0;

    function getSurroundingIndices(
      x: number,
      y: number,
      width: number,
      height: number
    ): number[] {
      // x, y の周囲の相対的な位置
      const deltas = [
        [-1, -1], [0, -1], [1, -1],  // 上の行
        [-1,  0],          [1,  0],  // 左右
        [-1,  1], [0,  1], [1,  1],  // 下の行
      ];

      const surroundingIndices: number[] = deltas.map(([dx, dy]) => {
        // xとyの上下左右ループを考慮して、座標を計算
        const newX = (x + dx + width) % width;
        const newY = (y + dy + height) % height;
        // インデックスを計算
        return newY * width + newX;
      });

      return surroundingIndices;
    }

    for(let y = 0; y < props.gridSize.numRows; y++){
      for(let x = 0; x < props.gridSize.numColumns; x++) {
        const currentIndex = y * props.gridSize.numColumns + x;
        const ethnicGroupID = state.data[currentIndex];
        if (ethnicGroupID === NULL_VALUE) {
          continue;
        }
        const surroundingIndices = getSurroundingIndices(x, y, props.gridSize.numColumns, props.gridSize.numRows);
        const surroundingEthnicGroupIDs = surroundingIndices.map(index => state.data[index]);
        const numSurroundingPeople = surroundingEthnicGroupIDs.filter(value => value !== NULL_VALUE).length;
        const numSurroundingSameEthinicPeople = surroundingEthnicGroupIDs.filter(value => value === ethnicGroupID).length;
        const s = numSurroundingSameEthinicPeople / numSurroundingPeople;
        if(s < props.theta){
          const pos = Math.floor(Math.random() * state.zeroIndices.length);
          const zeroIndex = state.zeroIndices[pos];
          state.data[zeroIndex] = ethnicGroupID;
          state.data[currentIndex] = NULL_VALUE;
          state.zeroIndices[pos] = currentIndex;
          numMoved++;
        }
      }
    }
    if(numMoved > 0){
      // console.log('moved ', moved.length);
      //gridRefs[0].current?.refreshData(0);
      setState({...state, data: state.data, zeroIndices: state.zeroIndices});
      //setTimeout(tick, 500);
    }else{
      console.log('no one moved');
    }
  }

  useEffect(() => {

    const { width, height } = {width: props.gridSize.numColumns, height: props.gridSize.numRows};
    const gridSize = { numColumns: width, numRows: height };
    const gridSizeMax: number = Math.max(
      gridSize.numColumns,
      gridSize.numRows
    );
    const focusedStates: Uint32Array = new Uint32Array(gridSizeMax);
    const selectedStates: Uint32Array = new Uint32Array(gridSizeMax);
    const viewportStates: Float32Array = new Float32Array([
      //0.0,0.0,1074.0,706.0,//
      0, 0, gridSize.numColumns, gridSize.numRows,//// // viewport index 0: left, top, right, bottom
    ]);
    const data = createInitialData(width, height, props.density, props.shares, props.values);
    const zeroIndices = findZeroIndices(data);

    setState({
      data,
      zeroIndices,
      focusedStates,
      selectedStates,
      viewportStates,
    });

  }, [props]);

  const gridRefs =
    [
      useRef<GridHandles>(null),
    ];

  if (!state) {
    return null;
  }

  setTimeout(tick, 100);

  return (
    <Grid
      ref={gridRefs[0]}
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

      data={state.data}
      focusedStates={state.focusedStates}
      selectedStates={state.selectedStates}
      viewportStates={state.viewportStates}

      onFocusedStateChange={(sourceIndex: number, columnIndex: number, rowIndex: number) => {
        gridRefs.filter((ref, index) => index !== 0).forEach(ref => ref.current?.refreshFocusedState(sourceIndex, columnIndex, rowIndex));
      }}
      onSelectedStateChange={(sourceIndex:number, columnIndex: number, rowIndex: number) => {
        gridRefs.filter((ref, index) => index !== 0).forEach(ref => ref.current?.refreshSelectedState(sourceIndex, columnIndex, rowIndex));
      }}
      onViewportStateChange={(sourceIndex: number) => {
        gridRefs.filter((ref, index) => index !== 0).forEach(ref => ref.current?.refreshViewportState(sourceIndex));
      }}
    />
  );
}