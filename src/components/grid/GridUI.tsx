import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useCanvasElementContext } from './CanvasElementContext';
import { useViewportContext } from './ViewportContext';
import { useGridContext } from './GridContext';
import { useWebGPUContext } from './WebGPUContext';
import { GridHandles } from './GridHandles';
import { RenderBundleBuilder } from './RenderBundleBuilder';
import { EDGE_FRICTION, SCROLLBAR_MARGIN, SCROLLBAR_RADIUS, TRANSLATE_FRICTION } from './GridParamsDefault';
import { FocusedStateValues, POINTER_CONTEXT_HEADER,
  POINTER_CONTEXT_SCROLLBAR_HANDLE,
  POINTER_CONTEXT_SCROLLBAR_HIGHER,
  POINTER_CONTEXT_SCROLLBAR_LOWER, POINTER_CONTEXT_SCROLLBAR_OTHER, SelectedStateValues } from './GridConstatns';

type GridUIProps = {
  focusedStates: Uint32Array;
  selectedStates: Uint32Array;
  onDataChanged?: (sourceIndex: number, data: Float32Array) => void;
  onFocusedStatesChange?: (
    sourceIndex: number,
    columnIndex: number,
    rowIndex: number
  ) => void;
  onSelectedStatesChange?: (
    sourceIndex: number,
    columnIndex: number,
    rowIndex: number
  ) => void;
  onViewportStateChange?: (
    sourceIndex: number
  ) => void;
};

