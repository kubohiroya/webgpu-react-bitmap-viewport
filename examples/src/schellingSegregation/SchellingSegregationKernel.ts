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

  updatePrimaryStateGridData(
    gridSize: number,
    agentTypeCumulativeShares: number[],
  ) {
    this.model.updatePrimaryStateGridData(gridSize, agentTypeCumulativeShares);
    this.writeDataToBuffer();
  }

  updateSecondaryStateGridData() {
    this.model.updateSecondaryStateGridData();
    this.writeDataToBuffer();
  }

  updateEmptyCellIndices() {
    // do nothing
  }

  writeDataToBuffer() {
    // do nothing
  }

  abstract updateGridData(): Promise<Uint32Array>;
}
