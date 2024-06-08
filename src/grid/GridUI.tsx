import { useEffect, useRef, useState } from 'react';
import { useCanvasElementContext } from './CanvasElementContext';
import { useViewportContext } from './ViewportContext';
import { useGridContext } from './GridContext';
import { useWebGPUContext } from './WebGPUContext';
import { vi } from 'vitest';

const createFilledArray = (size: number, value: number) => {
  const newArray = new Array<number>(size);
  newArray.fill(value);
  return newArray;
};

const friction = 0.99;

export const GridUI = () => {
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
  const overscroll = useRef<{ x: number; y: number }>({
    ...viewportContext.initialOverscroll,
  });

  const numCellsToShow = useRef<{
    numColumnsToShow: number;
    numRowsToShow: number;
  }>({
    numColumnsToShow: 0,
    numRowsToShow: 0,
  });

  const focusedIndices = useRef<number[]>([]);
  const selectedIndices = useRef<number[]>([]);

  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const dragStartViewport = useRef<{
    top: number;
    bottom: number;
    left: number;
    right: number;
  } | null>(null);

  const delta = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const velocity = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastTime = useRef<number>(0);

  const isMouseOut = useRef<boolean>(true);
  const eventHandlers = useRef<boolean>(false);

  const initRenderBundleBuilder = () => {
    if (webGpuContext?.renderBundleBuilder) {
      webGpuContext.renderBundleBuilder.setDataBufferStorage(gridContext.data);
      webGpuContext.renderBundleBuilder.setSelectedIndicesStorage(
        selectedIndices.current
      );
      webGpuContext.renderBundleBuilder.setFocusedIndicesStorage(
        focusedIndices.current
      );
    } else {
      throw new Error();
    }
  };

  const executeRenderBundles = () => {
    if (webGpuContext?.renderBundleBuilder) {
      webGpuContext.renderBundleBuilder.updateF32UniformBuffer(
        gridContext,
        viewport.current,
        overscroll.current
      );
      webGpuContext.renderBundleBuilder.updateU32UniformBuffer(
        gridContext,
        numCellsToShow.current
      );
      webGpuContext.renderBundleBuilder.updateDrawIndirectBuffer(
        numCellsToShow.current
      );

      webGpuContext.renderBundleBuilder.execute();
    }
  };

  const updateViewport = () => {
    if (!dragStartViewport.current) {
      return;
    }

    const viewportWidth =
      dragStartViewport.current.right - dragStartViewport.current.left;
    const viewportHeight =
      dragStartViewport.current.bottom - dragStartViewport.current.top;

    const dx_cells =
      (viewportWidth * (delta.current.x - overscroll.current.x)) /
      (canvasContext.headerOffset.left - canvasContext.canvasSize.width);
    const dy_cells =
      (viewportHeight * (delta.current.y - overscroll.current.y)) /
      (canvasContext.headerOffset.top - canvasContext.canvasSize.height);

    let newLeft = dragStartViewport.current.left + dx_cells;
    let newRight = dragStartViewport.current.right + dx_cells;
    let newTop = dragStartViewport.current.top + dy_cells;
    let newBottom = dragStartViewport.current.bottom + dy_cells;

    const cellWidth = canvasContext.canvasSize.width / viewportWidth;
    const cellHeight = canvasContext.canvasSize.height / viewportHeight;

    const edgeStress = 1;

    if (newLeft < 0) {
      overscroll.current.x = (-newLeft * cellWidth) / edgeStress;
      // velocity.current.x = 0;
      newLeft = 0;
      newRight = viewportWidth;
    } else if (newRight > gridContext.gridSize.numColumns) {
      overscroll.current.x =
        ((gridContext.gridSize.numColumns - newRight) * cellWidth) / edgeStress;
      // velocity.current.x = 0;
      newLeft = gridContext.gridSize.numColumns - viewportHeight;
      newRight = gridContext.gridSize.numColumns;
    } else {
      //
    }

    if (newTop < 0) {
      overscroll.current.y = (-newTop * cellHeight) / edgeStress;
      // velocity.current.y = 0;
      newTop = 0;
      newBottom = viewportHeight;
    } else if (newBottom > gridContext.gridSize.numRows) {
      overscroll.current.y =
        ((gridContext.gridSize.numRows - newBottom) * cellHeight) / edgeStress;
      // velocity.current.y = 0;
      newTop = gridContext.gridSize.numRows - viewportHeight;
      newBottom = gridContext.gridSize.numRows;
    } else {
      //
    }

    viewport.current = {
      left: newLeft,
      right: newRight,
      top: newTop,
      bottom: newBottom,
    };

    debounceTimerRef.current = undefined;
  };

  const decreaseOverscroll = () => {
    if (isMouseOut.current || !dragStart.current) {
      if (
        Math.abs(overscroll.current.x) > 0.001 ||
        Math.abs(overscroll.current.y) > 0.001
      ) {
        const x = overscroll.current.x * friction;
        const y = overscroll.current.y * friction;
        overscroll.current = { x, y };
      } else {
        overscroll.current = { x: 0, y: 0 };
      }
    }
  };
  /*
    !debounceTimerRef.current && clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
    }, 10);
     */

  const updateNumCellsToShow = () => {
    const numColumnsToShow = Math.min(
      Math.ceil(viewport.current.right) - Math.floor(viewport.current.left),
      gridContext.gridSize.numColumns
    );
    const numRowsToShow = Math.min(
      Math.ceil(viewport.current.bottom) - Math.floor(viewport.current.top),
      gridContext.gridSize.numRows
    );
    numCellsToShow.current = { numColumnsToShow, numRowsToShow };
  };

  const updateFocusedIndices = (indices: number[]) => {
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

  const updateSelectedIndices = (columnIndex: number, rowIndex: number) => {
    const newSelectedIndices = createFilledArray(
      Math.max(gridContext.gridSize.numColumns, gridContext.gridSize.numRows),
      0
    );
    if (columnIndex === -1) {
      if (rowIndex === -1) {
        const filled = newSelectedIndices.some((value) => value > 0);
        newSelectedIndices.fill(filled ? 0 : 1);
      } else {
        for (let i = 0; i < newSelectedIndices.length; i++) {
          if (i < selectedIndices.current.length) {
            const value = selectedIndices.current[i];
            newSelectedIndices[i] =
              rowIndex === i ? (value === 0 ? 1 : 0) : value;
          } else {
            newSelectedIndices[i] = 0;
          }
        }
      }
    } else {
      if (rowIndex === -1) {
        for (let i = 0; i < newSelectedIndices.length; i++) {
          if (i < selectedIndices.current.length) {
            const value = selectedIndices.current[i];
            newSelectedIndices[i] =
              columnIndex === i ? (value === 0 ? 1 : 0) : value;
          } else {
            newSelectedIndices[i] = 0;
          }
        }
      } else {
        for (let i = 0; i < newSelectedIndices.length; i++) {
          if (i < selectedIndices.current.length) {
            const value = selectedIndices.current[i];
            newSelectedIndices[i] =
              rowIndex === i || columnIndex === i
                ? value === 0
                  ? 1
                  : 0
                : value;
          }
        }
      }
    }
    selectedIndices.current = newSelectedIndices;
  };

  const decreaseVelocity = () => {
    if (
      Math.abs(velocity.current.x) > 0.0001 ||
      Math.abs(velocity.current.y) > 0.0001
    ) {
      velocity.current.x *= friction;
      velocity.current.y *= friction;
    } else {
      velocity.current.x = 0;
      velocity.current.y = 0;
    }

    /*
    const currentTime = performance.now();
    if (lastTime.current !== 0) {
      const timeDelta = currentTime - lastTime.current;
      velocity.current = {
        x: (-1 * velocity.current.x) / timeDelta,
        y: (-1 * velocity.current.y) / timeDelta,
      };
    }
    lastTime.current = currentTime;
     */
  };

  function calculateDelta(event: MouseEvent): { x: number; y: number } {
    if (!canvasContext.canvasRef.current || !dragStart.current) {
      throw new Error();
    }
    const rect = canvasContext.canvasRef.current.getBoundingClientRect();
    const x =
      event.clientX -
      rect.left -
      canvasContext.headerOffset.left -
      //overscroll.current.x -
      dragStart.current.x;

    const y =
      event.clientY -
      rect.top -
      canvasContext.headerOffset.top -
      //overscroll.current.y -
      dragStart.current.y;

    return { x, y };
  }

  const tick = () => {
    updateViewport();
    updateNumCellsToShow();
    //decreaseOverscroll();
    //decreaseVelocity();
    executeRenderBundles();
    //requestAnimationFrame(tick);
  };

  const calculateCellPosition = (event: MouseEvent) => {
    console.log(overscroll.current.y, overscroll.current.y);

    const rect = canvasContext.canvasRef.current!.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const columnWidth =
      (canvasContext.canvasSize.width - canvasContext.headerOffset.left) /
      (viewport.current.right - viewport.current.left);
    const rowHeight =
      (canvasContext.canvasSize.height - canvasContext.headerOffset.top) /
      (viewport.current.bottom - viewport.current.top);

    const columnIndex =
      (x - overscroll.current.x - canvasContext.headerOffset.left) /
      columnWidth;
    const rowIndex =
      (y - overscroll.current.y - canvasContext.headerOffset.top) / rowHeight;

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
    canvasContext.canvasRef.current.style.cursor = 'grab';
    const rect = canvasContext.canvasRef.current.getBoundingClientRect();
    if (!dragStart.current) {
      dragStart.current = {
        x: event.clientX - rect.left - canvasContext.headerOffset.left,
        y: event.clientY - rect.top - canvasContext.headerOffset.top,
      };
      dragStartViewport.current = { ...viewport.current };
    } else {
      const cellPosition = calculateCellPosition(event);
      updateSelectedIndices(cellPosition.columnIndex, cellPosition.rowIndex);
    }
  };

  const onMouseUp = () => {
    dragStart.current = null;
    dragStartViewport.current = null;
    canvasContext.canvasRef.current!.style.cursor = 'default';
    tick();
  };

  const onMouseOut = () => {
    focusedIndices.current = [];
    isMouseOut.current = true;
    tick();
  };

  const onMouseEnter = () => {
    isMouseOut.current = false;
    tick();
  };

  const onMouseMove = (event: MouseEvent) => {
    if (
      canvasContext.canvasRef.current &&
      event.buttons === 1 &&
      dragStart.current
    ) {
      canvasContext.canvasRef.current.style.cursor = 'grabbing';
      delta.current = calculateDelta(event);
      tick();
    } else {
      const cellPosition = calculateCellPosition(event);

      updateFocusedIndices([cellPosition.columnIndex, cellPosition.rowIndex]);
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
      newStartColumn < 0 ||
      gridContext.gridSize.numColumns < newEndColumn ||
      newStartRow < 0 ||
      gridContext.gridSize.numRows < newEndRow ||
      newEndColumn - newStartColumn < 1 ||
      newEndRow - newStartRow < 1
    ) {
      return;
    }
    if (
      newEndColumn - newStartColumn > gridContext.gridSize.numColumns ||
      newEndRow - newStartRow > gridContext.gridSize.numRows
    ) {
      return;
    }

    viewport.current = {
      left: newStartColumn,
      right: newEndColumn,
      top: newStartRow,
      bottom: newEndRow,
    };

    tick();
  };

  const round = (value: number, scale: number) => {
    return Math.round(value * scale) / scale;
  };

  useEffect(() => {
    const canvas = canvasContext.canvasRef.current;
    if (canvas && !eventHandlers.current) {
      canvas.addEventListener('mouseup', onMouseUp, { passive: true });
      canvas.addEventListener('mousedown', onMouseDown, { passive: true });
      canvas.addEventListener('mouseenter', onMouseEnter, { passive: true });
      canvas.addEventListener('mouseout', onMouseOut, { passive: true });
      canvas.addEventListener('mousemove', onMouseMove, { passive: true });
      canvas.addEventListener('wheel', onWheel, { passive: true });
      eventHandlers.current = true;
      initRenderBundleBuilder();
      tick();
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('mouseup', onMouseUp);
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mouseenter', onMouseEnter);
        canvas.removeEventListener('mouseout', onMouseOut);
        canvas.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('wheel', onWheel);
        eventHandlers.current = false;
      }
    };
  }, [
    canvasContext.canvasRef,
    eventHandlers.current,
    onMouseDown,
    onMouseMove,
    onWheel,
  ]);

  return (
    <ul>
      <li>
        viewport left={viewport.current.left}, top={viewport.current.top},
        right=
        {viewport.current.right}, bottom={viewport.current.bottom}
      </li>
      <li>
        overscroll x={overscroll.current.x}, y=
        {overscroll.current.y}
      </li>
      <li>
        numColumnsToShow={numCellsToShow.current.numColumnsToShow},
        numRowsToShow={numCellsToShow.current.numRowsToShow}
      </li>
    </ul>
  );
};

export default GridUI;
