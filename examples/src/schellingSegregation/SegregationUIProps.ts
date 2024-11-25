export enum SegregationModes {
  'JS' = 'Plain JavaScript',
  'GPU' = 'JavaScript + WebGPU(64 workgroups)',
  'AS' = 'JavaScript + WebAssembly',
  'ASGPU' = 'JavaScript + WebAssembly + WebGPU(64 workgroups)',
}

export type SegregationUIProps = {
  id: string;
  mode: SegregationModes;
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

  agentTypeShares: number[];
  tolerance: number;
};
