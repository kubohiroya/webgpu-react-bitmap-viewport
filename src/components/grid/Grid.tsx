import { CanvasElementContextProvider } from './CanvasElementContext';
import React, { forwardRef, useImperativeHandle } from 'react';
import { GridContextProvider } from './GridContext';
import { WebGPUContextProvider } from './WebGPUContext';
import { ViewportContextProvider } from './ViewportContext';
import GridUI from './GridUI';
import { GridProps } from './GridProps';
import { GridHandles } from './GridHandles';

/**
 * A React component that renders a grid with the specified properties.
 *
 * @param props - The properties for the Grid component.
 * @returns A React component that renders a grid.
 */
export const Grid = forwardRef<GridHandles, GridProps>((props, ref) => {
  const gridUIRef = React.useRef<GridHandles>(null);

  useImperativeHandle(ref, () => ({
    updateData: (sourceId: string, data: Float32Array) => {
      gridUIRef.current?.updateData(sourceId, data);
    },
    updateFocusedIndices: (sourceId: string, columnIndex: number, rowIndex: number) => {
      gridUIRef.current?.updateFocusedIndices(sourceId, columnIndex, rowIndex);
    },
    updateSelectedIndices: (sourceId: string, columnIndex: number, rowIndex: number) => {
      gridUIRef.current?.updateSelectedIndices(sourceId, columnIndex, rowIndex);
    }
  }));

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
            <GridUI
              ref={gridUIRef}
              canvasId={props.canvasId}
              focusedStates={props.focusedStates}
              selectedStates={props.selectedStates}
              onFocusedStatesChange={props.onFocusedStatesChange}
              onSelectedStatesChange={props.onSelectedStatesChange}
            />
          </ViewportContextProvider>
        </WebGPUContextProvider>
      </GridContextProvider>
    </CanvasElementContextProvider>
  );
});
