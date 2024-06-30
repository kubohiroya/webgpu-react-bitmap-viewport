import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useCanvasElementContext } from './CanvasElementContext';
import { useViewportContext } from './ViewportContext';
import { useGridContext } from './GridContext';
import { useWebGPUContext } from './WebGPUContext';
import { GridHandles } from './GridHandles';
import { RenderBundleBuilder } from './RenderBundleBuilder';
import {
  EDGE_FRICTION,
  SCROLLBAR_MARGIN,
  SCROLLBAR_RADIUS,
  TRANSLATE_FRICTION,
} from './GridParamsDefault';
import {
  POINTER_CONTEXT_HEADER,
  POINTER_CONTEXT_SCROLLBAR_HANDLE,
  POINTER_CONTEXT_SCROLLBAR_HIGHER,
  POINTER_CONTEXT_SCROLLBAR_LOWER,
  POINTER_CONTEXT_SCROLLBAR_OTHER,
} from './GridConstatns';
import { ScrollBarStateValues } from './ScrollBarStateValues';
import { SelectedStateValues } from './SelectedStateValues';

type GridUIProps = {
  focusedStates: Uint32Array;
  selectedStates: Uint32Array;
  onDataChanged?: (sourceIndex: number) => void;
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
  onViewportStateChange?: (sourceIndex: number) => void;
};

