# WebGPU-React-Grid - A React component for visualizing a grid of floating-point values using WebGPU
[![npm version](https://badge.fury.io/js/webgpu-react-grid.svg)](https://badge.fury.io/js/webgpu-react-grid)
[![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/kubohiroya/webgpu-react-grid/blob/main/LICENSE)


WebGPU-React-Grid is an open-source React component for visualizing a grid of floating-point values using WebGPU.

- High-performance rendering using WebGPU
- Supports large grid sizes (e.g. 1024x1024)
- Supports viewport navigation via mouse drag and scrollbar handling.
- Enables zooming in and out with mouse wheel.
- Highlights the column and row under the current mouse pointer.
- Allows toggling selection state of columns and rows via mouse interaction.
- Customizable properties for canvas size, grid size, viewport display size, header area size, and scrollbar size through React component props.

# Live demo

[Live demo](https://kubohiroya.github.io/webgpu-react-grid/examples/index.html)

# Download and Installation

Download the latest version of WebGPU-React-Grid from the npm repository:

```bash
npm install webgpu-react-grid
```

# Usage

```tsx
import { Grid, GridHandles } from "webgpu-react-grid";
import { useRef } from "react";

const gridSize = { numColumns: 128, numRows: 128 };
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

const viewportStates = new Float32Array([
  0.0, 0.0, 16.0, 16.0,
  8.0, 8.0, 24.0, 24.0,
]);

export const GridExample = () => {
  const gridRefs =
    [
      useRef<GridHandles>(null),
      useRef<GridHandles>(null)
    ];

  return (
    <>
      <Grid
        index={0}
        ref={gridRefs[0]}
        numViewports={2}
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
        viewportStates={viewportStates}
        onFocusedStatesChange={(sourceIndex: number, columnIndex: number, rowIndex: number) => {
          gridRefs[1].current?.updateFocusedState(sourceIndex, columnIndex, rowIndex);
        }}
        onSelectedStatesChange={(sourceIndex:number, columnIndex: number, rowIndex: number) => {
          gridRefs[1].current?.updateSelectedState(sourceIndex, columnIndex, rowIndex);
        }}
        onViewportStateChange={(sourceIndex: number) => {
          gridRefs[1].current?.refreshViewportState(sourceIndex);
        }}
      />
      <Grid
        index={1}
        ref={gridRefs[1]}
        numViewports={2}
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
        viewportStates={viewportStates}
        onFocusedStatesChange={(sourceIndex: number, columnIndex: number, rowIndex: number) => {
          gridRefs[0].current?.updateFocusedState(sourceIndex, columnIndex, rowIndex);
        }}
        onSelectedStatesChange={(sourceIndex: number, columnIndex: number, rowIndex: number) => {
          gridRefs[0].current?.updateSelectedState(sourceIndex, columnIndex, rowIndex);
        }}
        onViewportStateChange={(sourceIndex: number) => {
          gridRefs[0].current?.refreshViewportState(sourceIndex);
        }}
      />
    </>
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
