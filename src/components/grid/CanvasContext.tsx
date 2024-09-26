import { createContext, ReactNode, useContext } from 'react';

export type CanvasContextType = {
  canvasSize: {
    width: number;
    height: number;
  };
  headerOffset: {
    top: number;
    left: number;
  };
  scrollBar?: {
    radius: number;
    margin: number;
  };
  multisample?: number | undefined;
};

export const CanvasContext = createContext<CanvasContextType | null>(null);

export const CanvasContextProvider = (
  props: CanvasContextType & {
    children?: ReactNode;
  }
) => {
  const canvasContextValue = {
    ...props,
  };
  return (
    <CanvasContext.Provider value={canvasContextValue}>
      {props.children}
    </CanvasContext.Provider>
  );
};

export const useCanvasContext = () => {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error(
      'useCanvasContext must be used within a CanvasContextProvider'
    );
  }
  return context;
};
