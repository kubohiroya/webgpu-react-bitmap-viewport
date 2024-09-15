import { Grid, GridHandles, GridShaderMode } from 'webgpu-react-grid';
import { useRef } from 'react';

type GridGroupProps = {
  mode: GridShaderMode;
  gridSize: {
    numColumns: number;
    numRows: number;
  };
  headerOffset: {
    top: number;
    left: number;
  };
  scrollBar: {
    margin: number;
    radius: number;
  };
  canvasSizes: {
    width: number;
    height: number;
  }[];
  data: Float32Array | Uint32Array;
  focusedStates: Uint32Array;
  selectedStates: Uint32Array;
  viewportStates: Float32Array;
};

export const GridGroup = (props: GridGroupProps) => {
  const gridRefs = [
    useRef<GridHandles>(null),
    useRef<GridHandles>(null),
    useRef<GridHandles>(null),
  ];

  return gridRefs.map((ref, _index) => (
    <Grid
      key={_index}
      mode={props.mode}
      viewportIndex={_index}
      ref={ref}
      numViewports={gridRefs.length}
      canvasSize={props.canvasSizes[_index]}
      headerOffset={props.headerOffset}
      scrollBar={props.scrollBar}
      gridSize={props.gridSize}
      data={props.data}
      focusedStates={props.focusedStates}
      selectedStates={props.selectedStates}
      viewportStates={props.viewportStates}
      onFocusedStateChange={(
        sourceIndex: number,
        columnIndex: number,
        rowIndex: number
      ) => {
        gridRefs
          .filter((ref, index) => index !== _index)
          .forEach((ref) =>
            ref.current?.refreshFocusedState(sourceIndex, columnIndex, rowIndex)
          );
      }}
      onSelectedStateChange={(
        sourceIndex: number,
        columnIndex: number,
        rowIndex: number
      ) => {
        gridRefs
          .filter((ref, index) => index !== _index)
          .forEach((ref) =>
            ref.current?.refreshSelectedState(
              sourceIndex,
              columnIndex,
              rowIndex
            )
          );
      }}
      onViewportStateChange={(sourceIndex: number) => {
        gridRefs
          .filter((ref, index) => index !== _index)
          .forEach((ref) => ref.current?.refreshViewportState(sourceIndex));
      }}
    />
  ));
};
