import { CanvasElementContextProvider } from './CanvasElementContext';
import React from 'react';
import { GridContextProvider } from './GridContext';
import { WebGPUContextProvider } from './WebGPUContext';
import { ViewportContextProvider } from './ViewportContext';
import GridUI from './GridUI';
import { GridProps } from './GridProps';

/**
 * A React component that renders a grid with the specified properties.
 *
 * @param props - The properties for the Grid component.
 * @returns A React component that renders a grid.
 */
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
