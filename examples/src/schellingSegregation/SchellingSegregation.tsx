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

  if (
    props.mode === SchellingSegregationModes.JS ||
    props.mode === SchellingSegregationModes.WEBASM
  ) {
    return <SchellingSegregationCPUShell {...props} model={model} />;
  } else if (
    props.mode === SchellingSegregationModes.WEBGPU ||
    props.mode === SchellingSegregationModes.WEBGPU_WEBASM
  ) {
    return <SchellingSegregationGPUShell {...props} model={model} />;
  }
}
