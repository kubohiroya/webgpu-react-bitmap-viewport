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

const edgeFriction = 0.8;
const translateFriction = 0.975;

export const GridUI = () => {
  const webGpuContext = useWebGPUContext();
  const viewportContext = useViewportContext();
  const gridContext = useGridContext();
  const canvasContext = useCanvasElementContext();
  const tickerRef = useRef<NodeJS.Timeout>();

  const viewport = useRef<{
    top: number;
    bottom: number;
    left: number;
    right: number;
  }>(
    viewportContext.initialViewport || {
      top: 0,
      bottom: gridContext.gridSize.numRows,
      left: 0,
      right: gridContext.gridSize.numColumns,
    }
  );

  const overscroll = useRef<{ x: number; y: number }>(
    viewportContext.initialOverscroll || {
      x: 0,
      y: 0,
    }
  );

  const numCellsToShow = useRef<{
    numColumnsToShow: number;
    numRowsToShow: number;
  }>({
    numColumnsToShow: 0,
    numRowsToShow: 0,
  });

  const focusedIndices = useRef<number[]>([]);
  const selectedIndices = useRef<number[]>([]);

  const pointerState = useRef<{
    start: { x: number; y: number };
    previous: { x: number; y: number };
    startViewport: { top: number; bottom: number; left: number; right: number };
    startViewportSize: { width: number; height: number };
    startCellSize: { width: number; height: number };
    delta: { x: number; y: number };
  } | null>(null);

  const velocity = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const eventHandlers = useRef<boolean>(false);

  const regulateViewport = (
    startViewportSize: {
      width: number;
      height: number;
    },
    startCellSize: {
      width: number;
      height: number;
    },
    newViewport: {
      left: number;
      top: number;
      right: number;
      bottom: number;
    }
  ) => {
    const horizontalUnderflow = newViewport.left < 0;
    const horizontalOverflow =
      newViewport.right > gridContext.gridSize.numColumns;
    const verticalUnderflow = newViewport.top < 0;
    const verticalOverflow = newViewport.bottom > gridContext.gridSize.numRows;

    if (horizontalUnderflow) {
      velocity.current.x = 0;
      if (horizontalOverflow) {
        overscroll.current.x = 0;
        viewport.current.left = 0;
        viewport.current.right = gridContext.gridSize.numColumns;
      } else {
        overscroll.current.x = newViewport.left * startCellSize.width;
        viewport.current.left = 0;
        viewport.current.right = startViewportSize.width;
      }
    } else if (horizontalOverflow) {
      velocity.current.x = 0;
      overscroll.current.x =
        (newViewport.right - gridContext.gridSize.numColumns) *
        startCellSize.width;
      viewport.current.left =
        gridContext.gridSize.numColumns - startViewportSize.width;
      viewport.current.right = gridContext.gridSize.numColumns;
    } else if (!verticalOverflow && !verticalUnderflow) {
      viewport.current.left = newViewport.left;
      viewport.current.right = newViewport.right;
      overscroll.current.x = 0;
    }

    if (verticalUnderflow) {
      velocity.current.y = 0;
      if (verticalOverflow) {
        overscroll.current.y = 0;
        viewport.current.top = 0;
        viewport.current.bottom = gridContext.gridSize.numRows;
      } else {
        overscroll.current.y = newViewport.top * startCellSize.height;
        viewport.current.top = 0;
        viewport.current.bottom = startViewportSize.height;
      }
    } else if (verticalOverflow) {
      velocity.current.y = 0;
      overscroll.current.y =
        (newViewport.bottom - gridContext.gridSize.numRows) *
        startCellSize.height;
      viewport.current.top =
        gridContext.gridSize.numRows - startViewportSize.height;
      viewport.current.bottom = gridContext.gridSize.numRows;
    } else if (!horizontalOverflow && !horizontalUnderflow) {
      viewport.current.top = newViewport.top;
      viewport.current.bottom = newViewport.bottom;
      overscroll.current.y = 0;
    }
  };

  const updateViewport = () => {
    if (pointerState.current) {
      const viewportWidth =
        pointerState.current.startViewport.right -
        pointerState.current.startViewport.left;
      const viewportHeight =
        pointerState.current.startViewport.bottom -
        pointerState.current.startViewport.top;
      const dx =
        (viewportWidth * pointerState.current.delta.x) /
        (canvasContext.canvasSize.width - canvasContext.headerOffset.left);
      const dy =
        (viewportHeight * pointerState.current.delta.y) /
        (canvasContext.canvasSize.height - canvasContext.headerOffset.top);
      const newViewport = {
        left: pointerState.current.startViewport.left - dx,
        right: pointerState.current.startViewport.right - dx,
        top: pointerState.current.startViewport.top - dy,
        bottom: pointerState.current.startViewport.bottom - dy,
      };

      regulateViewport(
        pointerState.current.startViewportSize,
        pointerState.current.startCellSize,
        newViewport
      );
    } else {
      const startViewportSize = {
        width: viewport.current.right - viewport.current.left,
        height: viewport.current.bottom - viewport.current.top,
      };

      regulateViewport(
        startViewportSize,
        {
          width:
            (canvasContext.canvasSize.width - canvasContext.headerOffset.left) /
            startViewportSize.width,
          height:
            (canvasContext.canvasSize.height - canvasContext.headerOffset.top) /
            startViewportSize.height,
        },
        {
          left: viewport.current.left + velocity.current.x,
          right: viewport.current.right + velocity.current.x,
          top: viewport.current.top + velocity.current.y,
          bottom: viewport.current.bottom + velocity.current.y,
        }
      );
    }
  };

  const updateFocusedIndices = (indices: number[]) => {
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

  const tick = () => {
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

    updateViewport();
    updateNumCellsToShow();
    executeRenderBundles();
  };

  const calculateCellPosition = (clientX: number, clientY: number) => {
    const rect = canvasContext.canvasRef.current!.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

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
      columnIndex: Math.floor(
        columnIndex >= 0 &&
          columnIndex + viewport.current.left < gridContext.gridSize.numColumns
          ? columnIndex + viewport.current.left
          : -1
      ),
      rowIndex: Math.floor(
        rowIndex >= 0 &&
          rowIndex + viewport.current.top < gridContext.gridSize.numRows
          ? rowIndex + viewport.current.top
          : -1
      ),
    };
  };

  const onDown = (x: number, y: number) => {
    if (canvasContext.canvasRef.current === null) {
      return;
    }
    canvasContext.canvasRef.current.style.cursor = 'grab';

    const cellPosition = calculateCellPosition(x, y);
    if (cellPosition.columnIndex !== -1 && cellPosition.rowIndex !== -1) {
      pointerState.current = {
        start: {
          x,
          y,
        },
        previous: {
          x,
          y,
        },
        startViewportSize: {
          width: viewport.current.right - viewport.current.left,
          height: viewport.current.bottom - viewport.current.top,
        },
        startCellSize: {
          width:
            (canvasContext.canvasSize.width - canvasContext.headerOffset.left) /
            (viewport.current.right - viewport.current.left),
          height:
            (canvasContext.canvasSize.height - canvasContext.headerOffset.top) /
            (viewport.current.bottom - viewport.current.top),
        },
        startViewport: { ...viewport.current },
        delta: {
          x: 0,
          y: 0,
        },
      };
    } else {
      updateSelectedIndices(cellPosition.columnIndex, cellPosition.rowIndex);
      webGpuContext?.renderBundleBuilder?.setSelectedIndicesStorage(
        selectedIndices.current
      );
      console.log(selectedIndices.current);
      startInertia();
    }
  };

  const onMouseDown = (event: MouseEvent) => {
    onDown(event.clientX, event.clientY);
  };

  const onTouchStart = (event: TouchEvent) => {
    onDown(event.touches[0].clientX, event.touches[0].clientY);
  };

  const onUp = () => {
    canvasContext.canvasRef.current!.style.cursor = 'default';
    pointerState.current = null;
    updateFocusedIndices([]);
    webGpuContext?.renderBundleBuilder?.setFocusedIndicesStorage(
      focusedIndices.current
    );
    startInertia();
  };

  const onMouseUp = () => {
    onUp();
  };

  const onTouchEnd = (event: TouchEvent) => {
    onUp();
  };

  const onMouseOut = () => {
    canvasContext.canvasRef.current!.style.cursor = 'default';
    pointerState.current = null;
    updateFocusedIndices([]);
    webGpuContext?.renderBundleBuilder?.setFocusedIndicesStorage(
      focusedIndices.current
    );
    startInertia();
  };

  const onMouseEnter = () => {
    startInertia();
  };

  const onMove = (
    clientX: number,
    clientY: number,
    movementX: number,
    movementY: number
  ) => {
    if (!canvasContext.canvasRef.current || !pointerState.current) {
      throw new Error();
    }
    const x = clientX - pointerState.current.start.x;
    const y = clientY - pointerState.current.start.y;
    pointerState.current.delta = { x, y };
    velocity.current = {
      x: -movementX / canvasContext.canvasSize.width,
      y: -movementY / canvasContext.canvasSize.height,
    };
  };

  const onSelect = (clientX: number, clientY: number) => {
    const cellPosition = calculateCellPosition(clientX, clientY);
    const regulatedCellPosition = [
      cellPosition.columnIndex,
      cellPosition.rowIndex,
    ];
    updateFocusedIndices(regulatedCellPosition);
    webGpuContext?.renderBundleBuilder?.setFocusedIndicesStorage(
      focusedIndices.current
    );
  };

  const onMouseMove = (event: MouseEvent) => {
    if (
      canvasContext.canvasRef.current &&
      event.buttons === 1 &&
      pointerState.current
    ) {
      canvasContext.canvasRef.current.style.cursor = 'grabbing';
      onMove(event.clientX, event.clientY, event.movementX, event.movementY);
    } else {
      onSelect(event.clientX, event.clientY);
    }
    startInertia();
  };

  const onTouchMove = (event: TouchEvent) => {
    if (
      canvasContext.canvasRef.current &&
      event.touches.length >= 2 &&
      pointerState.current
    ) {
      canvasContext.canvasRef.current.style.cursor = 'grabbing';
      onMove(
        event.touches[0].clientX,
        event.touches[0].clientY,
        event.touches[0].clientX - pointerState.current.previous.x,
        event.touches[0].clientY - pointerState.current.previous.y
      );
      pointerState.current.previous = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    } else {
      onSelect(event.touches[0].clientX, event.touches[0].clientY);
    }
    startInertia();
  };

  const onWheel = (event: WheelEvent) => {
    if (event.deltaY === 0 || !canvasContext.canvasRef.current) {
      return;
    }

    const scale = event.deltaY > 0 ? 1.03 : 0.98;
    const rect = canvasContext.canvasRef.current.getBoundingClientRect();
    const dx = event.clientX - rect.left - canvasContext.headerOffset.left;
    const dy = event.clientY - rect.top - canvasContext.headerOffset.top;

    const viewportSize = {
      width: viewport.current.right - viewport.current.left,
      height: viewport.current.bottom - viewport.current.top,
    };

    const cx =
      (viewportSize.width * dx) /
        (canvasContext.canvasSize.width - canvasContext.headerOffset.left) +
      viewport.current.left;
    const cy =
      (viewportSize.height * dy) /
        (canvasContext.canvasSize.height - canvasContext.headerOffset.top) +
      viewport.current.top;

    let left = cx + (viewport.current.left - cx) * scale;
    let right = cx + (viewport.current.right - cx) * scale;
    let top = cy + (viewport.current.top - cy) * scale;
    let bottom = cy + (viewport.current.bottom - cy) * scale;

    const horizontalUnderflow = -1 * left;
    const verticalUnderflow = -1 * top;
    const horizontalOverflow = right - gridContext.gridSize.numColumns;
    const verticalOverflow = bottom - gridContext.gridSize.numRows;

    if (left < 0 && gridContext.gridSize.numColumns < right) {
      left = 0;
      right = viewport.current.right;
    } else if (left < 0) {
      left = 0;
      right += horizontalUnderflow;
    } else if (gridContext.gridSize.numColumns < right) {
      right = gridContext.gridSize.numColumns;
      left -= horizontalOverflow;
    }

    if (top < 0 && gridContext.gridSize.numRows < bottom) {
      top = 0;
      bottom = viewport.current.bottom;
    } else if (top < 0) {
      top = 0;
      bottom += verticalUnderflow;
    } else if (gridContext.gridSize.numRows < bottom) {
      bottom = gridContext.gridSize.numRows;
      top -= verticalOverflow;
    }

    regulateViewport(
      {
        width: right - left,
        height: bottom - top,
      },
      {
        width:
          (canvasContext.canvasSize.width - canvasContext.headerOffset.left) /
            right -
          left,
        height:
          (canvasContext.canvasSize.height - canvasContext.headerOffset.top) /
            bottom -
          top,
      },
      {
        left,
        right,
        top,
        bottom,
      }
    );

    startInertia();
  };

  const round = (value: number, scale: number) => {
    return Math.round(value * scale) / scale;
  };

  const startInertia = () => {
    if (tickerRef.current) {
      return;
    }
    tickerRef.current = setInterval(() => {
      if (!pointerState.current) {
        const decreaseOverscroll = () => {
          if (
            Math.abs(overscroll.current.x) > 0.1 ||
            Math.abs(overscroll.current.y) > 0.1
          ) {
            const x = overscroll.current.x * edgeFriction;
            const y = overscroll.current.y * edgeFriction;
            overscroll.current = { x, y };
            return true;
          } else {
            overscroll.current = { x: 0, y: 0 };
          }
          return false;
        };

        const decreaseVelocity = () => {
          if (
            Math.abs(velocity.current.x) > 0.01 ||
            Math.abs(velocity.current.y) > 0.01
          ) {
            velocity.current.x *= translateFriction;
            velocity.current.y *= translateFriction;
            return true;
          } else {
            velocity.current.x = 0;
            velocity.current.y = 0;
          }
          return false;
        };

        const isOverscrollActive = decreaseOverscroll();
        const isVelocityActive = decreaseVelocity();
        if (!isOverscrollActive && !isVelocityActive) {
          clearInterval(tickerRef.current);
          tickerRef.current = undefined;
        }
      }
      requestAnimationFrame(tick);
    }, 16); // 約60fpsでアニメーション
  };

  useEffect(() => {
    const canvas = canvasContext.canvasRef.current;
    if (canvas && !eventHandlers.current) {
      canvas.addEventListener('mousedown', onMouseDown, { passive: true });
      canvas.addEventListener('mousemove', onMouseMove, { passive: true });
      canvas.addEventListener('mouseup', onMouseUp, { passive: true });
      canvas.addEventListener('touchstart', onTouchStart, { passive: true });
      canvas.addEventListener('touchmove', onTouchMove, { passive: true });
      canvas.addEventListener('touchend', onTouchEnd, { passive: true });
      canvas.addEventListener('mouseenter', onMouseEnter, { passive: true });
      canvas.addEventListener('mouseout', onMouseOut, { passive: true });
      canvas.addEventListener('wheel', onWheel, { passive: true });
      eventHandlers.current = true;

      const initRenderBundleBuilder = () => {
        if (webGpuContext?.renderBundleBuilder) {
          webGpuContext.renderBundleBuilder.setDataBufferStorage(
            gridContext.data
          );
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

      initRenderBundleBuilder();
      tick();
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('mouseup', onMouseUp);
        canvas.removeEventListener('touchstart', onTouchStart);
        canvas.removeEventListener('touchmove', onTouchMove);
        canvas.removeEventListener('touchend', onTouchEnd);
        canvas.removeEventListener('mouseenter', onMouseEnter);
        canvas.removeEventListener('mouseout', onMouseOut);
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

  return null;
};

export default GridUI;
