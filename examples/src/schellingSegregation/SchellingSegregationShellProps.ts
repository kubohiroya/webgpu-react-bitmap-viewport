export enum SchellingSegregationModes {
  'CPU' = 'CPU',
  'GPU' = 'WebGPU Compute Shader(64 workgroups)',
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
