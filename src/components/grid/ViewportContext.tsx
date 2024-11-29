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
  initialOverscroll?: {
    x: number;
    y: number;
  };
  multisample?: number | undefined;
};

export const ViewportContext = createContext<CanvasContextType | null>(null);

export const ViewportContextProvider = (
  props: CanvasContextType & {
    children?: ReactNode;
  }
) => {
  const canvasContextValue = {
    ...props,
  };
  return (
    <ViewportContext.Provider value={canvasContextValue}>
      {props.children}
    </ViewportContext.Provider>
  );
};

export const useViewportContext = () => {
  const context = useContext(ViewportContext);
  if (!context) {
    throw new Error(
      'useViewportContext must be used within a ViewportContextProvider'
    );
  }
  return context;
};
