export type SchellingSegregationModelHandler = {
  updateInitialStateGridData: (
    gridSize: number,
    agentTypeCumulativeShares: number[],
  ) => void;
  setTolerance: (tolerance: number) => void;
  sync(): void;
};
