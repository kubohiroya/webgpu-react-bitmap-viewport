import { GridShaderMode } from "webgpu-react-grid";
import { GridGroup } from "./GridGroup";

type RGBARandomGridExampleProps = {
  gridSize: {
    numColumns: number;
    numRows:number;
  },
  canvasSizes: {
    width: number;
    height: number;
  }[];
}

export const RGBARandomGridExample = (props: RGBARandomGridExampleProps) => {

  function createRGBARandomGridData(numRows: number, numColumns: number, noiseFactor: number = 0.1) {
    const data = new Uint32Array(numRows * numColumns);
    for (let i = 0; i < data.length; i++) {
      if (Math.random() < noiseFactor) {
        data[i] = 0xffffffff;
      } else {
        const rgba = [
          Math.floor(Math.random() * 256.0 * i / data.length),
          Math.floor(Math.random() * 256.0 * i / data.length),
          Math.floor(Math.random() * 256.0 * i / data.length),
          200
        ];
        data[i] = (rgba[0] << 0) + (rgba[1] << 8) + (rgba[2] << 16) + (rgba[3] << 24);
      }
    }
    return data;
  }

  const gridSize = { numColumns: 200, numRows: 200 };
  const gridSizeMax: number = Math.max(gridSize.numColumns, gridSize.numRows);
  const data: Uint32Array = createRGBARandomGridData(gridSize.numRows, gridSize.numColumns, 0.1);
  const focusedStates: Uint32Array = new Uint32Array(gridSizeMax);
  const selectedStates: Uint32Array = new Uint32Array(gridSizeMax);

  const viewportStates: Float32Array = new Float32Array([
    0.0, 0.0, 200.0, 200.0, // viewport index 0: left, top, right, bottom
    55.0, 55.0, 90.0, 90.0, // viewport index 1: left, top, right, bottom
    64.0, 64.0, 80.0, 80.0 // viewport index 2: left, top, right, bottom
  ]);

  return <GridGroup
    mode={GridShaderMode.RGBA}
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