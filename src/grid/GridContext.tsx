import React, { ReactNode } from 'react';

export type GridContextProps = {
  data: Float32Array;
  gridSize: { numColumns: number; numRows: number };
};

export type GridContextValue = GridContextProps;

export const GridContext = React.createContext<GridContextProps | null>(null);

export const GridContextProvider = (
  props: GridContextProps & { children: ReactNode }
) => {
  const value: GridContextProps = {
    data: props.data,
    gridSize: props.gridSize
  };
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
