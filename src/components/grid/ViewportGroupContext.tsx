import React, { ReactNode } from 'react';

export type ViewportGroupContextProps = {
  viewportIndex: number;
  numViewports: number;
  viewportStates: Float32Array;
};
const ViewportGroupContext =
  React.createContext<ViewportGroupContextProps | null>(null);

export const ViewportGroupContextProvider = (
  props: ViewportGroupContextProps & {
    children: ReactNode;
  }
) => {
  return (
    <ViewportGroupContext.Provider value={props}>
      {props.children}
    </ViewportGroupContext.Provider>
  );
};

export const useViewportGroupContext = () => {
  const context = React.useContext(ViewportGroupContext);
  if (!context) {
    throw new Error(
      'useViewportGroupContext must be used within a ViewportGroupContextProvider'
    );
  }
  return context;
};

export default ViewportGroupContext;
