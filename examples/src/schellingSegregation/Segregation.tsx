import React from 'react';
import { SegregationModes, SegregationUIProps } from './SegregationUIProps';
import { SegregationUIState } from './SegregationUIState';
import { SegregationUI } from './SegregationUI';
import { useWebGPUDeviceContext } from 'webgpu-react-bitmap-viewport';
import { JSSegregationKernel } from './JSSegregationKernel';
import { ASSegregationKernel } from './ASSegregationKernel';
import { GPUSegregationKernel } from './GPUSegregationKernel';
import { ASGPUSegregationKernel } from './ASGPUSegregationKernel';
import { SegregationProps } from './SegregationProps';

export default function Segregation(
  props: SegregationProps & SegregationUIProps & { workgroupSizeMax: number },
) {
  const [width, height] = [props.gridSize, props.gridSize];
  const seed = props.seed;
  const uiState = new SegregationUIState({
    width,
    height,
  });

  const device = useWebGPUDeviceContext();

  if (device === null) {
    throw new Error('WebGPU is not available on this browser');
  }

  const kernel = (() => {
    switch (props.mode) {
      case SegregationModes.JS:
        return new JSSegregationKernel(uiState, seed);
      case SegregationModes.GPU:
        return new GPUSegregationKernel(
          uiState,
          seed,
          device,
          props.workgroupSizeMax,
        );
      case SegregationModes.ASM:
        return new ASSegregationKernel(uiState, seed);
      case SegregationModes.ASM_GPU:
        return new ASGPUSegregationKernel(
          uiState,
          seed,
          device,
          props.workgroupSizeMax,
        );
      default:
        return null;
    }
  })();

  if (kernel === null) {
    throw new Error('Invalid mode:' + props.mode);
  }

  kernel.updateGridSize(width, height, props.agentTypeShares, props.tolerance);

  return (
    <SegregationUI {...props} width={width} height={height} kernel={kernel} />
  );
}
