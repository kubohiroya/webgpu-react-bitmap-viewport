import { HueGridExample } from "./HueGridExample"
import { RGBAImageGridExample } from "./RGBAImageGridExample"
import { RGBARandomGridExample } from "./RGBARandomGridExample"

export const GridExample = ()=>{
  return <>
    <div>
      <h2>RGBAImageGrid</h2>
      <RGBAImageGridExample src={'/webgpu-react-grid/The_Great_Wave_off_Kanagawa.jpg'}
                            canvasSizes={
                              [
                                { width: 1094, height: 726 },
                                { width: 220, height: 220 },
                                { width: 420, height: 220 }
                              ]
                            }
                            headerOffset={{ left: 20, top: 20 }}
      />
    </div>
    <div>
      <h2>HueGrid</h2>
      <HueGridExample
        canvasSizes={
          [
            { width: 520, height: 520 },
            { width: 220, height: 420 },
            { width: 220, height: 120 }
          ]
        }
        headerOffset={{ left: 20, top: 20 }}
        gridSize={
          {
            numColumns: 200,
            numRows: 200
          }}
        viewportStates={new Float32Array([
          0.0, 0.0, 200.0, 200.0, // viewport index 0: left, top, right, bottom
          50.0, 50.0, 100.0, 150.0, // viewport index 1: left, top, right, bottom
          0.0, 100.0, 100.0, 150.0, // viewport index 2: left, top, right, bottom
        ])
        }
      />
    </div>
    <div>
      <h2>RGBARandomGrid</h2>
      <RGBARandomGridExample
        canvasSizes={
          [
            { width: 520, height: 520 },
            { width: 220, height: 420 },
            { width: 220, height: 120 }
          ]
        }
        headerOffset={{ left: 20, top: 20 }}
        gridSize={
          {
            numColumns: 200,
            numRows: 200
          }}
        viewportStates={new Float32Array([
          0.0, 0.0, 200.0, 200.0, // viewport index 0: left, top, right, bottom
          50.0, 50.0, 100.0, 150.0, // viewport index 1: left, top, right, bottom
          0.0, 100.0, 100.0, 150.0, // viewport index 2: left, top, right, bottom
        ])
        }
      />
    </div>
  </>
}