import { EMPTY_VALUE, GridShaderMode } from 'webgpu-react-bitmap-viewport';
import { GridGroup } from '../GridGroup';
import React from 'react';

type HueGridExampleProps = {
  canvasSizes: {
    width: number;
    height: number;
  }[];
  headerOffset: {
    top: number;
    left: number;
  };

  numColumns: number;
  numRows: number;

  viewportStates: Float32Array;
};

export const HueGridExample = (props: HueGridExampleProps) => {
  function createHueRandomGridData(
    numRows: number,
    numColumns: number,
    noiseFactor: number = 0,
  ) {
    const data = new Float32Array(numRows * numColumns);
    for (let i = 0; i < data.length; i++) {
      if (Math.random() < noiseFactor) {
        data[i] = EMPTY_VALUE;
      } else {
        data[i] = i / data.length;
      }
    }
    return data;
  }

  const data: Float32Array = createHueRandomGridData(
    props.numRows,
    props.numColumns,
    0.1,
  );
  const focusedStates: Uint32Array = new Uint32Array([-1, -1]);
  const selectedStates: Uint32Array = new Uint32Array(
    Math.ceil((props.numColumns * props.numRows) / 32),
  );

  return (
    <GridGroup
      id={'hue-grid'}
      mode={GridShaderMode.HUE}
      numGroups={3}
      numColumns={props.numColumns}
      numRows={props.numRows}
      scrollBar={{
        radius: 5.0,
        margin: 2.0,
      }}
      canvasSizes={props.canvasSizes}
      headerOffset={props.headerOffset}
      data={data}
      focusedCellPosition={focusedStates}
      selectedStates={selectedStates}
      viewportStates={props.viewportStates}
    />
  );
};
