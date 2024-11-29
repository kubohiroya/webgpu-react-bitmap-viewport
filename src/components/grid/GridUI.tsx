import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useCanvasRefContext } from './CanvasRefContext';
import { useViewportContext } from './ViewportContext';
import { useGridContext } from './GridContext';
import { useWebGPUDeviceContext } from './WebGPUDeviceContext';
import { useWebGPUDisplayContext } from './WebGPUDisplayContext';
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
import { useCanvasContext } from './CanvasContext';
import { KeyboardModifier } from './KeyboardModifier';
import { GridUIProps } from './GridUIProps';
import { Rectangle } from './Rectangle';
import { CellPosition } from './CellPosition';

function regulateRectangleTranslate(
  gridSize: { numColumns: number; numRows: number },
  viewportSize: { width: number; height: number },
  marginedCanvasSize: { width: number; height: number },
  originalViewport: Rectangle,
  newViewport: Rectangle
): Rectangle {
  const targetWidth = newViewport.right - newViewport.left;
  const targetHeight = newViewport.bottom - newViewport.top;
  const canvasAspectRatio =
    marginedCanvasSize.width / marginedCanvasSize.height;
  const gridAspectRatio = gridSize.numColumns / gridSize.numRows;

  const horizontalUnderflow = newViewport.left < 0;
  const horizontalOverflow = gridSize.numColumns < newViewport.right;
  const verticalUnderflow = newViewport.top < 0;
  const verticalOverflow = gridSize.numRows < newViewport.bottom;

  const horizontalExceed = targetWidth > gridSize.numColumns;
  const verticalExceed = targetHeight > gridSize.numRows;

  let regulatedTarget: Rectangle = { ...newViewport };

  if (horizontalExceed && verticalExceed) {
    if (canvasAspectRatio === gridAspectRatio) {
      regulatedTarget.left = 0;
      regulatedTarget.right = gridSize.numColumns;
      regulatedTarget.top = 0;
      regulatedTarget.bottom = gridSize.numRows;
      return regulatedTarget;
    } else if (canvasAspectRatio > gridAspectRatio) {
      const yCenter = (newViewport.top + newViewport.bottom) / 2;
      const yOffset =
        ((gridSize.numColumns / marginedCanvasSize.width) *
          marginedCanvasSize.height) /
        2;
      regulatedTarget.left = 0;
      regulatedTarget.right = gridSize.numColumns;
      regulatedTarget.top = yCenter - yOffset;
      regulatedTarget.bottom = yCenter + yOffset;
      return regulatedTarget;
    } else {
      const xCenter = (newViewport.left + newViewport.right) / 2;
      const xOffset =
        ((gridSize.numRows / marginedCanvasSize.height) *
          marginedCanvasSize.width) /
        2;
      regulatedTarget.top = 0;
      regulatedTarget.bottom = gridSize.numRows;
      regulatedTarget.left = xCenter - xOffset;
      regulatedTarget.right = xCenter + xOffset;
      return regulatedTarget;
    }
  }

  if (horizontalExceed) {
    regulatedTarget.top =
      (newViewport.top + newViewport.bottom - gridSize.numRows) / 2;
    regulatedTarget.bottom =
      (newViewport.top + newViewport.bottom + gridSize.numRows) / 2;
    if (horizontalUnderflow) {
      regulatedTarget.left = 0;
      if (horizontalOverflow) {
        return originalViewport;
      } else {
        regulatedTarget.right = newViewport.right;
        return regulatedTarget;
      }
    } else {
      regulatedTarget.right = gridSize.numColumns;
      if (horizontalOverflow) {
        return originalViewport;
      } else {
        regulatedTarget.left = newViewport.left;
        return regulatedTarget;
      }
    }
  }

  if (verticalExceed) {
    regulatedTarget.left =
      (newViewport.left + newViewport.right - viewportSize.width) / 2;
    regulatedTarget.right =
      (newViewport.left + newViewport.right + viewportSize.width) / 2;
    if (verticalUnderflow) {
      regulatedTarget.top = 0;
      if (verticalOverflow) {
        return originalViewport;
      } else {
        regulatedTarget.bottom = newViewport.bottom;
        return regulatedTarget;
      }
    } else {
      regulatedTarget.bottom = gridSize.numRows;
      if (horizontalOverflow) {
        regulatedTarget.top = gridSize.numRows - targetHeight;
        return originalViewport;
      } else {
        regulatedTarget.top = newViewport.top;
        return regulatedTarget;
      }
    }
  }
  return regulatedTarget;
}

