import { CanvasElementContextProvider } from './CanvasElementContext';
import React from 'react';
import { GridContextProvider } from './GridContext';
import { WebGPUContextProvider } from './WebGPUContext';
import { ViewportContextProvider } from './ViewportContext';
import { GridUIContextProvider } from './GridUIContext';
import { GridRenderer } from './GridRenderer';

export type GridProps = {
  canvasId: string;
  headerOffset: {
    left: number;
    top: number;
  };
  canvasSize: {
    width: number;
    height: number;
  };
  gridSize: {
    numColumns: number;
    numRows: number;
  };
  data: Float32Array;
  initialViewport: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
};
export const Grid = (props: GridProps) => {
  return (
    <CanvasElementContextProvider
      canvasId={props.canvasId}
      headerOffset={props.headerOffset}
      canvasSize={props.canvasSize}
    >
      <GridContextProvider gridSize={props.gridSize} data={props.data}>
        <WebGPUContextProvider>
          <ViewportContextProvider initialViewport={props.initialViewport}>
            <GridUIContextProvider>
              <GridRenderer />
            </GridUIContextProvider>
          </ViewportContextProvider>
        </WebGPUContextProvider>
      </GridContextProvider>
    </CanvasElementContextProvider>
  );
};
