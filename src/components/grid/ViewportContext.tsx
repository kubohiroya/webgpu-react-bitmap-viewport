import React, { ReactNode } from 'react';

export type ViewportContextProps = {
  viewportIndex: number;
  numViewports: number;
  viewportStates: Float32Array;
  initialOverscroll?: {
    x: number;
    y: number;
  };
};
const ViewportContext = React.createContext<ViewportContextProps | null>(null);

export const ViewportContextProvider = (
  props: ViewportContextProps & {
    children: ReactNode;
  }
) => {
  const value = props;

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
