import { GridShaderMode } from 'webgpu-react-bitmap-viewport';
import { GridGroup } from '../GridGroup';
import { loadImage } from './loadImage';
import React, { useEffect, useState } from 'react';

type RGBAImageGridExampleProps = {
  src: string;
  canvasSizes: {
    width: number;
    height: number;
  }[];
  headerOffset: {
    top: number;
    left: number;
  };
};

export const SynchronizedMultiStaticImage = (
  props: RGBAImageGridExampleProps,
) => {
  const [state, setState] = useState<{
    data: Uint32Array;
    width: number;
    height: number;
    numColumns: number;
    numRows: number;
    focusedStates: Uint32Array;
    selectedStates: Uint32Array;
    viewportStates: Float32Array;
  }>();

  useEffect(() => {
    (async () => {
      const { data, width, height } = await loadImage(props.src);
      const numColumns = width;
      const numRows = height;
      const gridSizeMax: number = Math.max(numColumns, numRows);
      const focusedStates: Uint32Array = new Uint32Array(gridSizeMax);
      const selectedStates: Uint32Array = new Uint32Array(gridSizeMax);
      const viewportStates: Float32Array = new Float32Array([
        //0.0,0.0,1074.0,706.0,//
        0,
        0,
        numColumns,
        numRows, //// // viewport index 0: left, top, right, bottom
        0,
        0,
        numColumns / 2,
        numRows / 2, // viewport index 1: left, top, right, bottom
        0.0,
        20.0,
        220.0,
        220.0, // viewport index 2: left, top, right, bottom
      ]);

      setState({
        data,
        width,
        height,
        numColumns,
        numRows,
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
    <>
      <GridGroup
        id={'rgba'}
        mode={GridShaderMode.RGBA}
        numColumns={state.numColumns}
        numRows={state.numRows}
        headerOffset={props.headerOffset}
        scrollBar={{
          radius: 5.0,
          margin: 2.0,
        }}
        canvasSizes={props.canvasSizes}
        data={state.data}
        focusedCellPosition={state.focusedStates}
        selectedStates={state.selectedStates}
        viewportStates={state.viewportStates}
      />
    </>
  );
};
export default SynchronizedMultiStaticImage;
