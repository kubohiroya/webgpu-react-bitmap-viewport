export {
  createSegregationKernelObject as createASSegregationKernelData,
  getGridPtr as getASGridPtr,
  setTolerance as setASTolerance,
  updateEmptyCellIndicesArray as updateASEmptyCellIndicesArray,
  shuffleGridData as shuffleASGridData,
  tick as tickAS,
} from './ASSegregationKernelFunctions';

export {
  createSegregationKernelObject as createASGPUSegregationKernelData,
  getGridPtr as getASGPUGridPtr,
  getAgentIndicesPtr as getASGPUAgentIndicesPtr,
  getAgentIndicesLengthPtr as getASGPUAgentIndicesLengthPtr,
  shuffleGridData as shuffleASGPUGridData,
  updateEmptyCellIndicesArray as updateASGPUEmptyCellIndicesArray,
  setTolerance as setASGPUTolerance,
  tick as tickASGPU,
} from './ASGPUSegregationKernelFunctions';

// export { ASSegregationKernelObject } from './ASSegregationKernelObject'; // これをexportするとエラー
// export { ASGPUSegregationKernelData } from './ASGPUSegregationKernelData'; //これをexportするとエラー
