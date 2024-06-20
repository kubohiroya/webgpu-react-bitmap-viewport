import { Grid } from "../../src/components/grid/Grid";

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

export const Grid1024 = () => {
  return (
    <Grid
      canvasId={'example'}
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
        console.log('focus', {sourceId, columnIndex, rowIndex});
      }}
      onSelectedStatesChange={(sourceId: string, columnIndex: number, rowIndex: number) => {
        console.log('select', {sourceId, columnIndex, rowIndex});
      }}
      initialViewport={{
        top: 0.0,
        bottom: 16.0,
        left: 0.0,
        right: 16.0,
      }}
    />
  );

}