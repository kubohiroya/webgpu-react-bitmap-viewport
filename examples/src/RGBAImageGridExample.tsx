import { GridShaderMode } from 'webgpu-react-grid';
import { GridGroup } from './GridGroup';
import { loadImage } from './loadImage';
import { useEffect, useState } from 'react';

type RGBAImageGridExample = {
  src: string;
  canvasSizes: {
    width: number;
    height: number;
  }[];
  headerOffset: {
    top: number;
    left: number;
  }
};

export const RGBAImageGridExample = (props: RGBAImageGridExample) => {
  const [state, setState] = useState<{
    data: Uint32Array;
    width: number;
    height: number;
    gridSize: {
      numColumns: number;
      numRows: number;
    };
    focusedStates: Uint32Array;
    selectedStates: Uint32Array;
    viewportStates: Float32Array;
  }>();

  useEffect(() => {
    (async () => {
      const { data, width, height } = await loadImage(props.src);
      const gridSize = { numColumns: width, numRows: height };
      const gridSizeMax: number = Math.max(
        gridSize.numColumns,
        gridSize.numRows
      );
      const focusedStates: Uint32Array = new Uint32Array(gridSizeMax);
      const selectedStates: Uint32Array = new Uint32Array(gridSizeMax);
      const viewportStates: Float32Array = new Float32Array([
        //0.0,0.0,1074.0,706.0,//
        0,0,gridSize.numColumns,gridSize.numRows,//// // viewport index 0: left, top, right, bottom
        55.0,
        55.0,
        90.0,
        90.0, // viewport index 1: left, top, right, bottom
        0.0,
        20.0,
        420.0,
        220.0, // viewport index 2: left, top, right, bottom
      ]);

      setState({
        data,
        width,
        height,
        gridSize,
        focusedStates,
        selectedStates,
        viewportStates,
      });
    })();
  }, [props.src]);

  if (!state) {
    return null;
  }

  return (
    <GridGroup
      mode={GridShaderMode.RGBA}
      gridSize={state.gridSize}
      headerOffset={props.headerOffset}
      scrollBar={{
        radius: 5.0,
        margin: 2.0,
      }}
      canvasSizes={props.canvasSizes}
      data={state.data}
      focusedStates={state.focusedStates}
      selectedStates={state.selectedStates}
      viewportStates={state.viewportStates}
    />
  );
};
