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
    updateData: (sourceIndex: number, data: Float32Array) => {
      gridUIRef.current?.updateData(sourceIndex, data);
    },
    updateFocusedState: (sourceIndex: number, columnIndex: number, rowIndex: number) => {
      gridUIRef.current?.updateFocusedState(sourceIndex, columnIndex, rowIndex);
    },
    updateSelectedState: (sourceIndex: number, columnIndex: number, rowIndex: number) => {
      gridUIRef.current?.updateSelectedState(sourceIndex, columnIndex, rowIndex);
    },
    refreshViewportState: (sourceIndex: number) => {
      gridUIRef.current?.refreshViewportState(sourceIndex);
    }
  }));

  const canvasId = "webgpu-react-grid-"+props.index;

  return (
    <CanvasElementContextProvider
      canvasId={canvasId}
      headerOffset={props.headerOffset}
      canvasSize={props.canvasSize}
      scrollBar={props.scrollBar}
      // multisample={4}
    >
      <GridContextProvider gridSize={props.gridSize} data={props.data}>
        <ViewportContextProvider
          index={props.index}
          numViewports={props.numViewports}
          viewportStates={props.viewportStates}
          initialOverscroll={props.initialOverscroll}
        >
          <WebGPUContextProvider>
            <GridUI
              ref={gridUIRef}
              focusedStates={props.focusedStates}
              selectedStates={props.selectedStates}
              onFocusedStatesChange={props.onFocusedStateChange}
              onSelectedStatesChange={props.onSelectedStateChange}
              onViewportStateChange={props.onViewportStateChange}
            />
          </WebGPUContextProvider>
        </ViewportContextProvider>
      </GridContextProvider>
    </CanvasElementContextProvider>
  );
});
