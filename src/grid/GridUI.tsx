import { useEffect, useRef } from 'react';
import { useCanvasElementContext } from './CanvasElementContext';
import { useViewportContext } from './ViewportContext';
import { useGridContext } from './GridContext';
import { useWebGPUContext } from './WebGPUContext';

const createFilledArray = (size: number, value: number) => {
  const newArray = new Array<number>(size);
  newArray.fill(value);
  return newArray;
};

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

  const viewportOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const velocity = useRef<{ x: number; y: number } | null>(null);
  const lastTime = useRef<number>(0);

  const eventHandlers = useRef<boolean>(false);

  const getMousePosition = (event: MouseEvent) => {
    const rect = canvasContext.canvasRef.current!.getBoundingClientRect();
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
    canvasContext.canvasRef.current.style.cursor = 'grab';
    const rect = canvasContext.canvasRef.current.getBoundingClientRect();
    if (!dragStart.current) {
      dragStart.current = {
        x: event.clientX - rect.left - canvasContext.headerOffset.left,
        y: event.clientY - rect.top - canvasContext.headerOffset.top,
      };
      dragStartViewport.current = { ...viewport.current };
    } else {
      const mousePosition = getMousePosition(event);
      selectedIndices.current = [
        mousePosition.columnIndex,
        mousePosition.rowIndex,
      ];
    }
  };

  const onMouseUp = () => {
    dragStart.current = null;
    dragStartViewport.current = null;

    canvasContext.canvasRef.current!.style.cursor = 'default';
    //velocity.current && updateVelocity(velocity.current);
    requestAnimationFrame(tick);
  };

  const onMouseOut = () => {
    focusedIndices.current = [];
  };

  /*
  const updateVelocity = (_velocity: { x: number; y: number }) => {
    const currentTime = performance.now();
    if (lastTime.current !== 0) {
      const timeDelta = currentTime - lastTime.current;
      velocity.current = {
        x: (-1 * _velocity.x) / timeDelta,
        y: (-1 * _velocity.y) / timeDelta,
      };
    }
    lastTime.current = currentTime;
  };

   */

  function calculateDelta(event: MouseEvent): null | { x: number; y: number } {
    if (
      canvasContext.canvasRef.current &&
      event.buttons === 1 &&
      dragStart.current
    ) {
      const rect = canvasContext.canvasRef.current.getBoundingClientRect();
      const x =
        event.clientX -
        rect.left -
        canvasContext.headerOffset.left -
        dragStart.current.x;

      const y =
        event.clientY -
        rect.top -
        canvasContext.headerOffset.top -
        dragStart.current.y;
      return { x, y };
    } else {
      return null;
    }
  }

  const onMouseMove = (event: MouseEvent) => {
    if (
      canvasContext.canvasRef.current &&
      event.buttons === 1 &&
      dragStart.current
    ) {
      canvasContext.canvasRef.current.style.cursor = 'grabbing';
      const delta = calculateDelta(event);
      if (delta) {
        updateViewport(delta);
        updateNumCellsToShow();
        requestAnimationFrame(tick);
      }
    } else {
      const mousePosition = getMousePosition(event);

      onUpdateFocusedIndices([
        mousePosition.columnIndex,
        mousePosition.rowIndex,
      ]);
    }
  };

  const updateViewport = (diff: { x: number; y: number }) => {
    if (!dragStartViewport.current) {
      return;
    }

    const dx_cells =
      (-1 * (viewport.current.right - viewport.current.left) * diff.x) /
      (canvasContext.canvasSize.width - canvasContext.headerOffset.left);
    const dy_cells =
      (-1 * ((viewport.current.bottom - viewport.current.top) * diff.y)) /
      (canvasContext.canvasSize.height - canvasContext.headerOffset.top);

    const horizontalUnderflow =
      (dragStartViewport.current.left + dx_cells) * -1;
    const horizontalOverflow =
      dragStartViewport.current.right +
      dx_cells -
      gridContext.gridSize.numColumns;
    const verticalUnderflow = (dragStartViewport.current.top + dy_cells) * -1;
    const verticalOverflow =
      dragStartViewport.current.bottom +
      dy_cells -
      gridContext.gridSize.numRows;

    if (viewportOffset.current.x === 0) {
      viewportOffset.current.x =
        horizontalOverflow > 0
          ? horizontalOverflow * 10 + 1
          : horizontalUnderflow > 0
          ? horizontalUnderflow * -10 - 1
          : 0;
    }
    if (viewportOffset.current.y === 0) {
      viewportOffset.current.y =
        verticalOverflow > 0
          ? verticalOverflow * 10 + 1
          : verticalUnderflow > 0
          ? verticalUnderflow * -10 - 1
          : 0;
    }

    const leftRight =
      horizontalUnderflow > 0 && horizontalOverflow < 0
        ? {
            left: 0,
            right:
              dragStartViewport.current.right + dx_cells + horizontalUnderflow,
          }
        : horizontalUnderflow < 0 && horizontalOverflow > 0
        ? {
            left:
              dragStartViewport.current.left + dx_cells - horizontalOverflow,
            right: gridContext.gridSize.numColumns,
          }
        : horizontalUnderflow > 0 && horizontalOverflow > 0
        ? { left: 0, right: gridContext.gridSize.numColumns }
        : {
            left: dragStartViewport.current.left + dx_cells,
            right: dragStartViewport.current.right + dx_cells,
          };

    const topBottom =
      verticalUnderflow > 0 && verticalOverflow <= 0
        ? {
            top: 0,
            bottom:
              dragStartViewport.current.bottom + dy_cells + verticalUnderflow,
          }
        : verticalUnderflow < 0 && verticalOverflow > 0
        ? {
            top: dragStartViewport.current.top + dy_cells - verticalOverflow,
            bottom: gridContext.gridSize.numRows,
          }
        : verticalUnderflow > 0 && verticalOverflow > 0
        ? { top: 0, bottom: gridContext.gridSize.numRows }
        : {
            top: dragStartViewport.current.top + dy_cells,
            bottom: dragStartViewport.current.bottom + dy_cells,
          };

    const newViewport = {
      ...leftRight,
      ...topBottom,
    };

    debounceTimerRef.current = undefined;
    viewport.current = newViewport;
  };
  /*
    !debounceTimerRef.current && clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
    }, 10);
     */

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
      console.log('Out of bounds! (1)');
      return;
    }
    if (
      newEndColumn - newStartColumn > gridContext.gridSize.numColumns ||
      newEndRow - newStartRow > gridContext.gridSize.numRows
    ) {
      console.log('Out of bounds! (2)');
      return;
    }

    const newViewport = {
      left: newStartColumn,
      right: newEndColumn,
      top: newStartRow,
      bottom: newEndRow,
    };

    viewport.current = newViewport;
    updateNumCellsToShow();
    tick();
  };

  const updateNumCellsToShow = () => {
    const numColumnsToShow = Math.min(
      Math.ceil(viewport.current.right) - Math.floor(viewport.current.left) + 1,
      gridContext.gridSize.numColumns
    );
    const numRowsToShow = Math.min(
      Math.ceil(viewport.current.bottom) - Math.floor(viewport.current.top) + 1,
      gridContext.gridSize.numRows
    );
    numCellsToShow.current = { numColumnsToShow, numRowsToShow };
  };

  /*
  const updateViewport = (newViewport: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  }) => {
    viewport.current = { ...newViewport };
  };
   */

  const tick = () => {
    const friction = 0.999;

    const [x, y] = [
      Math.abs(viewportOffset.current.x),
      Math.abs(viewportOffset.current.y),
    ];
    if (x >= 1 || y >= 1) {
      viewportOffset.current.x *= friction;
      viewportOffset.current.y *= friction;
    } else {
      viewportOffset.current.x = 0;
      viewportOffset.current.y = 0;
    }

    if (webGpuContext?.renderBundleBuilder) {
      webGpuContext.renderBundleBuilder.updateF32UniformBuffer(
        gridContext,
        viewport.current,
        viewportOffset.current
      );
      webGpuContext.renderBundleBuilder.updateU32UniformBuffer(
        gridContext,
        numCellsToShow.current
      );
      webGpuContext.renderBundleBuilder.updateDrawIndirectBuffer(
        numCellsToShow.current
      );

      requestAnimationFrame(() => {
        if (webGpuContext.renderBundleBuilder) {
          webGpuContext.renderBundleBuilder.execute();
        }
      });
      /*
      if (!dragStart.current && velocity.current) {
        velocity.current = {
          x: velocity.current.x * friction,
          y: velocity.current.y * friction,
        };
        if (
          (Math.abs(velocity.current.x) > 0.01 ||
            Math.abs(velocity.current.y) > 0.01) &&
          velocity.current
        ) {
        } else {
          dragStart.current = null;
        }
      }
       */
    }
  };

  const drawFrame = () => {
    if (webGpuContext?.renderBundleBuilder) {
      updateNumCellsToShow();

      webGpuContext.renderBundleBuilder.setDataBufferStorage(gridContext.data);

      webGpuContext.renderBundleBuilder.setSelectedIndicesStorage(
        selectedIndices.current
      );
      webGpuContext.renderBundleBuilder.setFocusedIndicesStorage(
        focusedIndices.current
      );
      webGpuContext.renderBundleBuilder.updateU32UniformBuffer(
        gridContext,
        numCellsToShow.current
      );

      webGpuContext.renderBundleBuilder.updateF32UniformBuffer(
        gridContext,
        viewport.current,
        viewportOffset.current
      );

      webGpuContext.renderBundleBuilder.updateDrawIndirectBuffer(
        numCellsToShow.current
      );
      webGpuContext.renderBundleBuilder.execute();
    }
  };

  const onUpdateFocusedIndices = (indices: number[]) => {
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

  useEffect(() => drawFrame(), []);

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

  return null;
};

export default GridUI;
