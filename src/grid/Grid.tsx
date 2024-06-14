import { CanvasElementContextProvider } from './CanvasElementContext';
import React from 'react';
import { GridContextProvider } from './GridContext';
import { WebGPUContextProvider } from './WebGPUContext';
import { ViewportContextProvider } from './ViewportContext';
import GridUI from './GridUI';

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
  initialViewport?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  initialOverscroll?: {
    x: number;
    y: number;
  };
  scrollBar: {
    radius: number;
    margin: number;
  };
};
export const Grid = (props: GridProps) => {
  return (
    <CanvasElementContextProvider
      canvasId={props.canvasId}
      headerOffset={props.headerOffset}
      canvasSize={props.canvasSize}
      scrollBar={props.scrollBar}
      //multisample={4}
    >
      <GridContextProvider gridSize={props.gridSize} data={props.data}>
        <WebGPUContextProvider>
          <ViewportContextProvider
            initialViewport={props.initialViewport}
            initialOverscroll={props.initialOverscroll}
          >
            <GridUI />
          </ViewportContextProvider>
        </WebGPUContextProvider>
      </GridContextProvider>
    </CanvasElementContextProvider>
  );
};
