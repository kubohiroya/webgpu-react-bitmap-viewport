import { SchellingSegregationShellProps } from './SchellingSegregationShellProps';
import { SchellingSegregationModelProps } from './SchellingSegregationModelProps';
import { SchellingSegregationKernelGPU } from './SchellingSegregationKernelGPU';
import { SchellingSegregationShell } from './SchellingSegregationShell';
import React from 'react';
import { SchellingSegregationModel } from './SchellingSegregationModel';
import { useWebGPUDeviceContext } from 'webgpu-react-bitmap-viewport';

export function SchellingSegregationGPUShell(
  props: SchellingSegregationModelProps &
    SchellingSegregationShellProps & { model: SchellingSegregationModel },
) {
  const device = useWebGPUDeviceContext();
  const kernel = new SchellingSegregationKernelGPU(
    props.model,
    device,
    props.model.numEmptyCells,
  );
  if (kernel === null) {
    return null;
  }
  return <SchellingSegregationShell {...props} kernel={kernel} />;
}
