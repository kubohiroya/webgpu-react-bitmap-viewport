import { HueGridExample } from "./HueGridExample"
import { RGBAImageGridExample } from "./RGBAImageGridExample"
import { RGBARandomGridExample } from "./RGBARandomGridExample"

export const GridExample = ()=>{
  return <>
    <div>
      <RGBAImageGridExample src={"/webgpu-react-grid/The_Great_Wave_off_Kanagawa.jpg"}
                            canvasSizes={
                              [
                                { width: 1094, height: 726 },
                                { width: 220, height: 220 },
                                { width: 420, height: 220 }
                              ]
                            }
      />
    </div>
    <div>
      <HueGridExample
        gridSize={
          {
            numColumns: 200,
            numRows: 200
          }}
        canvasSizes={
      [
        { width: 800, height: 800 },
        { width: 200, height: 200 },
        { width: 100, height: 100 }
      ]
    }/>
    </div>
    <div>
      <RGBARandomGridExample
        gridSize={
          {
            numColumns: 200,
            numRows: 200
          }}
        canvasSizes={
          [
            { width: 800, height: 800 },
            { width: 200, height: 200 },
            { width: 100, height: 100 }
          ]
        }
      />
    </div>
  </>
}