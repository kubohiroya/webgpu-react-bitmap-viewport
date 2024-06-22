import { Grid, GridHandles } from "webgpu-react-grid";
import { useRef } from "react";

const gridSize = { numColumns: 128, numRows: 128 };
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

const viewportStates = new Float32Array([
  0.0, 0.0, 16.0, 16.0,
  8.0, 8.0, 24.0, 24.0,
]);

export const GridExample = () => {
  const gridRefs =
    [
      useRef<GridHandles>(null),
      useRef<GridHandles>(null)
    ];

  return (
    <>
      <Grid
        index={0}
        ref={gridRefs[0]}
        numViewports={2}
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
        viewportStates={viewportStates}
        onFocusedStatesChange={(sourceIndex: number, columnIndex: number, rowIndex: number) => {
          gridRefs[1].current?.updateFocusedState(sourceIndex, columnIndex, rowIndex);
        }}
        onSelectedStatesChange={(sourceIndex:number, columnIndex: number, rowIndex: number) => {
          gridRefs[1].current?.updateSelectedState(sourceIndex, columnIndex, rowIndex);
        }}
        onViewportStateChange={(sourceIndex: number) => {
          gridRefs[1].current?.refreshViewportState(sourceIndex);
        }}
      />
      <Grid
        index={1}
        ref={gridRefs[1]}
        numViewports={2}
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
        viewportStates={viewportStates}
        onFocusedStatesChange={(sourceIndex: number, columnIndex: number, rowIndex: number) => {
          gridRefs[0].current?.updateFocusedState(sourceIndex, columnIndex, rowIndex);
        }}
        onSelectedStatesChange={(sourceIndex: number, columnIndex: number, rowIndex: number) => {
          gridRefs[0].current?.updateSelectedState(sourceIndex, columnIndex, rowIndex);
        }}
        onViewportStateChange={(sourceIndex: number) => {
          gridRefs[0].current?.refreshViewportState(sourceIndex);
        }}
      />
    </>
  );
}
