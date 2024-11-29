export {
  createSegregationKernelObject as createASSegregationKernelData,
  getGrid as getASGrid,
  setTolerance as setASTolerance,
  updateEmptyCellIndicesArray as updateASEmptyCellIndicesArray,
  shuffleGridData as shuffleASGridData,
  tick as tickAS,
} from './ASSegregationKernelFunctions';

export {
  createSegregationKernelObject as createASGPUSegregationKernelData,
  getGrid as getASGPUGrid,
  getAgentIndices as getASGPUAgentIndices,
  getAgentIndicesLength as getASGPUAgentIndicesLength,
  shuffleGridData as shuffleASGPUGridData,
  updateEmptyCellIndicesArray as updateASGPUEmptyCellIndicesArray,
  setTolerance as setASGPUTolerance,
  tick as tickASGPU,
} from './ASGPUSegregationKernelFunctions';

// export { ASSegregationKernelObject } from './ASSegregationKernelObject'; // これをexportするとエラー
// export { ASGPUSegregationKernelData } from './ASGPUSegregationKernelData'; //これをexportするとエラー
// export { MyObject, createObject, average } from './ASSegregationKernelObject';
