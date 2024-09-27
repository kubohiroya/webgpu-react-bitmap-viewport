import React from 'react';
import {
  SchellingSegregationModes,
  SchellingSegregationShellProps,
} from './SchellingSegregationShellProps';
import { SchellingSegregationModelProps } from './SchellingSegregationModelProps';
import { SchellingSegregationCPUShell } from './SchellingSegregationCPUShell';
import { SchellingSegregationGPUShell } from './SchellingSegregationGPUShell';
import { SchellingSegregationModel } from './SchellingSegregationModel';

export default function SchellingSegregation(
  props: SchellingSegregationModelProps & SchellingSegregationShellProps,
) {
  const model = new SchellingSegregationModel({
    ...props,
  });

  if (props.mode === SchellingSegregationModes.CPU || props.gridSize < 16) {
    return <SchellingSegregationCPUShell {...props} model={model} />;
  } else if (props.mode === SchellingSegregationModes.GPU) {
    return <SchellingSegregationGPUShell {...props} model={model} />;
  }
}
