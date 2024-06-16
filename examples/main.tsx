import React, { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { Grid } from '../src/grid/Grid';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

//const gridSize = { numColumns: 64, numRows: 64 };
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
        scrollBar={{
          radius: 5.0,
          margin: 2.0,
        }}
        gridSize={gridSize}
        data={dataById.get('adjacencyMatrix')!}
        initialViewport={{
          top: 0.0,
          bottom: 16.0,
          left: 0.0,
          right: 16.0,
        }}
      />
    </>
  );
};

render();
//strictRender();
