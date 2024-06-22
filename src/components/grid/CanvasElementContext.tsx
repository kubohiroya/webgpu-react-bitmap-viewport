import React, { ReactNode, useLayoutEffect } from 'react';

export type CanvasElementContextCommons = {
  canvasId: string;
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

export type CanvasElementContextProps = CanvasElementContextCommons;
export type CanvasElementEventHandlers = Partial<{
  onMouseUp: (event: MouseEvent) => void;
  onMouseDown: (event: MouseEvent) => void;
  onMouseOut: (event: MouseEvent) => void;
  onMouseMove: (event: MouseEvent) => void;
  onWheel: (event: WheelEvent) => void;
}>;

export type CanvasElementContextType = CanvasElementContextCommons &
  CanvasElementEventHandlers & {
  canvasRef: React.RefObject<HTMLCanvasElement>;
};

export const CanvasElementContext =
  React.createContext<CanvasElementContextType | null>(null);

export const CanvasElementContextProvider = (
  props: CanvasElementContextProps & { children?: ReactNode }
) => {
  const canvasRef = React.createRef<HTMLCanvasElement>();
  const value: CanvasElementContextType = {
    ...props,
    canvasRef
  };

  useLayoutEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'wait';
    }
  }, [canvasRef.current]);

  return (
    <CanvasElementContext.Provider value={value}>
      <canvas
        id={props.canvasId}
        ref={canvasRef}
        width={props.canvasSize.width}
        height={props.canvasSize.height}
      ></canvas>
      {props.children}
    </CanvasElementContext.Provider>
  );
};

export const useCanvasElementContext = () => {
  const context = React.useContext(CanvasElementContext);
  if (!context) {
    throw new Error(
      'useCanvasElementContext must be used within a CanvasElementContext'
    );
  }
  return context;
};

export default CanvasElementContext;
