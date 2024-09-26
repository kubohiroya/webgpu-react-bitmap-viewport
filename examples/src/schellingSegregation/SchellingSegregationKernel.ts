import { SchellingSegregationModel } from './SchellingSegregationModel';
import { SchellingSegregationModelHandler } from './SchellingSegregationModelHandler';

export abstract class SchellingSegregationKernel {
  protected model: SchellingSegregationModel;

  constructor(model: SchellingSegregationModel) {
    this.model = model;
  }

  getModel(): SchellingSegregationModel {
    return this.model;
  }

  setGridSize(gridSize: number) {
    this.model.setGridSize(gridSize);
  }

  updateInitialStateGridData(
    agentTypeShares: number[],
    agentTypeCumulativeShares: number[],
  ) {
    this.model.updateInitialStateGridData(
      agentTypeShares,
      agentTypeCumulativeShares,
    );
  }

  sync() {
    this.model.sync();
  }

  setTolerance(newTolerance: number) {
    this.model.setTolerance(newTolerance);
  }

  abstract updateGridData(): Promise<Uint32Array>;
}
