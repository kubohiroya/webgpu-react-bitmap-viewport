import React, { ReactNode } from 'react';
import { useGridContext } from './GridContext';

export type ViewportContextProps = {
  initialViewport: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
};
const ViewportContext = React.createContext<ViewportContextProps | null>(null);

export const ViewportContextProvider = (
  props: ViewportContextProps & {
    children: ReactNode;
  }
) => {
  const gridContext = useGridContext();
  const value = props || {
    top: 0,
    bottom: gridContext.gridSize.numRows,
    left: 0,
    right: gridContext.gridSize.numColumns,
  };

  return (
    <ViewportContext.Provider value={value}>
      {props.children}
    </ViewportContext.Provider>
  );
};

export const useViewportContext = () => {
  const context = React.useContext(ViewportContext);
  if (!context) {
    throw new Error(
      'useViewportContext must be used within a ViewportContextProvider'
    );
  }
  return context;
};

export default ViewportContext;
