import React, { ReactNode } from 'react';
import { GridShaderMode } from './GridShaderMode';

export type GridContextProps = {
  mode: GridShaderMode;
  data: Float32Array | Uint32Array;
  numColumns: number;
  numRows: number;
};

export const GridContext = React.createContext<GridContextProps | null>(null);

export const GridContextProvider = (
  props: GridContextProps & { children: ReactNode }
) => {
  const value: GridContextProps = props;
  return (
    <GridContext.Provider value={value}>{props.children}</GridContext.Provider>
  );
};

export const useGridContext = () => {
  const context = React.useContext(GridContext);
  if (!context) {
    throw new Error('useGridContext must be used within a GridContextProvider');
  }
  return context;
};

export default GridContext;