interface Rectangle {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function regulateRectangleTranslate(
  gridSize: { numColumns: number; numRows: number},
  viewportSize: { width: number; height: number },
  marginedCanvasSize: { width: number; height: number },
  originalViewport: Rectangle,
  newViewport: Rectangle
): Rectangle {
  const targetWidth = newViewport.right - newViewport.left;
  const targetHeight = newViewport.bottom - newViewport.top;
  const canvasAspectRatio = marginedCanvasSize.width / marginedCanvasSize.height;
  const gridAspectRatio = gridSize.numColumns / gridSize.numRows;

  const horizontalUnderflow = newViewport.left < 0;
  const horizontalOverflow = gridSize.numColumns < newViewport.right;
  const verticalUnderflow = newViewport.top < 0;
  const verticalOverflow = gridSize.numRows < newViewport.bottom;

  const horizontalExceed = targetWidth > gridSize.numColumns;
  const verticalExceed = targetHeight > gridSize.numRows;

  let regulatedTarget: Rectangle = { ...newViewport };

  if(horizontalExceed && verticalExceed){
    if (canvasAspectRatio === gridAspectRatio) {
      regulatedTarget.left = 0;
      regulatedTarget.right = gridSize.numColumns;
      regulatedTarget.top = 0;
      regulatedTarget.bottom = gridSize.numRows;
    }else if (canvasAspectRatio > gridAspectRatio) {
      const yOffset = (gridSize.numRows - targetHeight) / 2;
      regulatedTarget.left = 0;
      regulatedTarget.right = gridSize.numColumns;
      if(regulatedTarget.top < 0 || gridSize.numRows < regulatedTarget.bottom){
        regulatedTarget.top = 0;
        regulatedTarget.bottom = gridSize.numRows;
      }else{
        regulatedTarget.top = newViewport.top - yOffset;
        regulatedTarget.bottom = newViewport.bottom + yOffset;
      }
      return regulatedTarget;
    } else {
      regulatedTarget.top = 0;
      regulatedTarget.bottom = gridSize.numRows;
      regulatedTarget.left = (newViewport.left + newViewport.right - viewportSize.width ) / 2;
      regulatedTarget.right = (newViewport.left + newViewport.right + viewportSize.width) / 2;
      return regulatedTarget;
    }
  }

  if(horizontalExceed){
    regulatedTarget.top = (newViewport.top + newViewport.bottom - gridSize.numRows) / 2;
    regulatedTarget.bottom = (newViewport.top + newViewport.bottom + gridSize.numRows) / 2;
    if(horizontalUnderflow){
      regulatedTarget.left = 0;
      if(horizontalOverflow){
        return originalViewport;
      }else{
        regulatedTarget.right = newViewport.right;
        return regulatedTarget;
      }
    }else{
      regulatedTarget.right = gridSize.numColumns;
      if(horizontalOverflow){
        return originalViewport;
      }else{
        regulatedTarget.left = newViewport.left;
        return regulatedTarget;
      }
    }
  }

  if(verticalExceed){
    regulatedTarget.left = ((newViewport.left + newViewport.right) - viewportSize.width) / 2;
    regulatedTarget.right = ((newViewport.left + newViewport.right) + viewportSize.width) / 2;
    if(verticalUnderflow){
      regulatedTarget.top = 0;
      if(verticalOverflow){
        return originalViewport;
      }else{
        regulatedTarget.bottom = newViewport.bottom;
        return regulatedTarget;
      }
    }else{
      regulatedTarget.bottom = gridSize.numRows;
      if(horizontalOverflow){
        regulatedTarget.top = gridSize.numRows - targetHeight;
        return originalViewport;
      }else{
        regulatedTarget.top = newViewport.top;
        return regulatedTarget;
      }
    }
  }
  return regulatedTarget;
}

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
    refreshViewportState: (sourceIndex: number) => {
      refreshViewportState(sourceIndex);
    },
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
    isMouseOut: boolean;
  } | null>(null);

  const velocity = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const eventHandlersInitialized = useRef<boolean>(false);

  const scrollBarState = useRef<number>(ScrollBarStateValues.OutOfFrame);
  const offset = viewportContext.viewportIndex * 4;
  const getViewport = () => ({
    left: viewportContext.viewportStates[offset + 0],
    top: viewportContext.viewportStates[offset + 1],
    right: viewportContext.viewportStates[offset + 2],
    bottom: viewportContext.viewportStates[offset + 3],
  });
  const setViewport = ({ left, top, right, bottom }: Partial<Rectangle>) => {
    left !== undefined && (viewportContext.viewportStates[offset + 0] = left);
    top !== undefined && (viewportContext.viewportStates[offset + 1] = top);
    right !== undefined && (viewportContext.viewportStates[offset + 2] = right);
    bottom !== undefined && (viewportContext.viewportStates[offset + 3] = bottom);
  };

  const regulateViewport = (
    startViewportSize: { width: number; height: number },
    startCellSize: { width: number; height: number },
    newViewport: Rectangle
  ) => {
    const horizontalUnderflow = newViewport.left < 0;
    const horizontalOverflow =
      newViewport.right > gridContext.gridSize.numColumns;
    const verticalUnderflow = newViewport.top < 0;
    const verticalOverflow = newViewport.bottom > gridContext.gridSize.numRows;
    const enableOverscroll =
      scrollBarState.current === ScrollBarStateValues.NotFocused;

    if (horizontalUnderflow) {
      velocity.current.y = 0;
      if (horizontalOverflow) {
        setViewport({
          left: 0,
          right: gridContext.gridSize.numColumns,
        })
        if (enableOverscroll) {
          overscroll.current.x = 0;
        }
      } else {
        setViewport({left:0, right:startViewportSize.width});
        if (enableOverscroll) {
          overscroll.current.x = newViewport.left * startCellSize.width;
        }
      }
    } else if (horizontalOverflow) {
      velocity.current.y = 0;
      setViewport(
        {left: gridContext.gridSize.numColumns - startViewportSize.width}
      );
      setViewport({right: gridContext.gridSize.numColumns});
      if (enableOverscroll) {
        overscroll.current.x =
          (newViewport.right - gridContext.gridSize.numColumns) *
          startCellSize.width;
      }
    } else if (!verticalOverflow && !verticalUnderflow) {
      setViewport({left: newViewport.left, right: newViewport.right});
      if (enableOverscroll) {
        overscroll.current.x = 0;
      }
    }

    if (verticalUnderflow) {
      velocity.current.y = 0;
      if (verticalOverflow) {
        setViewport({top: 0, bottom: gridContext.gridSize.numRows});
        if (enableOverscroll) {
          overscroll.current.y = 0;
        }
      } else {
        setViewport({top: 0, bottom: startViewportSize.height});
        if (enableOverscroll) {
          overscroll.current.y = newViewport.top * startCellSize.height;
        }
      }
    } else if (verticalOverflow) {
      velocity.current.y = 0;
      setViewport({top: gridContext.gridSize.numRows - startViewportSize.height, bottom: gridContext.gridSize.numRows});
      if (enableOverscroll) {
        overscroll.current.y =
          (newViewport.bottom - gridContext.gridSize.numRows) *
          startCellSize.height;
      }
    } else if (!horizontalOverflow && !horizontalUnderflow) {
      setViewport({top: newViewport.top, bottom: newViewport.bottom});
      if (enableOverscroll) {
        overscroll.current.y = 0;
      }
    }
    const {left, top, right, bottom} = getViewport();
    if (
      !(
        top <= bottom && left <= right
      )
    ) {
      throw new Error(
        `viewport must be valid rectangle: top:${top} <= bottom:${bottom} && left:${left} <= right:${right}}`
      );
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
        scrollBarState.current === ScrollBarStateValues.HorizontalFocused
          ? [
              (-1 *
                (gridContext.gridSize.numColumns *
                  pointerState.current.delta.x)) /
                (canvasElementContext.canvasSize.width -
                  canvasElementContext.headerOffset.left),
              0,
            ]
          : scrollBarState.current === ScrollBarStateValues.VerticalFocused
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

      const viewport: Rectangle = {
        left: pointerState.current.startViewport.left,
        right: pointerState.current.startViewport.right,
        top: pointerState.current.startViewport.top,
        bottom: pointerState.current.startViewport.bottom,
      };

      const newViewport = {
        left: viewport.left - dx,
        right: viewport.right - dx,
        top: viewport.top - dy,
        bottom: viewport.bottom - dy,
      };

      regulateViewport(pointerState.current.startViewportSize, pointerState.current.startCellSize, newViewport);
    } else {
      const {left, top, right, bottom} = getViewport();
      const startViewportSize = {
        width: right - left,
        height: bottom - top,
      };

      const newViewport = {
        left: left + velocity.current.x,
        right: right + velocity.current.x,
        top: top + velocity.current.y,
        bottom: bottom + velocity.current.y,
      };

      regulateViewport(startViewportSize, {
        width:
          (canvasElementContext.canvasSize.width -
            canvasElementContext.headerOffset.left) /
          startViewportSize.width,
        height:
          (canvasElementContext.canvasSize.height -
            canvasElementContext.headerOffset.top) /
          startViewportSize.height
      }, scrollBarState.current === ScrollBarStateValues.HorizontalFocused ||
      scrollBarState.current === ScrollBarStateValues.VerticalFocused
        ? {left, top, right, bottom}
        : newViewport);
    }
  };

  const updateU32UniformBuffer = () => {
    renderBundleBuilder.current?.updateU32UniformBuffer(
      gridContext,
      numCellsToShow.current,
      scrollBarState.current,
      viewportContext.viewportIndex
    );
  }

  const refreshData = (sourceIndex: number) => {
    renderBundleBuilder.current?.updateDataBufferStorage(gridContext.data);
    if (sourceIndex === viewportContext.viewportIndex) {
      props.onDataChanged?.(sourceIndex);
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
    focusedStates.fill(ScrollBarStateValues.NotFocused);

    if (columnIndex !== -1 && rowIndex === -1) {
      focusedStates[columnIndex] = ScrollBarStateValues.HorizontalFocused;
    } else if (columnIndex === -1 && rowIndex !== -1) {
      focusedStates[rowIndex] = ScrollBarStateValues.VerticalFocused;
    } else if (columnIndex !== -1 && rowIndex !== -1) {
      focusedStates[columnIndex] = ScrollBarStateValues.HorizontalFocused;
      focusedStates[rowIndex] = ScrollBarStateValues.VerticalFocused;
    }

    prevFocusedColumnIndex.current = columnIndex;
    prevFocusedRowIndex.current = rowIndex;

    renderBundleBuilder.current?.updateFocusedStateStorage(focusedStates);
    startInertia();

    if (sourceIndex === viewportContext.viewportIndex) {
      props.onFocusedStatesChange?.(sourceIndex, columnIndex, rowIndex);
    }
  };

  const refreshSelectedState = (
    sourceIndex: number,
    columnIndex: number,
    rowIndex: number
  ) => {
    if (sourceIndex === viewportContext.viewportIndex) {
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

    renderBundleBuilder.current?.updateSelectedStateStorage(selectedStates);

    if (sourceIndex === viewportContext.viewportIndex) {
      props.onSelectedStatesChange?.(sourceIndex, columnIndex, rowIndex);
    }
  };

  const updateNumCellsToShow = () => {
    const {left, top, right, bottom} = getViewport();
    const numColumnsToShow = Math.min(
      Math.ceil(right) - Math.floor(left),
      gridContext.gridSize.numColumns
    );
    const numRowsToShow = Math.min(
      Math.ceil(bottom) - Math.floor(top),
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
      overscroll.current
    );

    renderBundleBuilder.current.updateU32UniformBuffer(
      gridContext,
      numCellsToShow.current,
      scrollBarState.current,
      viewportContext.viewportIndex
    );

    renderBundleBuilder.current?.updateViewportStateStorage(
      viewportContext.viewportStates
    );

    renderBundleBuilder.current?.updateDrawIndirectBuffer(
      numCellsToShow.current.numColumnsToShow,
      numCellsToShow.current.numRowsToShow,
      viewportContext.numViewports
    );

    renderBundleBuilder.current?.execute();
  };

  const refreshViewportState = (sourceIndex: number) => {
    if (sourceIndex !== viewportContext.viewportIndex) {
      updateViewport();
      updateNumCellsToShow();
      executeRenderBundles();
    }
  };

  const tick = () => {
    //console.log('tick', velocity.current, overscroll.current);

    updateViewport();
    updateNumCellsToShow();
    executeRenderBundles();

    props.onViewportStateChange?.(viewportContext.viewportIndex);
  };

  const calculateCellPosition = (clientX: number, clientY: number) => {
    const {left, top, right, bottom} = getViewport();
    const rect =
      canvasElementContext.canvasRef.current!.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const columnWidth =
      (canvasElementContext.canvasSize.width -
        canvasElementContext.headerOffset.left) /
      (right - left);
    const rowHeight =
      (canvasElementContext.canvasSize.height -
        canvasElementContext.headerOffset.top) /
      (bottom - top);

    const columnIndex =
      (x - overscroll.current.x - canvasElementContext.headerOffset.left) /
      columnWidth;
    const rowIndex =
      (y - overscroll.current.y - canvasElementContext.headerOffset.top) /
      rowHeight;

    const isInsideHorizontalBody =
      columnIndex >= 0 &&
      columnIndex + left < gridContext.gridSize.numColumns;
    const isInsideVerticalBody =
      rowIndex >= 0 &&
      rowIndex + top < gridContext.gridSize.numRows;
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
          const header =
            overscroll.current.y + canvasElementContext.headerOffset.top;
          const topEdge =
            header -
            radius +
            ((canvasElementContext.canvasSize.height - header - radius * 2) *
              top) /
              gridContext.gridSize.numRows;
          const bottomEdge =
            header +
            radius * 2 +
            ((canvasElementContext.canvasSize.height - header - radius * 2) *
              bottom) /
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
          const header =
            overscroll.current.x + canvasElementContext.headerOffset.left;
          const leftEdge =
            header -
            scrollbarRadius +
            ((canvasElementContext.canvasSize.width -
              header -
              scrollbarRadius * 2) *
              left) /
              gridContext.gridSize.numColumns;
          const rightEdge =
            header +
            scrollbarRadius * 2 +
            ((canvasElementContext.canvasSize.width -
              header -
              scrollbarRadius * 2) *
              right) /
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
          columnIndex: Math.floor(columnIndex + left),
          rowIndex: Math.floor(rowIndex + top),
        };
      } else {
        return {
          columnIndex: Math.floor(columnIndex + left),
          rowIndex: POINTER_CONTEXT_HEADER,
        };
      }
    } else {
      if (isInsideVerticalBody) {
        return {
          columnIndex: POINTER_CONTEXT_HEADER,
          rowIndex: Math.floor(rowIndex + top),
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

    const {left, top, right, bottom} = getViewport();
    const cellPosition = calculateCellPosition(x, y);

    if (
      cellPosition.columnIndex === POINTER_CONTEXT_HEADER ||
      cellPosition.rowIndex === POINTER_CONTEXT_HEADER
    ) {
      canvasElementContext.canvasRef.current.style.cursor = 'grab';
      refreshSelectedState(
        viewportContext.viewportIndex,
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
          width: right - left,
          height: bottom - top,
        },
        startCellSize: {
          width:
            (canvasElementContext.canvasSize.width -
              canvasElementContext.headerOffset.left) /
            (right - left),
          height:
            (canvasElementContext.canvasSize.height -
              canvasElementContext.headerOffset.top) /
            (bottom - top),
        },
        startViewport: {
          top,
          bottom,
          left,
          right,
        },
        delta: {
          x: 0,
          y: 0,
        },
        isMouseOut: false
      };
      return;
    } else if (cellPosition.columnIndex === POINTER_CONTEXT_SCROLLBAR_LOWER) {
      if (left * 2 < right) {
        setViewport({
          left: 0,
          right: right - left,
        });
      } else {
        setViewport({
          left: left * 2 - right,
          right: left,
        });
      }
    } else if (cellPosition.rowIndex === POINTER_CONTEXT_SCROLLBAR_LOWER) {
      if (top * 2 < bottom) {
        setViewport({
          top: 0,
          bottom: bottom - top,
        });
      } else {
        setViewport({
          top: top * 2 - bottom,
          bottom: top,
        });
      }
    } else if (cellPosition.columnIndex === POINTER_CONTEXT_SCROLLBAR_HIGHER) {
      if (
        right * 2 - left <
        gridContext.gridSize.numColumns
      ) {
        setViewport({
          left: right,
          right: right * 2 - left,
        });
      } else {
        setViewport({
          left:
            gridContext.gridSize.numColumns -
            (right - left),
          right: gridContext.gridSize.numColumns,
        });
      }
    } else if (cellPosition.rowIndex === POINTER_CONTEXT_SCROLLBAR_HIGHER) {
      if (
        bottom * 2 - top <
        gridContext.gridSize.numRows
      ) {
        setViewport({
          top: bottom,
          bottom: bottom * 2 - top,
        });
      } else {
        setViewport({
          top:
            gridContext.gridSize.numRows -
            (bottom - top),
          bottom: gridContext.gridSize.numRows,
        });
      }
    }
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
    refreshFocusedState(viewportContext.viewportIndex, -1, -1);
  };

  const onMouseUp = () => {
    onUp();
  };

  const onTouchEnd = (event: TouchEvent) => {
    onUp();
  };

  const onMouseOut = (event: MouseEvent) => {
    canvasElementContext.canvasRef.current!.style.cursor = 'default';
    scrollBarState.current = ScrollBarStateValues.OutOfFrame;
    if(pointerState.current){
      pointerState.current.isMouseOut = true;
    }
    updateU32UniformBuffer();
    refreshFocusedState(viewportContext.viewportIndex, -1, -1);
    startInertia();
  };

  const onMouseEnter = (event: MouseEvent) => {
    if(pointerState.current){
      pointerState.current.isMouseOut = false;
    }
    if(event.buttons === 0){
      onUp();
      velocity.current = {x: 0, y: 0};
      return;
    }
    scrollBarState.current = ScrollBarStateValues.NotFocused;
    updateU32UniformBuffer();
    tick();
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
        ScrollBarStateValues.HorizontalFocused |
        ScrollBarStateValues.VerticalFocused;
    } else if (cellPosition.columnIndex === POINTER_CONTEXT_SCROLLBAR_HANDLE) {
      canvasElementContext.canvasRef.current!.style.cursor = 'pointer';
      scrollBarState.current = ScrollBarStateValues.HorizontalFocused;
    } else if (cellPosition.rowIndex === POINTER_CONTEXT_SCROLLBAR_HANDLE) {
      canvasElementContext.canvasRef.current!.style.cursor = 'pointer';
      scrollBarState.current = ScrollBarStateValues.VerticalFocused;
    } else if (cellPosition.columnIndex === POINTER_CONTEXT_SCROLLBAR_LOWER) {
      canvasElementContext.canvasRef.current!.style.cursor = 'w-resize';
      scrollBarState.current = ScrollBarStateValues.HorizontalFocused;
    } else if (cellPosition.columnIndex === POINTER_CONTEXT_SCROLLBAR_HIGHER) {
      canvasElementContext.canvasRef.current!.style.cursor = 'e-resize';
      scrollBarState.current = ScrollBarStateValues.HorizontalFocused;
    } else if (cellPosition.rowIndex === POINTER_CONTEXT_SCROLLBAR_LOWER) {
      canvasElementContext.canvasRef.current!.style.cursor = 'n-resize';
      scrollBarState.current = ScrollBarStateValues.VerticalFocused;
    } else if (cellPosition.rowIndex === POINTER_CONTEXT_SCROLLBAR_HIGHER) {
      canvasElementContext.canvasRef.current!.style.cursor = 's-resize';
      scrollBarState.current = ScrollBarStateValues.VerticalFocused;
    } else {
      canvasElementContext.canvasRef.current!.style.cursor = 'cell';
      scrollBarState.current = ScrollBarStateValues.NotFocused;
    }

    renderBundleBuilder.current?.updateU32UniformBuffer(
      gridContext,
      numCellsToShow.current,
      scrollBarState.current,
      viewportContext.viewportIndex
    );

    refreshFocusedState(
      viewportContext.viewportIndex,
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
    event.preventDefault();
    if (event.deltaY === 0 || !canvasElementContext.canvasRef.current) {
      return;
    }

    const marginedCanvasSize = {
      width:
        canvasElementContext.canvasSize.width -
        canvasElementContext.headerOffset.left,
      height:
        canvasElementContext.canvasSize.height -
        canvasElementContext.headerOffset.top,
    };

    const viewport = getViewport();
    const {left, top, right, bottom} = viewport;
    const viewportSize = {
      width: right - left,
      height: bottom - top,
    };

    const scale = event.deltaY > 0 ? 1.03 : 0.98;
    const rect = canvasElementContext.canvasRef.current.getBoundingClientRect();
    const dx =
      event.clientX - rect.left - canvasElementContext.headerOffset.left;
    const dy = event.clientY - rect.top - canvasElementContext.headerOffset.top;

    const cx =
      (viewportSize.width * dx) / marginedCanvasSize.width + left;
    const cy =
      (viewportSize.height * dy) / marginedCanvasSize.height + top;

    const target = {
      left: cx + (left - cx) * scale,
        right: cx + (right - cx) * scale,
      top: cy + (top - cy) * scale,
      bottom: cy + (bottom - cy) * scale,
    };

    velocity.current = {
      x: 0,
      y: 0,
    };

    const newViewport = regulateRectangleTranslate(
      gridContext.gridSize,
      viewportSize,
      marginedCanvasSize,
      viewport,
      target
    );

    setViewport(newViewport);
    renderBundleBuilder.current?.updateViewportStateStorage(
      viewportContext.viewportStates
    );
    tick();

    /*
    const horizontalUnderflow = -1 * left;
    const verticalUnderflow = -1 * top;
    const horizontalOverflow = right - gridContext.gridSize.numColumns;
    const verticalOverflow = bottom - gridContext.gridSize.numRows;
    if ((horizontalUnderflow > 0 && horizontalOverflow > 0) && (verticalUnderflow > 0 && verticalOverflow > 0)) {
      if(gridContext.gridSize.numColumns <= gridContext.gridSize.numColumns){
        left = 0;
        right = gridContext.gridSize.numColumns;
        gridContext.gridSize.numRows * gridContext.gridSize.numColumns
        top = 0;
        bottom = gridContext.gridSize.numRows;
      }else{

      }
    }
    if ((horizontalUnderflow > 0 && horizontalOverflow > 0) && (verticalUnderflow > 0 || verticalOverflow > 0)) {
      left = 0;
      right = gridContext.gridSize.numColumns;
      if(top <= 0) {
        top = 0;
        bottom = gridContext.gridSize.numRows;
      }
    }
    if ((left <= 0 || gridContext.gridSize.numColumns <= right ) && (top <= 0 && gridContext.gridSize.numRows <= bottom)) {
      // FIXME , please re-think the condition
    }

    if (horizontalUnderflow > 0 && horizontalOverflow > 0) {
      left = 0;
      right = getViewportRight();
    } else if (horizontalUnderflow) {
      left = 0;
      right += horizontalUnderflow;
    } else if (horizontalOverflow) {
      right = gridContext.gridSize.numColumns;
      left -= horizontalOverflow;
    }

    if (verticalUnderflow && verticalOverflow) {
      top = 0;
      bottom = getViewportBottom();
    } else if (verticalUnderflow) {
      top = 0;
      bottom += verticalUnderflow;
    } else if (verticalOverflow) {
      bottom = gridContext.gridSize.numRows;
      top -= verticalOverflow;
    }
     */

    /*
    regulateViewport(
      {
        width: newViewport.right - newViewport.left,
        height: newViewport.bottom - newViewport.top,
      },
      {
        width:
          (canvasElementContext.canvasSize.width - canvasElementContext.headerOffset.left) /
          newViewport.right -
          newViewport.left,
        height:
          (canvasElementContext.canvasSize.height - canvasElementContext.headerOffset.top) /
          newViewport.bottom -
          newViewport.top,
      },
      viewport
      ,
      newViewport
    );
     */

    //startInertia();
  };

  const startInertia = () => {

    if (tickerRef.current) {
      return;
    }
    tickerRef.current = setInterval(() => {
      if (!pointerState.current || pointerState.current.isMouseOut) {
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
    if (
      !webGpuContext ||
      !webGpuContext.device ||
      !webGpuContext.canvasFormat ||
      !webGpuContext.canvasContext ||
      !canvasElementContext.canvasRef.current
    ) {
      return;
    }

    renderBundleBuilder.current = new RenderBundleBuilder(
      gridContext.mode,
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
    canvas.addEventListener('wheel', onWheel);
    eventHandlersInitialized.current = true;

    renderBundleBuilder.current.updateDataBufferStorage(gridContext.data);
    renderBundleBuilder.current.updateSelectedStateStorage(selectedStates);
    renderBundleBuilder.current.updateFocusedStateStorage(focusedStates);

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
    eventHandlersInitialized.current,
    onMouseDown,
    onMouseMove,
    onWheel,
  ]);

  return null;
});

export default GridUI;
