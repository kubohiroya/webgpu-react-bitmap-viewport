export enum SchellingSegregationModes {
  'JS' = 'Plain JavaScript',
  'WEBGPU' = 'JavaScript + WebGPU ComputeShader(64 workgroups)',
  'WEBASM' = 'JavaScript + WebAssembly',
  'WEBGPU_WEBASM' = 'JavaScript + WebGPU ComputeShader(64 workgroups) + WebAssembly',
}

export type SchellingSegregationShellProps = {
  id: string;
  mode: SchellingSegregationModes;
  canvasSize: {
    width: number;
    height: number;
  };
  headerOffset: {
    top: number;
    left: number;
  };
  speed: number;
  iterations?: number;
  autoStart?: boolean;
};
