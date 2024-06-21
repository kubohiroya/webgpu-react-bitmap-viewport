import { useRef } from "react";
import { Grid, GridHandles } from "webgpu-react-grid";

const gridSize = { numColumns: 1024, numRows: 1024 };
const gridSizeMax = Math.max(gridSize.numColumns, gridSize.numRows);

const data =  new Float32Array(gridSize.numRows * gridSize.numColumns);
for (let i = 0; i < data.length; i++) {
  if (Math.random() < 0.99) {
    data[i] = i / data.length;
  } else {
    data[i] = Infinity;
  }
}

const focusedStates = new Uint8Array(gridSizeMax);
const selectedStates = new Uint8Array(gridSizeMax);

const GRID_ID_1 = 'example1';
const GRID_ID_2 = 'example2';

export const GridExample = () => {
  const gridRef1 = useRef<GridHandles>(null);
  const gridRef2 = useRef<GridHandles>(null);
  return (
    <>
      <Grid
        ref={gridRef1}
        canvasId={GRID_ID_1}
        headerOffset={{ left: 28, top: 28 }}
        canvasSize={{ width: 512, height: 512 }}
        scrollBar={{
          radius: 5.0,
          margin: 2.0,
        }}
        gridSize={gridSize}
        data={data}
        focusedStates={focusedStates}
        selectedStates={selectedStates}
        onFocusedStatesChange={(sourceId: string, columnIndex: number, rowIndex: number) => {
          gridRef2.current?.updateFocusedState(sourceId, columnIndex, rowIndex);
        }}
        onSelectedStatesChange={(sourceId: string, columnIndex: number, rowIndex: number) => {
          gridRef2.current?.updateSelectedState(sourceId, columnIndex, rowIndex);
        }}
        initialViewport={{
          top: 0.0,
          bottom: 16.0,
          left: 0.0,
          right: 16.0,
        }}
      />
      <Grid
        canvasId={GRID_ID_2}
        ref={gridRef2}
        headerOffset={{ left: 28, top: 28 }}
        canvasSize={{ width: 512, height: 512 }}
        scrollBar={{
          radius: 5.0,
          margin: 2.0,
        }}
        gridSize={gridSize}
        data={data}
        focusedStates={focusedStates}
        selectedStates={selectedStates}
        onFocusedStatesChange={(sourceId: string, columnIndex: number, rowIndex: number) => {
          gridRef1.current?.updateFocusedState(sourceId, columnIndex, rowIndex);
        }}
        onSelectedStatesChange={(sourceId: string, columnIndex: number, rowIndex: number) => {
          gridRef1.current?.updateSelectedState(sourceId, columnIndex, rowIndex);
        }}
        initialViewport={{
          top: 0.0,
          bottom: 24.0,
          left: 0.0,
          right: 24.0,
        }}
      />
    </>
  );
}
