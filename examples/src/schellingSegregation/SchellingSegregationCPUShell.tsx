import { SchellingSegregationShellProps } from './SchellingSegregationShellProps';
import { SchellingSegregationShell } from './SchellingSegregationShell';
import React from 'react';
import { SchellingSegregationKernelCPU } from './SchellingSegregationKernelCPU';
import { SchellingSegregationModel } from './SchellingSegregationModel';
import { SchellingSegregationModelProps } from './SchellingSegregationModelProps';

export function SchellingSegregationCPUShell(
  props: SchellingSegregationModelProps &
    SchellingSegregationShellProps & { model: SchellingSegregationModel },
) {
  const kernel = new SchellingSegregationKernelCPU(props.model);
  if (kernel === null) {
    return null;
  }
  return <SchellingSegregationShell {...props} kernel={kernel} />;
}
