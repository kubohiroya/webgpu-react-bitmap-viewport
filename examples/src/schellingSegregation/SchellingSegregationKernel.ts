import { SchellingSegregationModel } from './SchellingSegregationModel';

export abstract class SchellingSegregationKernel {
  protected model: SchellingSegregationModel;

  constructor(model: SchellingSegregationModel) {
    this.model = model;
  }

  getModel(): SchellingSegregationModel {
    return this.model;
  }

  setTolerance(newTolerance: number) {
    this.model.setTolerance(newTolerance);
  }

  updateInitialStateGridData(
    gridSize: number,
    agentTypeCumulativeShares: number[],
  ) {
    this.model.updateInitialStateGridData(gridSize, agentTypeCumulativeShares);
  }

  sync() {
    this.model.sync();
  }

  abstract updateGridData(): Promise<Uint32Array>;
}
