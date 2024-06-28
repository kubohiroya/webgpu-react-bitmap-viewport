import { GridShaderMode } from "webgpu-react-grid";
import { GridGroup } from "./GridGroup";

type HueGridExampleProps = {
  gridSize: {
    numColumns: number;
    numRows:number;
  },
  canvasSizes: {
    width: number;
    height: number;
  }[];
}

export const HueGridExample = (props: HueGridExampleProps) => {

  function createHueRandomGridData(numRows: number, numColumns: number, noiseFactor: number = 0) {
    const data = new Float32Array(numRows * numColumns);
    for (let i = 0; i < data.length; i++) {
      if (Math.random() < noiseFactor) {
        data[i] = Infinity;
      } else {
        data[i] = i / data.length;
      }
    }
    return data;
  }

  const gridSizeMax: number = Math.max(props.gridSize.numColumns, props.gridSize.numRows);
  const data: Float32Array = createHueRandomGridData(props.gridSize.numRows, props.gridSize.numColumns, 0.1);
  const focusedStates: Uint32Array = new Uint32Array(gridSizeMax);
  const selectedStates: Uint32Array = new Uint32Array(gridSizeMax);

  const viewportStates: Float32Array = new Float32Array([
    0.0, 0.0, 200.0, 200.0, // viewport index 0: left, top, right, bottom
    55.0, 55.0, 90.0, 90.0, // viewport index 1: left, top, right, bottom
    64.0, 64.0, 80.0, 80.0 // viewport index 2: left, top, right, bottom
  ]);

  return <GridGroup
    mode={GridShaderMode.HUE}
    gridSize={props.gridSize}
    headerOffset={{ left: 20, top: 20 }}
    scrollBar={{
      radius: 5.0,
      margin: 2.0,
    }}
    canvasSizes={props.canvasSizes}
    data={data}
    focusedStates={focusedStates}
    selectedStates={selectedStates}
    viewportStates={viewportStates}
  />;
};