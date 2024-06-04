import React, { ReactNode, useCallback, useEffect, useRef } from 'react';
import {
  CanvasElementEventHandlers,
  useCanvasElementContext,
} from './CanvasElementContext';
import { useViewportContext } from './ViewportContext';
import { useGridContext } from './GridContext';
import { useWebGPUContext } from './WebGPUContext';

export type GridUIContextValue = CanvasElementEventHandlers & {
  onUpdateFocusedIndices: (id: string, indices: number[]) => void;
  onUpdateSelectedIndices: (id: string, indices: number[]) => void;
  onUpdateViewport: (
    id: string,
    viewport: { top: number; bottom: number; left: number; right: number }
  ) => void;

  viewport: { top: number; bottom: number; left: number; right: number };
  focusedIndices: number[];
  selectedIndices: number[];
  cellsToShow: {
    numColumnsToShow: number;
    numRowsToShow: number;
  };
};

const createFilledArray = (size: number, value: number) => {
  const newArray = new Array<number>(size);
  newArray.fill(value);
  return newArray;
};

const GridUIContext = React.createContext<GridUIContextValue | null>(null);

export const GridUIContextProvider = (props: { children: ReactNode }) => {
  const webGpuContext = useWebGPUContext();
  const viewportContext = useViewportContext();
  const gridContext = useGridContext();
  const canvasContext = useCanvasElementContext();
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  const viewport = useRef<{
    top: number;
    bottom: number;
    left: number;
    right: number;
  }>({
    ...viewportContext.initialViewport,
  });
  const focusedIndices = useRef<number[]>([]);
  const selectedIndices = useRef<number[]>([]);

  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const dragRange = useRef<{
    top: number;
    bottom: number;
    left: number;
    right: number;
  } | null>(null);

  const cellsToShow = useRef<{
    numColumnsToShow: number;
    numRowsToShow: number;
  }>({
    numColumnsToShow:
      Math.ceil(viewport.current.right) - Math.floor(viewport.current.left) + 1,
    numRowsToShow:
      Math.ceil(viewport.current.bottom) - Math.floor(viewport.current.top) + 1,
  });

  const eventHandlers = useRef<boolean>(false);

  const getMousePosition = (event: MouseEvent) => {
    if (!canvasContext.canvasRef.current) {
      return;
    }

    const rect = canvasContext.canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const columnWidth =
      (canvasContext.canvasSize.width - canvasContext.headerOffset.left) /
      (viewport.current.right - viewport.current.left);
    const rowHeight =
      (canvasContext.canvasSize.height - canvasContext.headerOffset.top) /
      (viewport.current.bottom - viewport.current.top);

    const columnIndex = (x - canvasContext.headerOffset.left) / columnWidth;
    const rowIndex = (y - canvasContext.headerOffset.top) / rowHeight;

    return {
      columnIndex:
        columnIndex >= 0 &&
        columnIndex + viewport.current.left < gridContext.gridSize.numColumns
          ? columnIndex + viewport.current.left
          : -1,
      rowIndex:
        rowIndex >= 0 &&
        rowIndex + viewport.current.top < gridContext.gridSize.numRows
          ? rowIndex + viewport.current.top
          : -1,
    };
  };

  const onMouseDown = (event: MouseEvent) => {
    if (canvasContext.canvasRef.current === null) {
      return;
    }
    const rect = canvasContext.canvasRef.current.getBoundingClientRect();
    if (!dragStart.current) {
      dragStart.current = {
        x: event.clientX - rect.left - canvasContext.headerOffset.left,
        y: event.clientY - rect.top - canvasContext.headerOffset.top,
      };
    } else {
      const mousePosition = getMousePosition(event);
      if (!mousePosition) {
        return;
      }
      selectedIndices.current = [
        mousePosition.columnIndex,
        mousePosition.rowIndex,
      ];
    }
  };

  const onMouseUp = () => {
    dragStart.current = null;
  };

  const onMouseOut = () => {
    focusedIndices.current = [];
  };

  const onMouseMove = (event: MouseEvent) => {
    if (
      event.buttons === 1 &&
      canvasContext.canvasRef.current &&
      dragStart.current &&
      dragRange.current
    ) {
      const rect = canvasContext.canvasRef.current.getBoundingClientRect();
      const dx =
        event.clientX -
        rect.left -
        canvasContext.headerOffset.left -
        dragStart.current.x;

      const dy =
        event.clientY -
        rect.top -
        canvasContext.headerOffset.top -
        dragStart.current.y;

      const dx_cells =
        (-1 * (viewport.current.right - viewport.current.left) * dx) /
        (canvasContext.canvasSize.width - canvasContext.headerOffset.left);
      const dy_cells =
        (-1 * ((viewport.current.bottom - viewport.current.top) * dy)) /
        (canvasContext.canvasSize.height - canvasContext.headerOffset.top);

      const newLeft = dragRange.current.left + dx_cells;
      const newRight = dragRange.current.right + dx_cells;
      const newTop = dragRange.current.top + dy_cells;
      const newBottom = dragRange.current.bottom + dy_cells;

      const newViewport = {
        left: newLeft,
        right: newRight,
        top: newTop,
        bottom: newBottom,
      };

      if (
        0 <= newLeft &&
        newRight <= gridContext.gridSize.numColumns &&
        0 <= newTop &&
        newBottom <= gridContext.gridSize.numRows
      ) {
        onUpdateViewport(canvasContext.canvasId, newViewport);
        return;
      } else {
        // console.log(newRange);
      }
    } else {
      dragStart.current = null;
      dragRange.current = { ...viewport.current };
      const mousePosition = getMousePosition(event);
      if (!mousePosition) {
        return;
      }
      const newFocusedIndices = [
        mousePosition.columnIndex,
        mousePosition.rowIndex,
      ];
      onUpdateFocusedIndices(canvasContext.canvasId, newFocusedIndices);
    }
  };

  const onWheel = (event: WheelEvent) => {
    if (event.deltaY === 0 || !canvasContext.canvasRef.current) {
      return;
    }

    const scale = event.deltaY > 0 ? 1.03 : 0.98;

    const rect = canvasContext.canvasRef.current.getBoundingClientRect();
    const dx = event.clientX - rect.left - canvasContext.headerOffset.left;
    const dy = event.clientY - rect.top - canvasContext.headerOffset.top;

    const cx =
      ((viewport.current.right - viewport.current.left) * dx) /
        (canvasContext.canvasSize.width - canvasContext.headerOffset.left) +
      viewport.current.left;
    const cy =
      ((viewport.current.bottom - viewport.current.top) * dy) /
        (canvasContext.canvasSize.height - canvasContext.headerOffset.top) +
      viewport.current.top;

    const newStartColumn = cx + (viewport.current.left - cx) * scale;
    const newEndColumn = cx + (viewport.current.right - cx) * scale;
    const newStartRow = cy + (viewport.current.top - cy) * scale;
    const newEndRow = cy + (viewport.current.bottom - cy) * scale;

    if (
      (newStartColumn < 0 && gridContext.gridSize.numColumns < newEndColumn) ||
      (newStartRow < 0 && gridContext.gridSize.numRows < newEndRow) ||
      (newEndColumn - newStartColumn < 1 && newEndRow - newStartRow < 1)
    ) {
      return;
    }
    const newViewport = {
      left: newStartColumn,
      right: newEndColumn,
      top: newStartRow,
      bottom: newEndRow,
    };

    onUpdateViewport(canvasContext.canvasId, newViewport);
  };

  const onUpdateFocusedIndices = (id: string, indices: number[]) => {
    // DEBUG && console.debug(`${id} updated focused indices:`, indices);
    const newFocusedIndices = createFilledArray(
      Math.max(gridContext.gridSize.numColumns, gridContext.gridSize.numRows),
      0
    );
    if (indices.length >= 1 && indices[0] >= 0) {
      newFocusedIndices[indices[0]] += 1;
    }
    if (indices.length >= 2 && indices[1] >= 0) {
      newFocusedIndices[indices[1]] += 2;
    }
    // DEBUG && console.debug(newFocusedIndices);
    focusedIndices.current = newFocusedIndices;
  };

  const onUpdateSelectedIndices = (id: string, indices: number[]) => {
    //console.log(`${id} updated selected indices:`, indices);
    const newSelectedIndices = createFilledArray(
      Math.max(gridContext.gridSize.numColumns, gridContext.gridSize.numRows),
      0
    );
    for (let i = 0; i < indices.length; i++) {
      newSelectedIndices[indices[i]] = 1;
    }
    // DEBUG && console.debug(newSelectedIndices);
    selectedIndices.current = newSelectedIndices;
  };

  const round = (
    viewport: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    },
    scale: number
  ) => {
    return {
      top: Math.round(viewport.top * scale) / scale,
      bottom: Math.round(viewport.bottom * scale) / scale,
      left: Math.round(viewport.left * scale) / scale,
      right: Math.round(viewport.right * scale) / scale,
    };
  };

  const onUpdateViewport = (
    id: string,
    newViewport: { top: number; bottom: number; left: number; right: number }
  ) => {
    !debounceTimerRef.current && clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      viewport.current = { ...newViewport };

      const numColumnsToShow =
        Math.ceil(viewport.current.right) -
        Math.floor(viewport.current.left) +
        1;
      const numRowsToShow =
        Math.ceil(viewport.current.bottom) -
        Math.floor(viewport.current.top) +
        1;

      cellsToShow.current = {
        numColumnsToShow,
        numRowsToShow,
      };

      if (webGpuContext?.renderBundleBuilder) {
        console.log('onUpdateViewport', round(viewport.current, 1000));

        webGpuContext.renderBundleBuilder.setF32UniformBuffer(
          gridContext,
          viewport.current,
          numColumnsToShow,
          numRowsToShow
        );

        // webGpuContext.renderBundleBuilder?.executeRenderBundles(bundles);

        requestAnimationFrame(() => {
          if (webGpuContext.renderBundleBuilder) {
            const bundles = [
              webGpuContext.renderBundleBuilder.createBodyRenderBundle(),
              webGpuContext.renderBundleBuilder.createTopHeaderRenderBundle(),
              webGpuContext.renderBundleBuilder.createLeftHeaderRenderBundle(),
            ];
            webGpuContext.renderBundleBuilder.executeRenderBundles(bundles);
          }
        });
      }

      debounceTimerRef.current = undefined;
    }, 10);
  };

  const value: GridUIContextValue = {
    onMouseUp,
    onMouseDown,
    onMouseOut,
    onMouseMove,
    onWheel,
    onUpdateSelectedIndices,
    onUpdateFocusedIndices,
    onUpdateViewport,
    viewport: viewport.current,
    focusedIndices: focusedIndices.current,
    selectedIndices: selectedIndices.current,
    cellsToShow: cellsToShow.current,
  };

  useEffect(() => {
    const canvas = canvasContext.canvasRef.current;
    if (canvas && !eventHandlers.current) {
      canvas.addEventListener('mouseup', onMouseUp, { passive: true });
      canvas.addEventListener('mousedown', onMouseDown, { passive: true });
      canvas.addEventListener('mouseout', onMouseOut, { passive: true });
      canvas.addEventListener('mousemove', onMouseMove, { passive: true });
      canvas.addEventListener('wheel', onWheel, { passive: true });
      eventHandlers.current = true;
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('mouseup', onMouseUp);
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mouseout', onMouseOut);
        canvas.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('wheel', onWheel);
        eventHandlers.current = false;
      }
    };
  }, [canvasContext.canvasRef, onMouseDown, onMouseMove, onWheel]);

  return (
    <GridUIContext.Provider value={value}>
      {props.children}
    </GridUIContext.Provider>
  );
};

export const useGridUIContext = () => {
  const context = React.useContext(GridUIContext);

  if (!context) {
    throw new Error(
      'useGridUIContext must be used within a GridUIContextProvider'
    );
  }
  return context;
};

export default GridUIContext;
