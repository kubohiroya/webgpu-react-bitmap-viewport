export enum SegregationModes {
  'JS' = 'Plain JavaScript',
  'GPU' = 'JavaScript + WebGPU(64 workgroups)',
  'ASM' = 'JavaScript + WebAssembly',
  'ASM_GPU' = 'JavaScript + WebAssembly + WebGPU(64 workgroups)',
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
};
