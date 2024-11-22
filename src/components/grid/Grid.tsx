import { CanvasRefProvider } from './CanvasRefContext';
import React, { forwardRef, useImperativeHandle } from 'react';
import { GridContextProvider } from './GridContext';
import { ViewportContextProvider } from './ViewportContext';
import GridUI from './GridUI';
import { GridProps } from './GridProps';
import { GridHandles } from './GridHandles';
import { WebGPUDisplayContextProvider } from './WebGPUDisplayContext';
import { CanvasContextProvider } from './CanvasContext';
import { KeyboardModifier } from './KeyboardModifier';

/**
 * A React component that renders a grid with the specified properties.
 *
 * @param props - The properties for the Grid component.
 * @returns A React component that renders a grid.
 */
export const Grid = React.memo(
  forwardRef<GridHandles, GridProps>((props, ref) => {
    const gridUIRef = React.useRef<GridHandles>(null);

    useImperativeHandle(ref, () => ({
      refreshData: (sourceIndex: number) => {
        gridUIRef.current?.refreshData(sourceIndex);
      },
      refreshFocusedState: (
        sourceIndex: number,
        columnIndex: number,
        rowIndex: number
      ) => {
        gridUIRef.current?.refreshFocusedState(
          sourceIndex,
          columnIndex,
          rowIndex
        );
      },
      refreshSelectedState: (
        sourceIndex: number,
        columnIndex: number,
        rowIndex: number,
        keyboardModifier: KeyboardModifier
      ) => {
        gridUIRef.current?.refreshSelectedState(
          sourceIndex,
          columnIndex,
          rowIndex,
          keyboardModifier
        );
      },
      refreshViewportState: (sourceIndex: number) => {
        gridUIRef.current?.refreshViewportState(sourceIndex);
      },
    }));

    return (
      <CanvasContextProvider
        headerOffset={props.headerOffset}
        canvasSize={props.canvasSize}
        scrollBar={props.scrollBar}
      >
        <CanvasRefProvider>
          <GridContextProvider
            mode={props.mode}
            numColumns={props.numColumns}
            numRows={props.numRows}
            data={props.data}
          >
            <ViewportContextProvider
              viewportIndex={props.viewportIndex}
              numViewports={props.numViewports}
              viewportStates={props.viewportStates}
              initialOverscroll={props.initialOverscroll}
            >
              <WebGPUDisplayContextProvider>
                <GridUI
                  ref={gridUIRef}
                  numColumns={props.numColumns}
                  numRows={props.numRows}
                  focusedCellPosition={props.focusedCellPosition}
                  selectedStates={props.selectedStates}
                  onFocusedCellPositionChange={
                    props.onFocusedCellPositionChange
                  }
                  onSelectedStatesChange={props.onSelectedStateChange}
                  onViewportStateChange={props.onViewportStateChange}
                />
              </WebGPUDisplayContextProvider>
            </ViewportContextProvider>
          </GridContextProvider>
        </CanvasRefProvider>
      </CanvasContextProvider>
    );
  })
);