export const GridUI = forwardRef<GridHandles, GridUIProps>((props, ref) => {
  const { focusedCellPosition, selectedStates } = props;
  const device = useWebGPUDeviceContext();
  const viewportContext = useViewportContext();
  const gridContext = useGridContext();
  const webGpuDisplayContext = useWebGPUDisplayContext();
  const canvasContext = useCanvasContext();
  const canvas = useCanvasRefContext();
  const tickerRef = useRef<NodeJS.Timeout>();

  const prevFocusedCellPosition = useRef<CellPosition | null>(null);
  const prevClickedCellPosition = useRef<CellPosition | null>(null);
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
      rowIndex: number,
      keyboardModifier: KeyboardModifier
    ) => {
      refreshSelectedState(
        sourceIndex,
        columnIndex,
        rowIndex,
        keyboardModifier
      );
    },
    refreshViewportState: (sourceIndex: number) => {
      refreshViewportState(sourceIndex);
    },
  }));

  const toggleCell = (columnIndex: number, rowIndex: number) => {
    const index = rowIndex * props.numColumns + columnIndex;
    const arrayIndex = Math.floor(index / 32);
    const bitIndex = index % 32;
    props.selectedStates[arrayIndex] ^= 1 << bitIndex;
  };

  const selectCell = (columnIndex: number, rowIndex: number) => {
    const index = rowIndex * props.numColumns + columnIndex;
    const arrayIndex = Math.floor(index / 32);
    const bitIndex = index % 32;
    props.selectedStates[arrayIndex] |= 1 << bitIndex;
  };

  const selectRange = (
    startColumn: number,
    startRow: number,
    endColumn: number,
    endRow: number
  ) => {
    for (
      let row = Math.min(startRow, endRow);
      row <= Math.max(startRow, endRow);
      row++
    ) {
      for (
        let col = Math.min(startColumn, endColumn);
        col <= Math.max(startColumn, endColumn);
        col++
      ) {
        const index = row * props.numColumns + col;
        const arrayIndex = Math.floor(index / 32);
        const bitIndex = index % 32;
        props.selectedStates[arrayIndex] |= 1 << bitIndex;
      }
    }
  };

  const toggleRange = (
    startColumn: number,
    startRow: number,
    endColumn: number,
    endRow: number
  ) => {
    let allSelected = true;

    // チェックして、全選択状態かどうかを確認
    for (
      let row = Math.min(startRow, endRow);
      row <= Math.max(startRow, endRow);
      row++
    ) {
      for (
        let col = Math.min(startColumn, endColumn);
        col <= Math.max(startColumn, endColumn);
        col++
      ) {
        const index = row * props.numColumns + col;
        const arrayIndex = Math.floor(index / 32);
        const bitIndex = index % 32;
        if ((props.selectedStates[arrayIndex] & (1 << bitIndex)) === 0) {
          allSelected = false;
          break;
        }
      }
      if (!allSelected) break;
    }

    // 全選択状態なら全て未選択に、それ以外なら全て選択に
    for (
      let row = Math.min(startRow, endRow);
      row <= Math.max(startRow, endRow);
      row++
    ) {
      for (
        let col = Math.min(startColumn, endColumn);
        col <= Math.max(startColumn, endColumn);
        col++
      ) {
        const index = row * props.numColumns + col;
        const arrayIndex = Math.floor(index / 32);
        const bitIndex = index % 32;
        if (allSelected) {
          props.selectedStates[arrayIndex] &= ~(1 << bitIndex);
        } else {
          props.selectedStates[arrayIndex] |= 1 << bitIndex;
        }
      }
    }
  };

  const clearSelection = () => {
    props.selectedStates.fill(0);
  };

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
    left: viewportContext.viewportStates[offset],
    top: viewportContext.viewportStates[offset + 1],
    right: viewportContext.viewportStates[offset + 2],
    bottom: viewportContext.viewportStates[offset + 3],
  });
  const setViewport = ({ left, top, right, bottom }: Partial<Rectangle>) => {
    left !== undefined && (viewportContext.viewportStates[offset] = left);
    top !== undefined && (viewportContext.viewportStates[offset + 1] = top);
    right !== undefined && (viewportContext.viewportStates[offset + 2] = right);
    bottom !== undefined &&
      (viewportContext.viewportStates[offset + 3] = bottom);
  };

  const regulateViewport = (
    startViewportSize: { width: number; height: number },
    startCellSize: { width: number; height: number },
    newViewport: Rectangle
  ) => {
    const horizontalUnderflow = newViewport.left < 0;
    const horizontalOverflow = newViewport.right > gridContext.numColumns;
    const verticalUnderflow = newViewport.top < 0;
    const verticalOverflow = newViewport.bottom > gridContext.numRows;
    const enableOverscroll =
      scrollBarState.current === ScrollBarStateValues.NotFocused;

    if (horizontalUnderflow) {
      velocity.current.y = 0;
      if (horizontalOverflow) {
        setViewport({
          left: 0,
          right: gridContext.numColumns,
        });
        if (enableOverscroll) {
          overscroll.current.x = 0;
        }
      } else {
        setViewport({ left: 0, right: startViewportSize.width });
        if (enableOverscroll) {
          overscroll.current.x = newViewport.left * startCellSize.width;
        }
      }
    } else if (horizontalOverflow) {
      velocity.current.y = 0;
      setViewport({
        left: gridContext.numColumns - startViewportSize.width,
      });
      setViewport({ right: gridContext.numColumns });
      if (enableOverscroll) {
        overscroll.current.x =
          (newViewport.right - gridContext.numColumns) * startCellSize.width;
      }
    } else if (!verticalOverflow && !verticalUnderflow) {
      setViewport({ left: newViewport.left, right: newViewport.right });
      if (enableOverscroll) {
        overscroll.current.x = 0;
      }
    }

    if (verticalUnderflow) {
      velocity.current.y = 0;
      if (verticalOverflow) {
        setViewport({ top: 0, bottom: gridContext.numRows });
        if (enableOverscroll) {
          overscroll.current.y = 0;
        }
      } else {
        setViewport({ top: 0, bottom: startViewportSize.height });
        if (enableOverscroll) {
          overscroll.current.y = newViewport.top * startCellSize.height;
        }
      }
    } else if (verticalOverflow) {
      velocity.current.y = 0;
      setViewport({
        top: gridContext.numRows - startViewportSize.height,
        bottom: gridContext.numRows,
      });
      if (enableOverscroll) {
        overscroll.current.y =
          (newViewport.bottom - gridContext.numRows) * startCellSize.height;
      }
    } else if (!horizontalOverflow && !horizontalUnderflow) {
      setViewport({ top: newViewport.top, bottom: newViewport.bottom });
      if (enableOverscroll) {
        overscroll.current.y = 0;
      }
    }
    const { left, top, right, bottom } = getViewport();
    if (!(top <= bottom && left <= right)) {
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
              (-1 * (gridContext.numColumns * pointerState.current.delta.x)) /
                (canvasContext.canvasSize.width -
                  canvasContext.headerOffset.left),
              0,
            ]
          : scrollBarState.current === ScrollBarStateValues.VerticalFocused
          ? [
              0,
              (-1 * (gridContext.numRows * pointerState.current.delta.y)) /
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

      regulateViewport(
        pointerState.current.startViewportSize,
        pointerState.current.startCellSize,
        newViewport
      );
    } else {
      const { left, top, right, bottom } = getViewport();
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
        scrollBarState.current === ScrollBarStateValues.HorizontalFocused ||
          scrollBarState.current === ScrollBarStateValues.VerticalFocused
          ? { left, top, right, bottom }
          : newViewport
      );
    }
  };

  const updateU32UniformBuffer = () => {
    renderBundleBuilder.current?.updateU32UniformBuffer(
      gridContext,
      numCellsToShow.current,
      scrollBarState.current,
      viewportContext.viewportIndex
    );
  };

  const refreshData = (sourceIndex: number) => {
    renderBundleBuilder.current?.updateDataBufferStorage(gridContext.data);
    startInertia();
    if (sourceIndex === viewportContext.viewportIndex) {
      props.onDataChanged?.(sourceIndex, gridContext.data);
    }
  };

  const refreshFocusedState = (
    sourceIndex: number,
    columnIndex: number,
    rowIndex: number
  ) => {
    if (
      columnIndex === prevFocusedCellPosition.current?.columnIndex &&
      rowIndex === prevFocusedCellPosition.current?.rowIndex
    ) {
      return;
    }
    focusedCellPosition.fill(-1);

    if (columnIndex !== -1 && rowIndex === -1) {
      focusedCellPosition.fill(columnIndex, 0, 0);
    } else if (columnIndex === -1 && rowIndex !== -1) {
      focusedCellPosition.fill(rowIndex, 1, 1);
    } else if (columnIndex !== -1 && rowIndex !== -1) {
      focusedCellPosition.fill(rowIndex, 0, 0);
      focusedCellPosition.fill(columnIndex, 1, 1);
    }

    prevFocusedCellPosition.current = null;

    renderBundleBuilder.current?.updateFocusedCellPositionStorage(
      focusedCellPosition
    );
    startInertia();

    if (sourceIndex === viewportContext.viewportIndex) {
      props.onFocusedCellPositionChange?.(sourceIndex, columnIndex, rowIndex);
    }
  };

  const refreshSelectedState = (
    sourceIndex: number,
    columnIndex: number,
    rowIndex: number,
    keyboardModifier: KeyboardModifier
  ) => {
    const currentCellPosition = { columnIndex, rowIndex };
    if (!(keyboardModifier.ctrl || keyboardModifier.meta)) {
      clearSelection();
    }
    const prevCellPosition =
      prevClickedCellPosition.current || currentCellPosition;

    if (keyboardModifier.shift) {
      // Shiftキーによる範囲選択の処理
      if (currentCellPosition.rowIndex === -1) {
        // 列の範囲選択
        selectRange(
          currentCellPosition.columnIndex,
          prevCellPosition.rowIndex,
          currentCellPosition.columnIndex,
          currentCellPosition.rowIndex
        );
      } else if (currentCellPosition.columnIndex === -1) {
        // 行の範囲選択
        selectRange(
          prevCellPosition.columnIndex,
          currentCellPosition.rowIndex,
          currentCellPosition.columnIndex,
          currentCellPosition.rowIndex
        );
      } else {
        selectRange(
          prevCellPosition.columnIndex,
          prevCellPosition.rowIndex,
          currentCellPosition.columnIndex,
          currentCellPosition.rowIndex
        );
      }
    } else if (keyboardModifier.ctrl || keyboardModifier.meta) {
      // Ctrlキーによるトグル選択の処理
      if (currentCellPosition.rowIndex === -1) {
        // 列トグル
        toggleRange(
          prevCellPosition.columnIndex,
          0,
          currentCellPosition.columnIndex,
          props.numRows - 1
        );
      } else if (currentCellPosition.columnIndex === -1) {
        // 行トグル
        toggleRange(
          0,
          prevCellPosition.rowIndex,
          props.numColumns - 1,
          currentCellPosition.rowIndex
        );
      } else {
        toggleCell(
          currentCellPosition.columnIndex,
          currentCellPosition.rowIndex
        );
      }
    } else {
      selectCell(currentCellPosition.columnIndex, currentCellPosition.rowIndex);
    }

    renderBundleBuilder.current?.updateSelectedStateStorage(selectedStates);
    // 選択後、セルの位置を更新（次のShift操作に備える）
    prevClickedCellPosition.current = currentCellPosition;

    if (sourceIndex === viewportContext.viewportIndex) {
      props.onSelectedStatesChange?.(
        sourceIndex,
        columnIndex,
        rowIndex,
        keyboardModifier
      );
    }
  };

  const updateNumCellsToShow = () => {
    const { left, top, right, bottom } = getViewport();
    const numColumnsToShow = Math.min(
      Math.ceil(right) - Math.floor(left),
      gridContext.numColumns
    );
    const numRowsToShow = Math.min(
      Math.ceil(bottom) - Math.floor(top),
      gridContext.numRows
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

  const update = () => {
    updateViewport();
    updateNumCellsToShow();
    executeRenderBundles();

    props.onViewportStatesChange?.(viewportContext.viewportIndex);
  };

  const calculateCellPosition = (
    clientX: number,
    clientY: number
  ): CellPosition => {
    const { left, top, right, bottom } = getViewport();
    const rect = canvas?.getBoundingClientRect();
    if (!rect) {
      throw new Error('canvasRefContext?.current? is null');
    }
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const columnWidth =
      (canvasContext.canvasSize.width - canvasContext.headerOffset.left) /
      (right - left);
    const rowHeight =
      (canvasContext.canvasSize.height - canvasContext.headerOffset.top) /
      (bottom - top);

    const columnIndex =
      (x - overscroll.current.x - canvasContext.headerOffset.left) /
      columnWidth;
    const rowIndex =
      (y - overscroll.current.y - canvasContext.headerOffset.top) / rowHeight;

    const isInsideHorizontalBody =
      columnIndex >= 0 && columnIndex + left < gridContext.numColumns;
    const isInsideVerticalBody =
      rowIndex >= 0 && rowIndex + top < gridContext.numRows;
    if (isInsideHorizontalBody) {
      if (isInsideVerticalBody) {
        const margin = canvasContext.scrollBar
          ? canvasContext.scrollBar.margin
          : SCROLLBAR_MARGIN;
        const radius = canvasContext.scrollBar
          ? canvasContext.scrollBar.radius
          : SCROLLBAR_RADIUS;
        if (
          canvasContext.canvasSize.width - margin - radius * 2 <= x &&
          x <= canvasContext.canvasSize.width - margin
        ) {
          const header = overscroll.current.y + canvasContext.headerOffset.top;
          const topEdge =
            header -
            radius +
            ((canvasContext.canvasSize.height - header - radius * 2) * top) /
              gridContext.numRows;
          const bottomEdge =
            header +
            radius * 2 +
            ((canvasContext.canvasSize.height - header - radius * 2) * bottom) /
              gridContext.numRows;

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
          canvasContext.scrollBar?.margin || SCROLLBAR_MARGIN;
        const scrollbarRadius =
          canvasContext.scrollBar?.radius || SCROLLBAR_RADIUS;
        if (
          canvasContext.canvasSize.height -
            scrollbarMargin -
            scrollbarRadius * 2 <=
            y &&
          y <= canvasContext.canvasSize.height - scrollbarMargin
        ) {
          const header = overscroll.current.x + canvasContext.headerOffset.left;
          const leftEdge =
            header -
            scrollbarRadius +
            ((canvasContext.canvasSize.width - header - scrollbarRadius * 2) *
              left) /
              gridContext.numColumns;
          const rightEdge =
            header +
            scrollbarRadius * 2 +
            ((canvasContext.canvasSize.width - header - scrollbarRadius * 2) *
              right) /
              gridContext.numColumns;

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

  const onDown = (x: number, y: number, keyboardModifier: KeyboardModifier) => {
    if (!canvas || !canvas) {
      throw new Error();
    }

    const { left, top, right, bottom } = getViewport();
    const currentCell = calculateCellPosition(x, y);

    if (
      currentCell.columnIndex === POINTER_CONTEXT_HEADER ||
      currentCell.rowIndex === POINTER_CONTEXT_HEADER
    ) {
      canvas.style.cursor = 'grab';
      refreshSelectedState(
        viewportContext.viewportIndex,
        currentCell.columnIndex,
        currentCell.rowIndex,
        keyboardModifier
      );
    }

    if (
      (currentCell.columnIndex >= 0 && currentCell.rowIndex >= 0) ||
      currentCell.columnIndex === POINTER_CONTEXT_HEADER ||
      currentCell.rowIndex === POINTER_CONTEXT_HEADER ||
      currentCell.columnIndex === POINTER_CONTEXT_SCROLLBAR_HANDLE ||
      currentCell.rowIndex === POINTER_CONTEXT_SCROLLBAR_HANDLE
    ) {
      canvas.style.cursor = 'grab';
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
            (canvasContext.canvasSize.width - canvasContext.headerOffset.left) /
            (right - left),
          height:
            (canvasContext.canvasSize.height - canvasContext.headerOffset.top) /
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
        isMouseOut: false,
      };

      refreshSelectedState(
        viewportContext.viewportIndex,
        currentCell.columnIndex,
        currentCell.rowIndex,
        keyboardModifier
      );

      return;
    } else if (currentCell.columnIndex === POINTER_CONTEXT_SCROLLBAR_LOWER) {
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
      return;
    } else if (currentCell.rowIndex === POINTER_CONTEXT_SCROLLBAR_LOWER) {
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

      return;
    } else if (currentCell.columnIndex === POINTER_CONTEXT_SCROLLBAR_HIGHER) {
      if (right * 2 - left < gridContext.numColumns) {
        setViewport({
          left: right,
          right: right * 2 - left,
        });
      } else {
        setViewport({
          left: gridContext.numColumns - (right - left),
          right: gridContext.numColumns,
        });
      }
      return;
    } else if (currentCell.rowIndex === POINTER_CONTEXT_SCROLLBAR_HIGHER) {
      if (bottom * 2 - top < gridContext.numRows) {
        setViewport({
          top: bottom,
          bottom: bottom * 2 - top,
        });
      } else {
        setViewport({
          top: gridContext.numRows - (bottom - top),
          bottom: gridContext.numRows,
        });
      }
      return;
    }
  };

  const onMouseDown = (event: MouseEvent) => {
    onDown(event.clientX, event.clientY, {
      ctrl: event.ctrlKey,
      shift: event.shiftKey,
      meta: event.metaKey,
    });
    update();
  };

  const onTouchStart = (event: TouchEvent) => {
    onDown(event.touches[0].clientX, event.touches[0].clientY, {
      ctrl: event.ctrlKey,
      shift: event.shiftKey,
      meta: event.metaKey,
    });
    update();
  };

  const onUp = () => {
    if (!canvas) {
      return;
    }
    canvas.style.cursor = 'default';
    pointerState.current = null;
    refreshFocusedState(viewportContext.viewportIndex, -1, -1);
  };

  const onMouseUp = () => {
    onUp();
  };

  const onTouchEnd = (_: TouchEvent) => {
    onUp();
  };

  const onMouseOut = (event: MouseEvent) => {
    if (!canvas) {
      return;
    }
    if (event.buttons === 0) {
      canvas.style.cursor = 'default';
      scrollBarState.current = ScrollBarStateValues.OutOfFrame;
      if (pointerState.current) {
        pointerState.current.isMouseOut = true;
      }
      updateU32UniformBuffer();
      refreshFocusedState(viewportContext.viewportIndex, -1, -1);
      startInertia();
    }
  };

  const onMouseEnter = (event: MouseEvent) => {
    if (pointerState.current) {
      pointerState.current.isMouseOut = false;
    }
    if (event.buttons === 0) {
      onUp();
      velocity.current = { x: 0, y: 0 };
      return;
    }
    scrollBarState.current = ScrollBarStateValues.NotFocused;
    updateU32UniformBuffer();
    update();
  };

  const onDrag = (
    clientX: number,
    clientY: number,
    movementX: number,
    movementY: number
  ) => {
    if (!canvas || !pointerState.current) {
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

    startInertia();
  };

  const onHover = (clientX: number, clientY: number) => {
    if (!canvas) {
      return;
    }
    const cellPosition = calculateCellPosition(clientX, clientY);
    if (
      cellPosition.columnIndex === POINTER_CONTEXT_SCROLLBAR_HANDLE &&
      cellPosition.rowIndex === POINTER_CONTEXT_SCROLLBAR_HANDLE
    ) {
      canvas.style.cursor = 'pointer';
      scrollBarState.current =
        ScrollBarStateValues.HorizontalFocused |
        ScrollBarStateValues.VerticalFocused;
    } else if (cellPosition.columnIndex === POINTER_CONTEXT_SCROLLBAR_HANDLE) {
      canvas.style.cursor = 'pointer';
      scrollBarState.current = ScrollBarStateValues.HorizontalFocused;
    } else if (cellPosition.rowIndex === POINTER_CONTEXT_SCROLLBAR_HANDLE) {
      canvas.style.cursor = 'pointer';
      scrollBarState.current = ScrollBarStateValues.VerticalFocused;
    } else if (cellPosition.columnIndex === POINTER_CONTEXT_SCROLLBAR_LOWER) {
      canvas.style.cursor = 'w-resize';
      scrollBarState.current = ScrollBarStateValues.HorizontalFocused;
    } else if (cellPosition.columnIndex === POINTER_CONTEXT_SCROLLBAR_HIGHER) {
      canvas.style.cursor = 'e-resize';
      scrollBarState.current = ScrollBarStateValues.HorizontalFocused;
    } else if (cellPosition.rowIndex === POINTER_CONTEXT_SCROLLBAR_LOWER) {
      canvas.style.cursor = 'n-resize';
      scrollBarState.current = ScrollBarStateValues.VerticalFocused;
    } else if (cellPosition.rowIndex === POINTER_CONTEXT_SCROLLBAR_HIGHER) {
      canvas.style.cursor = 's-resize';
      scrollBarState.current = ScrollBarStateValues.VerticalFocused;
    } else {
      canvas.style.cursor = 'cell';
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
    if (!canvas) {
      throw new Error();
    }
    if (pointerState.current) {
      canvas.style.cursor = 'grabbing';
      onDrag(event.clientX, event.clientY, event.movementX, event.movementY);
    } else {
      canvas.style.cursor = 'default';
      onHover(event.clientX, event.clientY);
    }
  };

  const onTouchMove = (event: TouchEvent) => {
    if (!canvas) {
      throw new Error();
    }
    if (event.touches.length >= 2 && pointerState.current) {
      canvas.style.cursor = 'grabbing';
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
      canvas.style.cursor = 'default';
      onHover(event.touches[0].clientX, event.touches[0].clientY);
    }
  };

  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    if (event.deltaY === 0 || !canvas) {
      return;
    }

    const marginedCanvasSize = {
      width: canvasContext.canvasSize.width - canvasContext.headerOffset.left,
      height: canvasContext.canvasSize.height - canvasContext.headerOffset.top,
    };

    const viewport = getViewport();
    const { left, top, right, bottom } = viewport;
    const viewportSize = {
      width: right - left,
      height: bottom - top,
    };

    const scale = event.deltaY > 0 ? 1.025 : 0.975;
    const rect = canvas.getBoundingClientRect();
    const dx = event.clientX - rect.left - canvasContext.headerOffset.left;
    const dy = event.clientY - rect.top - canvasContext.headerOffset.top;

    const cx = (viewportSize.width * dx) / marginedCanvasSize.width + left;
    const cy = (viewportSize.height * dy) / marginedCanvasSize.height + top;

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
      gridContext,
      viewportSize,
      marginedCanvasSize,
      viewport,
      target
    );

    setViewport(newViewport);
    renderBundleBuilder.current?.updateViewportStateStorage(
      viewportContext.viewportStates
    );
    update();
  };

  const onGlobalMouseMove = (event: MouseEvent) => {
    if (pointerState.current) {
      onMouseMove(event);
    }
  };

  const onGlobalMouseUp = (_: MouseEvent) => {
    if (pointerState.current != null && pointerState.current.start != null) {
      onUp();
    }
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
            Math.abs(velocity.current.x) > 0.001 ||
            Math.abs(velocity.current.y) > 0.001
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
      requestAnimationFrame(update);
    }, 16); // 約60fpsでアニメーション
  };

  useEffect(() => {
    renderBundleBuilder.current = new RenderBundleBuilder(
      gridContext.mode,
      device,
      webGpuDisplayContext.textureFormat,
      webGpuDisplayContext.gpuCanvasContext,
      canvasContext,
      webGpuDisplayContext.texture,
      gridContext,
      viewportContext.numViewports,
      gridContext.data instanceof GPUBuffer ? gridContext.data : null
    );

    canvas.addEventListener('mousedown', onMouseDown, { passive: true });
    canvas.addEventListener('mousemove', onMouseMove, { passive: true });
    canvas.addEventListener('mouseup', onMouseUp, { passive: true });
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd, { passive: true });
    canvas.addEventListener('mouseenter', onMouseEnter, { passive: true });
    canvas.addEventListener('mouseout', onMouseOut, { passive: true });
    canvas.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('mousemove', onGlobalMouseMove, {
      passive: true,
    });
    document.addEventListener('mouseup', onGlobalMouseUp, {
      passive: true,
    });
    eventHandlersInitialized.current = true;

    renderBundleBuilder.current.updateDataBufferStorage(gridContext.data);
    renderBundleBuilder.current.updateSelectedStateStorage(selectedStates);
    renderBundleBuilder.current.updateFocusedCellPositionStorage(
      focusedCellPosition
    );

    update();

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
        document.removeEventListener('mousemove', onGlobalMouseMove);
        document.removeEventListener('mouseup', onGlobalMouseUp);
        eventHandlersInitialized.current = false;
      }
    };
  }, [
    device,
    webGpuDisplayContext.textureFormat,
    webGpuDisplayContext.gpuCanvasContext,
    webGpuDisplayContext.texture,
    canvasContext,
    gridContext,
    eventHandlersInitialized.current,
    onMouseDown,
    onMouseMove,
    onWheel,
    onGlobalMouseMove,
  ]);

  return null;
});

export default GridUI;
