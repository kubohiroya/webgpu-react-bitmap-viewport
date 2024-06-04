import { useWebGPUContext } from './WebGPUContext';
import { useGridContext } from './GridContext';
import { useGridUIContext } from './GridUIContext';

export const GridRenderer = () => {
  const webGPUContext = useWebGPUContext();
  const gridContext = useGridContext();
  const uiContext = useGridUIContext();

  const data = gridContext.data;

  const drawFrame = () => {
    if (!webGPUContext || !webGPUContext.renderBundleBuilder || !data) {
      console.log(
        '[GridRenderer]',
        !webGPUContext,
        !webGPUContext?.renderBundleBuilder,
        !data
      );
      return;
    }

    const renderBundleBuilder = webGPUContext.renderBundleBuilder;
    renderBundleBuilder.setDataBufferStorage(data);
    renderBundleBuilder.setSelectedIndicesStorage(uiContext.selectedIndices);
    renderBundleBuilder.setFocusedIndicesStorage(uiContext.focusedIndices);

    /*
    const viewport = {
      width: uiContext.viewport.right - uiContext.viewport.left,
      height: uiContext.viewport.bottom - uiContext.viewport.top,
    };
     */

    const numColumnsToShow = uiContext.cellsToShow.numColumnsToShow;
    const numRowsToShow = uiContext.cellsToShow.numRowsToShow;

    renderBundleBuilder.setU32UniformBuffer(
      gridContext,
      numColumnsToShow,
      numRowsToShow
    );

    renderBundleBuilder.setF32UniformBuffer(
      gridContext,
      uiContext.viewport,
      numColumnsToShow,
      numRowsToShow
    );

    const bodyRenderBundle = renderBundleBuilder.createBodyRenderBundle();
    const topHeaderRenderBundle =
      renderBundleBuilder.createTopHeaderRenderBundle();
    const leftHeaderRenderBundle =
      renderBundleBuilder.createLeftHeaderRenderBundle();

    renderBundleBuilder.executeRenderBundles([
      bodyRenderBundle,
      topHeaderRenderBundle,
      leftHeaderRenderBundle,
    ]);
  };

  console.log('[GPUGridRenderer]');
  requestAnimationFrame(drawFrame);
  return null;
};