export const GridUI = forwardRef<GridHandles, GridUIProps>((props, ref) => {
  const { focusedStates, selectedStates } = props;
  const webGpuContext = useWebGPUContext();
  const viewportContext = useViewportContext();
  const gridContext = useGridContext();
  const canvasElementContext = useCanvasElementContext();
  const tickerRef = useRef<NodeJS.Timeout>();

  const prevFocusedColumnIndex = useRef<number>(-1);
  const prevFocusedRowIndex = useRef<number>(-1);
  const renderBundleBuilder = useRef<RenderBundleBuilder>();

  useImperativeHandle(ref, () => ({
    refreshData: (sourceIndex: number) => {
      refreshData(sourceIndex);
    },
    refreshFocusedState: (
      sourceIndex: number,
      columnIndex: number,
      rowIndex: number
    ) => {
      refreshFocusedState(sourceIndex, columnIndex, rowIndex);
    },
    refreshSelectedState: (
      sourceIndex: number,
      columnIndex: number,
      rowIndex: number
    ) => {
      refreshSelectedState(sourceIndex, columnIndex, rowIndex);
    },
    refreshViewportState: (
      sourceIndex: number
    ) => {
      refreshViewportState(sourceIndex);
    }
  }));

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

  const pointerState = useRef<{
    start: { x: number; y: number };
    previous: { x: number; y: number };
    startViewport: { top: number; bottom: number; left: number; right: number };
    startViewportSize: { width: number; height: number };
    startCellSize: { width: number; height: number };
    delta: { x: number; y: number };
  } | null>(null);

  const velocity = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const eventHandlersInitialized = useRef<boolean>(false);

  const scrollBarState = useRef<number>(FocusedStateValues.NotFocused);
  const offset = viewportContext.index * 4;
  const getViewportLeft = () =>
    viewportContext.viewportStates[offset + 0];
  const getViewportTop = () =>
    viewportContext.viewportStates[offset + 1];
  const getViewportRight = () =>
    viewportContext.viewportStates[offset + 2];
  const getViewportBottom = () =>
    viewportContext.viewportStates[offset + 3];

  const setViewportLeft = (left: number) =>
    (viewportContext.viewportStates[offset + 0] = left);
  const setViewportTop = (top: number) =>
    (viewportContext.viewportStates[offset + 1] = top);
  const setViewportRight = (right: number) =>
    (viewportContext.viewportStates[offset + 2] = right);
  const setViewportBottom = (bottom: number) =>
    (viewportContext.viewportStates[offset + 3] = bottom);

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
    const enableOverscroll =
      scrollBarState.current === FocusedStateValues.NotFocused;

    if (horizontalUnderflow) {
      velocity.current.y = 0;
      if (horizontalOverflow) {
        setViewportLeft(0);
        setViewportRight(gridContext.gridSize.numColumns);
        if (enableOverscroll) {
          overscroll.current.x = 0;
        }
      } else {
        setViewportLeft(0);
        setViewportRight(startViewportSize.width);
        if (enableOverscroll) {
          overscroll.current.x = newViewport.left * startCellSize.width;
        }
      }
    } else if (horizontalOverflow) {
      velocity.current.y = 0;
      setViewportLeft(
        gridContext.gridSize.numColumns - startViewportSize.width
      );
      setViewportRight(gridContext.gridSize.numColumns);
      if (enableOverscroll) {
        overscroll.current.x =
          (newViewport.right - gridContext.gridSize.numColumns) *
          startCellSize.width;
      }
    } else if (!verticalOverflow && !verticalUnderflow) {
      setViewportLeft(newViewport.left);
      setViewportRight(newViewport.right);
      if (enableOverscroll) {
        overscroll.current.x = 0;
      }
    }

    if (verticalUnderflow) {
      velocity.current.y = 0;
      if (verticalOverflow) {
        setViewportTop(0);
        setViewportBottom(gridContext.gridSize.numRows);
        if (enableOverscroll) {
          overscroll.current.y = 0;
        }
      } else {
        setViewportTop(0);
        setViewportBottom(startViewportSize.height);
        if (enableOverscroll) {
          overscroll.current.y = newViewport.top * startCellSize.height;
        }
      }
    } else if (verticalOverflow) {
      velocity.current.y = 0;
      setViewportTop(gridContext.gridSize.numRows - startViewportSize.height);
      setViewportBottom(gridContext.gridSize.numRows);
      if (enableOverscroll) {
        overscroll.current.y =
          (newViewport.bottom - gridContext.gridSize.numRows) *
          startCellSize.height;
      }
    } else if (!horizontalOverflow && !horizontalUnderflow) {
      setViewportTop(newViewport.top);
      setViewportBottom(newViewport.bottom);
      if (enableOverscroll) {
        overscroll.current.y = 0;
      }
    }
    if(!(getViewportTop() <= getViewportBottom() && getViewportLeft() <= getViewportRight())) {
      throw new Error(`viewport must be valid rectangle: top:${getViewportTop()} <= bottom:${getViewportBottom()} && left:${getViewportLeft()} <= right:${getViewportRight()}}`);
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
        scrollBarState.current === FocusedStateValues.HorizontalFocused
          ? [
              (-1 *
                (gridContext.gridSize.numColumns *
                  pointerState.current.delta.x)) /
                (canvasElementContext.canvasSize.width -
                  canvasElementContext.headerOffset.left),
              0,
            ]
          : scrollBarState.current === FocusedStateValues.VerticalFocused
          ? [
              0,
              (-1 *
                (gridContext.gridSize.numRows * pointerState.current.delta.y)) /
                (canvasElementContext.canvasSize.height -
                  canvasElementContext.headerOffset.top),
            ]
          : [
              (viewportWidth * pointerState.current.delta.x) /
                (canvasElementContext.canvasSize.width -
                  canvasElementContext.headerOffset.left),
              (viewportHeight * pointerState.current.delta.y) /
                (canvasElementContext.canvasSize.height -
                  canvasElementContext.headerOffset.top),
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
        width: getViewportRight() - getViewportLeft(),
        height: getViewportBottom() - getViewportTop(),
      };

      regulateViewport(
        startViewportSize,
        {
          width:
            (canvasElementContext.canvasSize.width - canvasElementContext.headerOffset.left) /
            startViewportSize.width,
          height:
            (canvasElementContext.canvasSize.height - canvasElementContext.headerOffset.top) /
            startViewportSize.height,
        },
        scrollBarState.current === FocusedStateValues.HorizontalFocused ||
          scrollBarState.current === FocusedStateValues.VerticalFocused
          ? {
              left: getViewportLeft(),
              right: getViewportRight(),
              top: getViewportTop(),
              bottom: getViewportBottom(),
            }
          : {
              left: getViewportLeft() + velocity.current.x,
              right: getViewportRight() + velocity.current.x,
              top: getViewportTop() + velocity.current.y,
              bottom: getViewportBottom() + velocity.current.y,
            }
      );
    }
  };

  const refreshData = (sourceIndex: number) => {
    renderBundleBuilder.current?.updateDataBufferStorage(gridContext.data);
    if (sourceIndex === viewportContext.index) {
      props.onDataChanged?.(sourceIndex, gridContext.data);
    }
  };

  const refreshFocusedState = (
    sourceIndex: number,
    columnIndex: number,
    rowIndex: number
  ) => {
    if (
      columnIndex === prevFocusedColumnIndex.current &&
      rowIndex === prevFocusedRowIndex.current
    ) {
      return;
    }
    focusedStates.fill(FocusedStateValues.NotFocused);

    if (columnIndex !== -1 && rowIndex === -1) {
      focusedStates[columnIndex] = FocusedStateValues.HorizontalFocused;
    } else if (columnIndex === -1 && rowIndex !== -1) {
      focusedStates[rowIndex] = FocusedStateValues.VerticalFocused;
    } else if (columnIndex !== -1 && rowIndex !== -1) {
      focusedStates[columnIndex] = FocusedStateValues.HorizontalFocused;
      focusedStates[rowIndex] = FocusedStateValues.VerticalFocused;
    }

    prevFocusedColumnIndex.current = columnIndex;
    prevFocusedRowIndex.current = rowIndex;

    renderBundleBuilder.current?.updateFocusedStateStorage(
      focusedStates
    );
    startInertia();

    if (sourceIndex === viewportContext.index) {
      props.onFocusedStatesChange?.(sourceIndex, columnIndex, rowIndex);
    }
  };

  const refreshSelectedState = (
    sourceIndex: number,
    columnIndex: number,
    rowIndex: number
  ) => {
    if (sourceIndex === viewportContext.index) {
      if (columnIndex === POINTER_CONTEXT_HEADER) {
        if (rowIndex === POINTER_CONTEXT_HEADER) {
          const filled = selectedStates.some((value) => value > 0);
          selectedStates.fill(filled ? 0 : 1);
        } else {
          for (let i = 0; i < selectedStates.length; i++) {
            if (i < selectedStates.length) {
              const value = selectedStates[i];
              selectedStates[i] =
                rowIndex === i
                  ? value === SelectedStateValues.NotSelected
                    ? SelectedStateValues.Selected
                    : SelectedStateValues.NotSelected
                  : value;
            } else {
              selectedStates[i] = SelectedStateValues.NotSelected;
            }
          }
        }
      } else {
        if (rowIndex === POINTER_CONTEXT_HEADER) {
          for (let i = 0; i < selectedStates.length; i++) {
            if (i < selectedStates.length) {
              const value = selectedStates[i];
              selectedStates[i] =
                columnIndex === i
                  ? value === SelectedStateValues.NotSelected
                    ? SelectedStateValues.Selected
                    : SelectedStateValues.NotSelected
                  : value;
            } else {
              selectedStates[i] = SelectedStateValues.NotSelected;
            }
          }
        } else {
          for (let i = 0; i < selectedStates.length; i++) {
            if (i < selectedStates.length) {
              const value = selectedStates[i];
              selectedStates[i] =
                rowIndex === i || columnIndex === i
                  ? value === SelectedStateValues.NotSelected
                    ? SelectedStateValues.Selected
                    : SelectedStateValues.NotSelected
                  : value;
            }
          }
        }
      }
    }

    renderBundleBuilder.current?.updateSelectedStateStorage(
      selectedStates
    );

    if (sourceIndex === viewportContext.index) {
      props.onSelectedStatesChange?.(sourceIndex, columnIndex, rowIndex);
    }
  };

  const updateNumCellsToShow = () => {
    const numColumnsToShow = Math.min(
      Math.ceil(getViewportRight()) - Math.floor(getViewportLeft()),
      gridContext.gridSize.numColumns
    );
    const numRowsToShow = Math.min(
      Math.ceil(getViewportBottom()) - Math.floor(getViewportTop()),
      gridContext.gridSize.numRows
    );
    numCellsToShow.current = { numColumnsToShow, numRowsToShow };
  };

  const executeRenderBundles = () => {
    if (!renderBundleBuilder.current) {
      return;
    }

    renderBundleBuilder.current.updateF32UniformBuffer(
      gridContext,
      overscroll.current);

    renderBundleBuilder.current.updateU32UniformBuffer(
      gridContext,
      numCellsToShow.current,
      scrollBarState.current,
      viewportContext.index
    );

    renderBundleBuilder.current?.updateViewportStateStorage(viewportContext.viewportStates);

    renderBundleBuilder.current?.updateDrawIndirectBuffer(
      numCellsToShow.current.numColumnsToShow, numCellsToShow.current.numRowsToShow, viewportContext.numViewports
    );

    renderBundleBuilder.current?.execute();
  };

  const refreshViewportState = (sourceIndex: number) => {
    if (sourceIndex !== viewportContext.index) {
      updateViewport();
      updateNumCellsToShow();
      executeRenderBundles();
    }
  }

  const tick = () => {

    updateViewport();
    updateNumCellsToShow();
    executeRenderBundles();

    props.onViewportStateChange?.(
      viewportContext.index,
    );

  };

  const calculateCellPosition = (clientX: number, clientY: number) => {
    const rect = canvasElementContext.canvasRef.current!.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const columnWidth =
      (canvasElementContext.canvasSize.width - canvasElementContext.headerOffset.left) /
      (getViewportRight() - getViewportLeft());
    const rowHeight =
      (canvasElementContext.canvasSize.height - canvasElementContext.headerOffset.top) /
      (getViewportBottom() - getViewportTop());

    const columnIndex =
      (x - overscroll.current.x - canvasElementContext.headerOffset.left) /
      columnWidth;
    const rowIndex =
      (y - overscroll.current.y - canvasElementContext.headerOffset.top) / rowHeight;

    const isInsideHorizontalBody =
      columnIndex >= 0 &&
      columnIndex + getViewportLeft() < gridContext.gridSize.numColumns;
    const isInsideVerticalBody =
      rowIndex >= 0 &&
      rowIndex + getViewportTop() < gridContext.gridSize.numRows;
    if (isInsideHorizontalBody) {
      if (isInsideVerticalBody) {
        const margin = canvasElementContext.scrollBar
          ? canvasElementContext.scrollBar.margin
          : SCROLLBAR_MARGIN;
        const radius = canvasElementContext.scrollBar
          ? canvasElementContext.scrollBar.radius
          : SCROLLBAR_RADIUS;
        if (
          canvasElementContext.canvasSize.width - margin - radius * 2 <= x &&
          x <= canvasElementContext.canvasSize.width - margin
        ) {
          const header = overscroll.current.y + canvasElementContext.headerOffset.top;
          const topEdge =
            header -
            radius +
            ((canvasElementContext.canvasSize.height - header - radius * 2) *
              getViewportTop()) /
              gridContext.gridSize.numRows;
          const bottomEdge =
            header +
            radius * 2 +
            ((canvasElementContext.canvasSize.height - header - radius * 2) *
              getViewportBottom()) /
              gridContext.gridSize.numRows;

          if (header <= y && y < topEdge) {
            return {
              columnIndex: POINTER_CONTEXT_SCROLLBAR_OTHER,
              rowIndex: POINTER_CONTEXT_SCROLLBAR_LOWER,
            };
          } else if (y < bottomEdge) {
            return {
              columnIndex: POINTER_CONTEXT_SCROLLBAR_OTHER,
              rowIndex: POINTER_CONTEXT_SCROLLBAR_HANDLE,
            };
          } else {
            return {
              columnIndex: POINTER_CONTEXT_SCROLLBAR_OTHER,
              rowIndex: POINTER_CONTEXT_SCROLLBAR_HIGHER,
            };
          }
        }
        const scrollbarMargin =
          canvasElementContext.scrollBar?.margin || SCROLLBAR_MARGIN;
        const scrollbarRadius =
          canvasElementContext.scrollBar?.radius || SCROLLBAR_RADIUS;
        if (
          canvasElementContext.canvasSize.height -
            scrollbarMargin -
            scrollbarRadius * 2 <=
            y &&
          y <= canvasElementContext.canvasSize.height - scrollbarMargin
        ) {
          const header = overscroll.current.x + canvasElementContext.headerOffset.left;
          const leftEdge =
            header -
            scrollbarRadius +
            ((canvasElementContext.canvasSize.width - header - scrollbarRadius * 2) *
              getViewportLeft()) /
              gridContext.gridSize.numColumns;
          const rightEdge =
            header +
            scrollbarRadius * 2 +
            ((canvasElementContext.canvasSize.width - header - scrollbarRadius * 2) *
              getViewportRight()) /
              gridContext.gridSize.numColumns;

          if (header <= x && x <= leftEdge) {
            return {
              columnIndex: POINTER_CONTEXT_SCROLLBAR_LOWER,
              rowIndex: POINTER_CONTEXT_SCROLLBAR_OTHER,
            };
          } else if (x <= rightEdge) {
            return {
              columnIndex: POINTER_CONTEXT_SCROLLBAR_HANDLE,
              rowIndex: POINTER_CONTEXT_SCROLLBAR_OTHER,
            };
          } else {
            return {
              columnIndex: POINTER_CONTEXT_SCROLLBAR_HIGHER,
              rowIndex: POINTER_CONTEXT_SCROLLBAR_OTHER,
            };
          }
        }
        return {
          columnIndex: Math.floor(columnIndex + getViewportLeft()),
          rowIndex: Math.floor(rowIndex + getViewportTop()),
        };
      } else {
        return {
          columnIndex: Math.floor(columnIndex + getViewportLeft()),
          rowIndex: POINTER_CONTEXT_HEADER,
        };
      }
    } else {
      if (isInsideVerticalBody) {
        return {
          columnIndex: POINTER_CONTEXT_HEADER,
          rowIndex: Math.floor(rowIndex + getViewportTop()),
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
    if (!canvasElementContext.canvasRef.current) {
      throw new Error();
    }

    const cellPosition = calculateCellPosition(x, y);

    if (
      cellPosition.columnIndex === POINTER_CONTEXT_HEADER ||
      cellPosition.rowIndex === POINTER_CONTEXT_HEADER
    ) {
      canvasElementContext.canvasRef.current.style.cursor = 'grab';
      refreshSelectedState(
        viewportContext.index,
        cellPosition.columnIndex,
        cellPosition.rowIndex
      );
    }

    if (
      (cellPosition.columnIndex >= 0 && cellPosition.rowIndex >= 0) ||
      cellPosition.columnIndex === POINTER_CONTEXT_HEADER ||
      cellPosition.rowIndex === POINTER_CONTEXT_HEADER ||
      cellPosition.columnIndex === POINTER_CONTEXT_SCROLLBAR_HANDLE ||
      cellPosition.rowIndex === POINTER_CONTEXT_SCROLLBAR_HANDLE
    ) {
      canvasElementContext.canvasRef.current.style.cursor = 'grab';
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
          width: getViewportRight() - getViewportLeft(),
          height: getViewportBottom() - getViewportTop(),
        },
        startCellSize: {
          width:
            (canvasElementContext.canvasSize.width - canvasElementContext.headerOffset.left) /
            (getViewportRight() - getViewportLeft()),
          height:
            (canvasElementContext.canvasSize.height - canvasElementContext.headerOffset.top) /
            (getViewportBottom() - getViewportTop()),
        },
        startViewport: {
          top: getViewportTop(),
          bottom: getViewportBottom(),
          left: getViewportLeft(),
          right: getViewportRight(),
        },
        delta: {
          x: 0,
          y: 0,
        },
      };
      return;
    } else if (cellPosition.columnIndex === POINTER_CONTEXT_SCROLLBAR_LOWER) {
      if (getViewportLeft() * 2 < getViewportRight()) {
        setViewport({
          left: 0,
          right: getViewportRight() - getViewportLeft(),
          top: null,
          bottom: null
        });
      } else {
        setViewport({
          left: getViewportLeft() * 2 - getViewportRight(),
          right: getViewportLeft(),
          top: null,
          bottom: null
        });
      }
    } else if (cellPosition.rowIndex === POINTER_CONTEXT_SCROLLBAR_LOWER) {
      if (getViewportTop() * 2 < getViewportBottom()) {
        setViewport({
          top: 0,
          bottom: getViewportBottom() - getViewportTop(),
          left: null,
          right: null,
        });
      } else {
        setViewport({
          top: getViewportTop() * 2 - getViewportBottom(),
          bottom: getViewportTop(),
          left: null,
          right: null,
        });
      }
    } else if (cellPosition.columnIndex === POINTER_CONTEXT_SCROLLBAR_HIGHER) {
      if (
        getViewportRight() * 2 - getViewportLeft() <
        gridContext.gridSize.numColumns
      ) {
        setViewport({
          left: getViewportRight(),
          right: getViewportRight() * 2 - getViewportLeft(),
          top: null,
          bottom: null
        });
      } else {
        setViewport({
          left:
            gridContext.gridSize.numColumns -
            (getViewportRight() - getViewportLeft()),
          right: gridContext.gridSize.numColumns,
          top: null,
          bottom: null
        });
      }
    } else if (cellPosition.rowIndex === POINTER_CONTEXT_SCROLLBAR_HIGHER) {
      if (
        getViewportBottom() * 2 - getViewportTop() <
        gridContext.gridSize.numRows
      ) {
        setViewport({
          top: getViewportBottom(),
          bottom: getViewportBottom() * 2 - getViewportTop(),
          left: null,
          right: null,
        });
      } else {
        setViewport({
          top:
            gridContext.gridSize.numRows -
            (getViewportBottom() - getViewportTop()),
          bottom: gridContext.gridSize.numRows,
          left: null,
          right: null,
        });
      }
    }
  };

  const setViewport = ({
    left,
    top,
    right,
    bottom,
  }: {
    left: number|null;
    top: number|null;
    right: number|null;
    bottom: number|null;
  }) => {
    left !== null && setViewportLeft(left);
    top !== null && setViewportTop(top);
    right !== null  && setViewportRight(right);
    bottom !== null  && setViewportBottom(bottom);
  };

  const onMouseDown = (event: MouseEvent) => {
    onDown(event.clientX, event.clientY);
    tick();
  };

  const onTouchStart = (event: TouchEvent) => {
    onDown(event.touches[0].clientX, event.touches[0].clientY);
    tick();
  };

  const onUp = () => {
    canvasElementContext.canvasRef.current!.style.cursor = 'default';
    pointerState.current = null;
    refreshFocusedState(viewportContext.index, -1, -1);
  };

  const onMouseUp = () => {
    onUp();
  };

  const onTouchEnd = (event: TouchEvent) => {
    onUp();
  };

  const onMouseOut = () => {
    canvasElementContext.canvasRef.current!.style.cursor = 'default';
    refreshFocusedState(viewportContext.index, -1, -1);
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
    if (!canvasElementContext.canvasRef.current || !pointerState.current) {
      throw new Error();
    }

    const deltaX = clientX - pointerState.current.start.x;
    const deltaY = clientY - pointerState.current.start.y;
    pointerState.current.delta = { x: deltaX, y: deltaY };

    velocity.current = {
      x:
        (-movementX * pointerState.current.startViewportSize.width) /
        canvasElementContext.canvasSize.width,
      y:
        (-movementY * pointerState.current.startViewportSize.height) /
        canvasElementContext.canvasSize.height,
    };

    startInertia();
  };

  const onHover = (clientX: number, clientY: number) => {
    const cellPosition = calculateCellPosition(clientX, clientY);
    if (
      cellPosition.columnIndex === POINTER_CONTEXT_SCROLLBAR_HANDLE &&
      cellPosition.rowIndex === POINTER_CONTEXT_SCROLLBAR_HANDLE
    ) {
      canvasElementContext.canvasRef.current!.style.cursor = 'pointer';
      scrollBarState.current =
        FocusedStateValues.HorizontalFocused | FocusedStateValues.VerticalFocused;
    } else if (cellPosition.columnIndex === POINTER_CONTEXT_SCROLLBAR_HANDLE) {
      canvasElementContext.canvasRef.current!.style.cursor = 'pointer';
      scrollBarState.current = FocusedStateValues.HorizontalFocused;
    } else if (cellPosition.rowIndex === POINTER_CONTEXT_SCROLLBAR_HANDLE) {
      canvasElementContext.canvasRef.current!.style.cursor = 'pointer';
      scrollBarState.current = FocusedStateValues.VerticalFocused;
    } else if (cellPosition.columnIndex === POINTER_CONTEXT_SCROLLBAR_LOWER) {
      canvasElementContext.canvasRef.current!.style.cursor = 'w-resize';
      scrollBarState.current = FocusedStateValues.HorizontalFocused
    } else if (cellPosition.columnIndex === POINTER_CONTEXT_SCROLLBAR_HIGHER) {
      canvasElementContext.canvasRef.current!.style.cursor = 'e-resize';
      scrollBarState.current = FocusedStateValues.HorizontalFocused;
    } else if (cellPosition.rowIndex === POINTER_CONTEXT_SCROLLBAR_LOWER) {
      canvasElementContext.canvasRef.current!.style.cursor = 'n-resize';
      scrollBarState.current = FocusedStateValues.VerticalFocused;
    } else if (cellPosition.rowIndex === POINTER_CONTEXT_SCROLLBAR_HIGHER) {
      canvasElementContext.canvasRef.current!.style.cursor = 's-resize';
      scrollBarState.current = FocusedStateValues.VerticalFocused;
    } else {
      canvasElementContext.canvasRef.current!.style.cursor = 'cell';
      scrollBarState.current = FocusedStateValues.NotFocused
    }

    renderBundleBuilder.current?.updateU32UniformBuffer(
      gridContext,
      numCellsToShow.current,
      scrollBarState.current,
      viewportContext.index
    );

    refreshFocusedState(
      viewportContext.index,
      cellPosition.columnIndex,
      cellPosition.rowIndex
    );
  };

  const onMouseMove = (event: MouseEvent) => {
    if (!canvasElementContext.canvasRef.current) {
      throw new Error();
    }
    if (pointerState.current) {
      canvasElementContext.canvasRef.current.style.cursor = 'grabbing';
      onDrag(event.clientX, event.clientY, event.movementX, event.movementY);
    } else {
      canvasElementContext.canvasRef.current.style.cursor = 'default';
      onHover(event.clientX, event.clientY);
    }
  };

  const onTouchMove = (event: TouchEvent) => {
    if (!canvasElementContext.canvasRef.current) {
      throw new Error();
    }
    if (event.touches.length >= 2 && pointerState.current) {
      canvasElementContext.canvasRef.current.style.cursor = 'grabbing';
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
      canvasElementContext.canvasRef.current.style.cursor = 'default';
      onHover(event.touches[0].clientX, event.touches[0].clientY);
    }
  };

  const onWheel = (event: WheelEvent) => {
    if (event.deltaY === 0 || !canvasElementContext.canvasRef.current) {
      return;
    }

    const scale = event.deltaY > 0 ? 1.03 : 0.98;
    const rect = canvasElementContext.canvasRef.current.getBoundingClientRect();
    const dx = event.clientX - rect.left - canvasElementContext.headerOffset.left;
    const dy = event.clientY - rect.top - canvasElementContext.headerOffset.top;

    const viewportSize = {
      width: getViewportRight() - getViewportLeft(),
      height: getViewportBottom() - getViewportTop(),
    };

    const cx =
      (viewportSize.width * dx) /
        (canvasElementContext.canvasSize.width - canvasElementContext.headerOffset.left) +
      getViewportLeft();
    const cy =
      (viewportSize.height * dy) /
        (canvasElementContext.canvasSize.height - canvasElementContext.headerOffset.top) +
      getViewportTop();

    let left = cx + (getViewportLeft() - cx) * scale;
    let right = cx + (getViewportRight() - cx) * scale;
    let top = cy + (getViewportTop() - cy) * scale;
    let bottom = cy + (getViewportBottom() - cy) * scale;

    const horizontalUnderflow = -1 * left;
    const verticalUnderflow = -1 * top;
    const horizontalOverflow = right - gridContext.gridSize.numColumns;
    const verticalOverflow = bottom - gridContext.gridSize.numRows;

    if (left < 0 && gridContext.gridSize.numColumns < right) {
      left = 0;
      right = getViewportRight();
    } else if (left < 0) {
      left = 0;
      right += horizontalUnderflow;
    } else if (gridContext.gridSize.numColumns < right) {
      right = gridContext.gridSize.numColumns;
      left -= horizontalOverflow;
    }

    if (top < 0 && gridContext.gridSize.numRows < bottom) {
      top = 0;
      bottom = getViewportBottom();
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
          (canvasElementContext.canvasSize.width - canvasElementContext.headerOffset.left) /
            right -
          left,
        height:
          (canvasElementContext.canvasSize.height - canvasElementContext.headerOffset.top) /
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
              x: overscroll.current.x * EDGE_FRICTION,
              y: overscroll.current.y * EDGE_FRICTION,
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
            velocity.current.x *= TRANSLATE_FRICTION;
            velocity.current.y *= TRANSLATE_FRICTION;
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

    if(!webGpuContext ||
      !webGpuContext.device || !webGpuContext.canvasFormat ||
      !webGpuContext.canvasContext ||
      !canvasElementContext.canvasRef.current){
      return;
    }

    renderBundleBuilder.current = new RenderBundleBuilder(
      webGpuContext.device,
      webGpuContext.canvasFormat,
      webGpuContext.canvasContext,
      canvasElementContext,
      gridContext.gridSize,
      viewportContext.numViewports
    );

    const canvas = canvasElementContext.canvasRef.current;
    canvas.addEventListener('mousedown', onMouseDown, { passive: true });
    canvas.addEventListener('mousemove', onMouseMove, { passive: true });
    canvas.addEventListener('mouseup', onMouseUp, { passive: true });
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd, { passive: true });
    canvas.addEventListener('mouseenter', onMouseEnter, { passive: true });
    canvas.addEventListener('mouseout', onMouseOut, { passive: true });
    canvas.addEventListener('wheel', onWheel, { passive: true });
    eventHandlersInitialized.current = true;

    renderBundleBuilder.current.updateDataBufferStorage(
      gridContext.data
    );
    renderBundleBuilder.current.updateSelectedStateStorage(
      selectedStates
    );
    renderBundleBuilder.current.updateFocusedStateStorage(
      focusedStates
    );

    tick();

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
        eventHandlersInitialized.current = false;
      }
    };
  }, [
    webGpuContext?.device,
    webGpuContext?.canvasFormat,
    webGpuContext?.canvasContext,
    canvasElementContext,
    gridContext.gridSize,
    gridContext.data,
    eventHandlersInitialized.current,
    onMouseDown,
    onMouseMove,
    onWheel,
  ]);

  return null;
});

export default GridUI;
