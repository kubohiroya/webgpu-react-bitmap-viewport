export type SchellingSegregationModelHandler = {
  setTolerance: (tolerance: number) => void;
  setGridSize: (gridSize: number) => void;
  updateInitialStateGridData: (
    agentTypeShares: number[],
    agentTypeCumulativeShares: number[],
  ) => void;
  sync(): void;
};
