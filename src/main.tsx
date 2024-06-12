import React, { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { Grid } from './grid/Grid';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const gridSize = { numColumns: 1024, numRows: 1024 };

const TRUE = true;
const dataById = new Map<string, Float32Array>();
['adjacencyMatrix', 'distanceMatrix', 'transportationCostMatrix'].forEach(
  (id: string) => {
    const data = new Float32Array(gridSize.numRows * gridSize.numColumns);
    for (let i = 0; i < data.length; i++) {
      if (!TRUE) {
        data[i] = i / data.length;
      } else {
        if (Math.random() < 0.99) {
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
        canvasSize={{ width: 512, height: 512 }}
        gridSize={gridSize}
        data={dataById.get('adjacencyMatrix')!}
        initialViewport={{
          top: 0,
          bottom: 4,
          left: 0,
          right: 4,
        }}
      />
      <Grid
        canvasId={'adjacencyMatrix2'}
        headerOffset={{ left: 28, top: 28 }}
        canvasSize={{ width: 512, height: 512 }}
        gridSize={gridSize}
        data={dataById.get('adjacencyMatrix')!}
        initialViewport={{
          top: 100,
          bottom: 104,
          left: 100,
          right: 104,
        }}
      />
    </>
  );
};
/*
initialOverscroll={{ x: -256, y: -256 }}
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
