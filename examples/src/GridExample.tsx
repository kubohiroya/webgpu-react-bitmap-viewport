import { HueGridExample } from './HueGridExample';
import { RGBAImageGridExample } from './RGBAImageGridExample';
import { RGBARandomGridExample } from './RGBARandomGridExample';
import SchellingSegregation, {
  SchellingSegregationModes,
} from './schelling_segregation/SchellingSegregation';

export const GridExample = () => {
  return (
    <>
      <div>
        <h2>Schelling's model of segregation</h2>
        <div style={{ display: 'flex', columnGap: '16px' }}>
          {[
            SchellingSegregationModes.CPU,
            SchellingSegregationModes.GPU,
            //nSchellingSegregationModes.GPU_PARALLEL,
          ].map((mode: SchellingSegregationModes, index: number) => (
            <div key={index}>
              <h3>{mode}</h3>
              <SchellingSegregation
                mode={mode}
                density={0.8}
                tolerance={0.5}
                shares={[0.5, 0.3, 0.2]}
                values={[15, 70, 135]}
                //shares={[0.5, 0.5]}
                //values={[0.01, 0.7]}
                canvasSize={{ width: 256, height: 256 }}
                headerOffset={{ left: 0, top: 0 }}
                //gridSize={{ numColumns: 16, numRows: 16 }}
                //gridSize={{ numColumns: 32, numRows: 32 }}
                //gridSize={{ numColumns: 64, numRows: 64 }}
                //gridSize={{ numColumns: 128, numRows: 128 }}
                gridSize={{ numColumns: 512, numRows: 512 }}
                iterations={64}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
/*
      <div>
        <h2>RGBAImageGrid</h2>
        <RGBAImageGridExample
          src={'/webgpu-react-grid/The_Great_Wave_off_Kanagawa.jpg'}
          canvasSizes={[
            { width: 1044, height: 726 },
            { width: 547, height: 363 },
            { width: 220, height: 220 },
          ]}
          headerOffset={{ left: 20, top: 20 }}
        />
      </div>
      <div>
        <h2>HueGrid</h2>
        <HueGridExample
          canvasSizes={[
            { width: 520, height: 520 },
            { width: 220, height: 420 },
            { width: 220, height: 120 },
          ]}
          headerOffset={{ left: 20, top: 20 }}
          gridSize={{
            numColumns: 200,
            numRows: 200,
          }}
          viewportStates={
            new Float32Array([
              0.0,
              0.0,
              200.0,
              200.0, // viewport index 0: left, top, right, bottom
              50.0,
              50.0,
              100.0,
              150.0, // viewport index 1: left, top, right, bottom
              0.0,
              100.0,
              100.0,
              150.0, // viewport index 2: left, top, right, bottom
            ])
          }
        />
      </div>
      <div>
        <h2>RGBARandomGrid</h2>
        <RGBARandomGridExample
          canvasSizes={[
            { width: 520, height: 520 },
            { width: 220, height: 420 },
            { width: 220, height: 120 },
          ]}
          headerOffset={{ left: 20, top: 20 }}
          gridSize={{
            numColumns: 200,
            numRows: 200,
          }}
          viewportStates={
            new Float32Array([
              0.0,
              0.0,
              200.0,
              200.0, // viewport index 0: left, top, right, bottom
              50.0,
              50.0,
              100.0,
              150.0, // viewport index 1: left, top, right, bottom
              0.0,
              100.0,
              100.0,
              150.0, // viewport index 2: left, top, right, bottom
            ])
          }
        />
      </div>

 */
