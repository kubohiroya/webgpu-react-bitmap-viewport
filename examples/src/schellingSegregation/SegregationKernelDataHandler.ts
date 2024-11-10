export type SegregationKernelDataHandler = {
  updateSize: (
    width: number,
    height: number,
    agentTypeCumulativeShares: number[],
  ) => void;
};
