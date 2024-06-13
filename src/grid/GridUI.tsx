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

const POINTER_CONTEXT_BODY = 0;
const POINTER_CONTEXT_HEADER = -1;
const POINTER_CONTEXT_SCROLLBAR = -2;
const POINTER_CONTEXT_SCROLLBAR_LOWER = -3;
const POINTER_CONTEXT_SCROLLBAR_HIGHER = -4;

const FOCUS_STATE_DEFAULT = 0;
const FOCUS_STATE_HORIZONTAL_FOCUSED = 1;
const FOCUS_STATE_VERTICAL_FOCUSED = 2;

const SELECT_STATE_DEFAULT = 0;
const SELECT_STATE_SELECTED = 1;

const SCROLLBAR_STATE_DEFAULT = 0;
const SCROLLBAR_STATE_HORIZONTAL_FOCUSED = 1;
const SCROLLBAR_STATE_VERTICAL_FOCUSED = 2;

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

  const scrollBarState = useRef<number>(SCROLLBAR_STATE_DEFAULT);

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
    const enableOverscroll = scrollBarState.current === SCROLLBAR_STATE_DEFAULT;

    if (horizontalUnderflow) {
      velocity.current.x = 0;
      if (horizontalOverflow) {
        viewport.current.left = 0;
        viewport.current.right = gridContext.gridSize.numColumns;
        if (enableOverscroll) {
          overscroll.current.x = 0;
        }
      } else {
        viewport.current.left = 0;
        viewport.current.right = startViewportSize.width;
        if (enableOverscroll) {
          overscroll.current.x = newViewport.left * startCellSize.width;
        }
      }
    } else if (horizontalOverflow) {
      velocity.current.x = 0;
      viewport.current.left =
        gridContext.gridSize.numColumns - startViewportSize.width;
      viewport.current.right = gridContext.gridSize.numColumns;
      if (enableOverscroll) {
        overscroll.current.x =
          (newViewport.right - gridContext.gridSize.numColumns) *
          startCellSize.width;
      }
    } else if (!verticalOverflow && !verticalUnderflow) {
      viewport.current.left = newViewport.left;
      viewport.current.right = newViewport.right;
      if (enableOverscroll) {
        overscroll.current.x = 0;
      }
    }

    if (verticalUnderflow) {
      velocity.current.y = 0;
      if (verticalOverflow) {
        viewport.current.top = 0;
        viewport.current.bottom = gridContext.gridSize.numRows;
        if (enableOverscroll) {
          overscroll.current.y = 0;
        }
      } else {
        viewport.current.top = 0;
        viewport.current.bottom = startViewportSize.height;
        if (enableOverscroll) {
          overscroll.current.y = newViewport.top * startCellSize.height;
        }
      }
    } else if (verticalOverflow) {
      velocity.current.y = 0;
      viewport.current.top =
        gridContext.gridSize.numRows - startViewportSize.height;
      viewport.current.bottom = gridContext.gridSize.numRows;
      if (enableOverscroll) {
        overscroll.current.y =
          (newViewport.bottom - gridContext.gridSize.numRows) *
          startCellSize.height;
      }
    } else if (!horizontalOverflow && !horizontalUnderflow) {
      viewport.current.top = newViewport.top;
      viewport.current.bottom = newViewport.bottom;
      if (enableOverscroll) {
        overscroll.current.y = 0;
      }
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

      const [dx, dy] =
        scrollBarState.current === SCROLLBAR_STATE_HORIZONTAL_FOCUSED
          ? [
              (-1 *
                (gridContext.gridSize.numColumns *
                  pointerState.current.delta.x)) /
                (canvasContext.canvasSize.width -
                  canvasContext.headerOffset.left),
              0,
            ]
          : scrollBarState.current === SCROLLBAR_STATE_VERTICAL_FOCUSED
          ? [
              0,
              (-1 *
                (gridContext.gridSize.numRows * pointerState.current.delta.y)) /
                (canvasContext.canvasSize.height -
                  canvasContext.headerOffset.top),
            ]
          : [
              (viewportWidth * pointerState.current.delta.x) /
                (canvasContext.canvasSize.width -
                  canvasContext.headerOffset.left),
              (viewportHeight * pointerState.current.delta.y) /
                (canvasContext.canvasSize.height -
                  canvasContext.headerOffset.top),
            ];

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
      FOCUS_STATE_DEFAULT
    );
    if (indices.length >= 1 && indices[0] >= 0) {
      newFocusedIndices[indices[0]] += FOCUS_STATE_HORIZONTAL_FOCUSED;
    }
    if (indices.length >= 2 && indices[1] >= 0) {
      newFocusedIndices[indices[1]] += FOCUS_STATE_VERTICAL_FOCUSED;
    }
    focusedIndices.current = newFocusedIndices;
  };

  const updateSelectedIndices = (columnIndex: number, rowIndex: number) => {
    const newSelectedIndices = createFilledArray(
      Math.max(gridContext.gridSize.numColumns, gridContext.gridSize.numRows),
      0
    );
    if (columnIndex === POINTER_CONTEXT_HEADER) {
      if (rowIndex === POINTER_CONTEXT_HEADER) {
        const filled = newSelectedIndices.some((value) => value > 0);
        newSelectedIndices.fill(filled ? 0 : 1);
      } else {
        for (let i = 0; i < newSelectedIndices.length; i++) {
          if (i < selectedIndices.current.length) {
            const value = selectedIndices.current[i];
            newSelectedIndices[i] =
              rowIndex === i
                ? value === SELECT_STATE_DEFAULT
                  ? SELECT_STATE_SELECTED
                  : SELECT_STATE_DEFAULT
                : value;
          } else {
            newSelectedIndices[i] = SELECT_STATE_DEFAULT;
          }
        }
      }
    } else {
      if (rowIndex === POINTER_CONTEXT_HEADER) {
        for (let i = 0; i < newSelectedIndices.length; i++) {
          if (i < selectedIndices.current.length) {
            const value = selectedIndices.current[i];
            newSelectedIndices[i] =
              columnIndex === i
                ? value === SELECT_STATE_SELECTED
                  ? SELECT_STATE_DEFAULT
                  : SELECT_STATE_SELECTED
                : value;
          } else {
            newSelectedIndices[i] = SELECT_STATE_DEFAULT;
          }
        }
      } else {
        for (let i = 0; i < newSelectedIndices.length; i++) {
          if (i < selectedIndices.current.length) {
            const value = selectedIndices.current[i];
            newSelectedIndices[i] =
              rowIndex === i || columnIndex === i
                ? value === SELECT_STATE_DEFAULT
                  ? SELECT_STATE_SELECTED
                  : SELECT_STATE_DEFAULT
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
          numCellsToShow.current,
          scrollBarState.current
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

    const isInsideHorizontalBody =
      columnIndex >= 0 &&
      columnIndex + viewport.current.left < gridContext.gridSize.numColumns;
    const isInsideVerticalBody =
      rowIndex >= 0 &&
      rowIndex + viewport.current.top < gridContext.gridSize.numRows;
    if (isInsideHorizontalBody) {
      if (isInsideVerticalBody) {
        if (
          canvasContext.canvasSize.width -
            canvasContext.scrollBar.margin -
            canvasContext.scrollBar.radius * 2 <=
            x &&
          x <= canvasContext.canvasSize.width - canvasContext.scrollBar.margin
        ) {
          const header = overscroll.current.y + canvasContext.headerOffset.top;
          const topEdge =
            header -
            canvasContext.scrollBar.radius +
            ((canvasContext.canvasSize.height -
              header -
              canvasContext.scrollBar.radius * 2) *
              viewport.current.top) /
              gridContext.gridSize.numRows;
          const bottomEdge =
            header +
            canvasContext.scrollBar.radius * 2 +
            ((canvasContext.canvasSize.height -
              header -
              canvasContext.scrollBar.radius * 2) *
              viewport.current.bottom) /
              gridContext.gridSize.numRows;

          if (header <= y && y < topEdge) {
            return {
              columnIndex: POINTER_CONTEXT_BODY,
              rowIndex: POINTER_CONTEXT_SCROLLBAR_LOWER,
            };
          } else if (y < bottomEdge) {
            return {
              columnIndex: POINTER_CONTEXT_BODY,
              rowIndex: POINTER_CONTEXT_SCROLLBAR,
            };
          } else {
            return {
              columnIndex: POINTER_CONTEXT_BODY,
              rowIndex: POINTER_CONTEXT_SCROLLBAR_HIGHER,
            };
          }
        }
        if (
          canvasContext.canvasSize.height -
            canvasContext.scrollBar.margin -
            canvasContext.scrollBar.radius * 2 <=
            y &&
          y <= canvasContext.canvasSize.height - canvasContext.scrollBar.margin
        ) {
          const header = overscroll.current.x + canvasContext.headerOffset.left;
          const leftEdge =
            header -
            canvasContext.scrollBar.radius +
            ((canvasContext.canvasSize.width -
              header -
              canvasContext.scrollBar.radius * 2) *
              viewport.current.left) /
              gridContext.gridSize.numColumns;
          const rightEdge =
            header +
            canvasContext.scrollBar.radius * 2 +
            ((canvasContext.canvasSize.width -
              header -
              canvasContext.scrollBar.radius * 2) *
              viewport.current.right) /
              gridContext.gridSize.numColumns;

          if (header <= x && x < leftEdge) {
            return {
              columnIndex: POINTER_CONTEXT_SCROLLBAR_LOWER,
              rowIndex: POINTER_CONTEXT_BODY,
            };
          } else if (x < rightEdge) {
            return {
              columnIndex: POINTER_CONTEXT_SCROLLBAR,
              rowIndex: POINTER_CONTEXT_BODY,
            };
          } else {
            return {
              columnIndex: POINTER_CONTEXT_SCROLLBAR_HIGHER,
              rowIndex: POINTER_CONTEXT_BODY,
            };
          }
        }
        return {
          columnIndex: Math.floor(columnIndex + viewport.current.left),
          rowIndex: Math.floor(rowIndex + viewport.current.top),
        };
      } else {
        return {
          columnIndex: Math.floor(columnIndex + viewport.current.left),
          rowIndex: POINTER_CONTEXT_HEADER,
        };
      }
    } else {
      if (isInsideVerticalBody) {
        return {
          columnIndex: POINTER_CONTEXT_HEADER,
          rowIndex: Math.floor(rowIndex + viewport.current.top),
        };
      } else {
        return {
          columnIndex: POINTER_CONTEXT_HEADER,
          rowIndex: POINTER_CONTEXT_HEADER,
        };
      }
    }
  };

  const onDown = (x: number, y: number) => {
    if (canvasContext.canvasRef.current === null) {
      return;
    }

    const cellPosition = calculateCellPosition(x, y);

    if (
      cellPosition.columnIndex === POINTER_CONTEXT_HEADER ||
      cellPosition.rowIndex === POINTER_CONTEXT_HEADER
    ) {
      canvasContext.canvasRef.current.style.cursor = 'grab';
      updateSelectedIndices(cellPosition.columnIndex, cellPosition.rowIndex);
      webGpuContext?.renderBundleBuilder?.setSelectedIndicesStorage(
        selectedIndices.current
      );
    }

    if (
      (cellPosition.columnIndex >= 0 && cellPosition.rowIndex >= 0) ||
      cellPosition.columnIndex === POINTER_CONTEXT_HEADER ||
      cellPosition.rowIndex === POINTER_CONTEXT_HEADER ||
      cellPosition.columnIndex === POINTER_CONTEXT_SCROLLBAR ||
      cellPosition.rowIndex === POINTER_CONTEXT_SCROLLBAR
    ) {
      canvasContext.canvasRef.current.style.cursor = 'grab';
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
      return;
    } else if (cellPosition.columnIndex === POINTER_CONTEXT_SCROLLBAR_LOWER) {
      if (viewport.current.left * 2 - viewport.current.right < 0) {
        viewport.current = {
          ...viewport.current,
          left: 0,
          right: viewport.current.right - viewport.current.left,
        };
      } else {
        viewport.current = {
          ...viewport.current,
          left: viewport.current.left * 2 - viewport.current.right,
          right: viewport.current.left,
        };
      }
    } else if (cellPosition.rowIndex === POINTER_CONTEXT_SCROLLBAR_LOWER) {
      if (viewport.current.top * 2 - viewport.current.bottom < 0) {
        viewport.current = {
          ...viewport.current,
          top: 0,
          bottom: viewport.current.bottom - viewport.current.top,
        };
      } else {
        viewport.current = {
          ...viewport.current,
          top: viewport.current.top * 2 - viewport.current.bottom,
          bottom: viewport.current.top,
        };
      }
    } else if (cellPosition.columnIndex === POINTER_CONTEXT_SCROLLBAR_HIGHER) {
      if (
        viewport.current.right * 2 - viewport.current.left <
        gridContext.gridSize.numColumns
      ) {
        viewport.current = {
          ...viewport.current,
          left: viewport.current.right,
          right: viewport.current.right * 2 - viewport.current.left,
        };
      } else {
        viewport.current = {
          ...viewport.current,
          left:
            gridContext.gridSize.numColumns -
            (viewport.current.right - viewport.current.left),
          right: gridContext.gridSize.numColumns,
        };
      }
    } else if (cellPosition.rowIndex === POINTER_CONTEXT_SCROLLBAR_HIGHER) {
      if (
        viewport.current.bottom * 2 - viewport.current.top <
        gridContext.gridSize.numRows
      ) {
        viewport.current = {
          ...viewport.current,
          top: viewport.current.bottom,
          bottom: viewport.current.bottom * 2 - viewport.current.top,
        };
      } else {
        viewport.current = {
          ...viewport.current,
          top:
            gridContext.gridSize.numRows -
            (viewport.current.bottom - viewport.current.top),
          bottom: gridContext.gridSize.numRows,
        };
      }
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
    // pointerState.current = null;
    updateFocusedIndices([]);
    webGpuContext?.renderBundleBuilder?.setFocusedIndicesStorage(
      focusedIndices.current
    );
    startInertia();
  };

  const onMouseEnter = () => {
    startInertia();
  };

  const onDrag = (
    clientX: number,
    clientY: number,
    movementX: number,
    movementY: number
  ) => {
    if (!canvasContext.canvasRef.current || !pointerState.current) {
      throw new Error();
    }

    const deltaX = clientX - pointerState.current.start.x;
    const deltaY = clientY - pointerState.current.start.y;
    pointerState.current.delta = { x: deltaX, y: deltaY };

    velocity.current = {
      x:
        (-movementX * pointerState.current.startViewportSize.width) /
        canvasContext.canvasSize.width,
      y:
        (-movementY * pointerState.current.startViewportSize.height) /
        canvasContext.canvasSize.height,
    };
  };

  const onHover = (clientX: number, clientY: number) => {
    const cellPosition = calculateCellPosition(clientX, clientY);
    if (cellPosition.columnIndex === POINTER_CONTEXT_SCROLLBAR) {
      if (cellPosition.rowIndex === POINTER_CONTEXT_SCROLLBAR) {
        scrollBarState.current =
          SCROLLBAR_STATE_HORIZONTAL_FOCUSED + SCROLLBAR_STATE_VERTICAL_FOCUSED;
      } else {
        scrollBarState.current = SCROLLBAR_STATE_HORIZONTAL_FOCUSED;
      }
    } else if (cellPosition.rowIndex === POINTER_CONTEXT_SCROLLBAR) {
      scrollBarState.current = SCROLLBAR_STATE_VERTICAL_FOCUSED;
    } else {
      scrollBarState.current = SCROLLBAR_STATE_DEFAULT;
    }

    webGpuContext?.renderBundleBuilder?.updateU32UniformBuffer(
      gridContext,
      numCellsToShow.current,
      scrollBarState.current
    );

    updateFocusedIndices([cellPosition.columnIndex, cellPosition.rowIndex]);
    webGpuContext?.renderBundleBuilder?.setFocusedIndicesStorage(
      focusedIndices.current
    );
  };

  const onMouseMove = (event: MouseEvent) => {
    if (!canvasContext.canvasRef.current) {
      throw new Error();
    }
    if (pointerState.current) {
      canvasContext.canvasRef.current.style.cursor = 'grabbing';
      onDrag(event.clientX, event.clientY, event.movementX, event.movementY);
    } else {
      canvasContext.canvasRef.current.style.cursor = 'default';
      onHover(event.clientX, event.clientY);
    }
    startInertia();
  };

  const onTouchMove = (event: TouchEvent) => {
    if (!canvasContext.canvasRef.current) {
      throw new Error();
    }
    if (event.touches.length >= 2 && pointerState.current) {
      canvasContext.canvasRef.current.style.cursor = 'grabbing';
      onDrag(
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
      canvasContext.canvasRef.current.style.cursor = 'default';
      onHover(event.touches[0].clientX, event.touches[0].clientY);
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
            overscroll.current = {
              x: overscroll.current.x * edgeFriction,
              y: overscroll.current.y * edgeFriction,
            };
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
