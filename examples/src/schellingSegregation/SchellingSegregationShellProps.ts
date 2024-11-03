export enum SchellingSegregationModes {
  'JS' = 'Plain JavaScript',
  'WEBGPU' = 'WebGPU Compute Shader(64 workgroups)',
  'WEBASM' = 'CPU + WebAssembly',
  'WEBGPU_WEBASM' = 'WebGPU Compute Shader(64 workgroups) + WebAssembly',
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
