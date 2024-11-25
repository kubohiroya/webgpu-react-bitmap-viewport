import React from 'react';
import { SegregationModes, SegregationUIProps } from './SegregationUIProps';
import { SegregationUIState } from './SegregationUIState';
import { SegregationUI } from './SegregationUI';
import { useWebGPUDeviceContext } from 'webgpu-react-bitmap-viewport';
import { JSSegregationKernel } from './kernels/JSSegregationKernel';
import { ASSegregationKernel } from './kernels/ASSegregationKernel';
import { GPUSegregationKernel } from './kernels/GPUSegregationKernel';
import { ASGPUSegregationKernel } from './kernels/ASGPUSegregationKernel';
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
      case SegregationModes.AS:
        return new ASSegregationKernel(uiState, seed);
      case SegregationModes.ASGPU:
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

  return <SegregationUI {...props} kernel={kernel} />;
}
