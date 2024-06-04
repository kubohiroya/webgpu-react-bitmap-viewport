import React, { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { Grid } from './grid/Grid';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const gridSize = { numColumns: 16, numRows: 16 };

const TRUE = true;
const dataById = new Map<string, Float32Array>();
['adjacencyMatrix', 'distanceMatrix', 'transportationCostMatrix'].forEach(
  (id: string) => {
    const data = new Float32Array(gridSize.numRows * gridSize.numColumns);
    for (let i = 0; i < data.length; i++) {
      if (!TRUE) {
        data[i] = i / data.length;
      } else {
        if (Math.random() < 0.9) {
          data[i] = i / data.length;
        } else {
          data[i] = Infinity;
        }
      }
    }
    dataById.set(id, data);
  }
);

const strictRender = () => {
  root.render(<StrictMode></StrictMode>);
};

const render = () => {
  // eslint-disable-next-line react-hooks/rules-of-hooks

  root.render(
    <>
      <Grid
        canvasId={'adjacencyMatrix'}
        headerOffset={{ left: 28, top: 28 }}
        canvasSize={{ width: 256, height: 256 }}
        gridSize={gridSize}
        data={dataById.get('adjacencyMatrix')!}
        initialViewport={{
          top: 8,
          bottom: 16,
          left: 8,
          right: 16,
        }}
      />
    </>
  );
};
/*
 <Grid
 canvasId={'distanceMatrix'}
 headerOffset={{ top: 0, left: 0 }}
 canvasSize={{ width: 128, height: 128 }}
 gridSize={gridSize}
 data={dataById.get('adjacencyMatrix')!}
 initialViewport={{ left: 2.8, right: 5.3, top: 2.8, bottom: 5.3 }}
 />
 <Grid
 canvasId={'distanceMatrix'}
 headerOffset={{ top: 64, left: 64 }}
 canvasSize={{ width: 128, height: 128 }}
 gridSize={gridSize}
 data={dataById.get('adjacencyMatrix')!}
 initialViewport={{ left: 2.5, right: 5, top: 2.5, bottom: 5 }}
 />
 <Grid
 canvasId={'distanceMatrix'}
 headerOffset={{ top: 64, left: 64 }}
 canvasSize={{ width: 128, height: 128 }}
 gridSize={gridSize}
 data={dataById.get('adjacencyMatrix')!}
 initialViewport={{ left: 2.8, right: 5.3, top: 2.8, bottom: 5.3 }}
 />
 */
// headerOffset.left、topが効いていない

render();
//strictRender();
