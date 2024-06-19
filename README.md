# WebGPU-React-Grid - A React component for visualizing a grid of floating-point values using WebGPU
[![npm version](https://badge.fury.io/js/webgpu-react-grid.svg)](https://badge.fury.io/js/webgpu-react-grid)
[![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/silevis/reactgrid/blob/develop/LICENSE)


WebGPU-React-Grid is an open-source React component for visualizing a grid of floating-point values using WebGPU.

- Supports viewport navigation via mouse drag and scrollbar handling.
- Enables zooming in and out with mouse wheel.
- Highlights the column and row under the current mouse pointer.
- Allows toggling selection state of columns and rows via mouse interaction.
- Customizable properties for canvas size, grid size, viewport display size, header area size, and scrollbar size through React component props.
- High-performance rendering using WebGPU

# Live demo

[Live demo](https://kubohiroya.github.io/webgpu-react-grid/examples/index.html)

# Download and Installation

Download the latest version of WebGPU-React-Grid from the npm repository:

```bash
npm install webgpu-react-grid
```

# Usage

```TypeScript
import { Grid } from "webgpu-react-grid";

const gridSize = { numColumns: 1024, numRows: 1024 };

const data =  new Float32Array(gridSize.numRows * gridSize.numColumns);
for (let i = 0; i < data.length; i++) {
  if (Math.random() < 0.99) {
    data[i] = i / data.length;
  } else {
    data[i] = Infinity;
  }
}

export const Grid1024 = () => {
  return (
    <Grid
      canvasId={'adjacencyMatrix'}
      headerOffset={{ left: 12, top: 12 }}
      canvasSize={{ width: 512, height: 512 }}
      scrollBar={{
        radius: 5.0,
        margin: 2.0,
      }}
      gridSize={gridSize}
      data={data}
      initialViewport={{
        top: 0.0,
        bottom: 16.0,
        left: 0.0,
        right: 16.0,
      }}
    />
  );
}
```

# Prerequisites:
 - WebGPU compatible browser (e.g. Chrome with WebGPU enabled)
 - react: `^18.2.0`
 - react-dom: `^18.2.0`


# Licensing

WebGPU-React-Grid is published under the MIT License (MIT).

(c) 2024 Hiroya Kubo

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

# Author

Hiroya Kubo
