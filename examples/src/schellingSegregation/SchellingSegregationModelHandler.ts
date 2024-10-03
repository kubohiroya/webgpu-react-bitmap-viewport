export type SchellingSegregationModelHandler = {
  updatePrimaryStateGridData: (
    gridSize: number,
    agentTypeCumulativeShares: number[],
  ) => void;

  updateSecondaryStateGridData: () => void;

  setTolerance: (tolerance: number) => void;
};
