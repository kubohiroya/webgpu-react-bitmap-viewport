import React, {
  createContext,
  ReactNode,
  RefObject,
  useContext,
  useEffect,
  useRef,
} from 'react';
import {
  CanvasContext as CanvasContext1,
  useCanvasContext,
} from './CanvasContext';
/*
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
  React.createContext<CanvasElementContextType>({
    canvasId: '',
    canvasSize: { width: 0, height: 0 },
    headerOffset: { top: 0, left: 0 },
    canvasRef: { current: null },
  });
export const CanvasElementContextProvider = (
  props: CanvasElementContextProps & { children?: ReactNode }
) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const value: CanvasElementContextType = {
    ...props,
    canvasRef,
  };

  useLayoutEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'wait';
    }
  }, [canvasRef.current]);

  return (
    <>
      <h2>canvasId: {props.canvasId}</h2>
      <canvas
        id={props.canvasId}
        ref={value.canvasRef}
        width={props.canvasSize.width}
        height={props.canvasSize.height}
      ></canvas>
      <CanvasElementContext.Provider value={value}>
        {props.children}
      </CanvasElementContext.Provider>
      ;
    </>
  );
};
*/

export type CanvasRefType = HTMLCanvasElement;

export const CanvasRefContext = createContext<CanvasRefType | null>(null);

export const CanvasRefProvider = ({ children }: { children?: ReactNode }) => {
  const canvasContext = useCanvasContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = React.useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      setCanvas(canvasRef.current);
    }
  }, [canvasRef.current]);

  return (
    <>
      <canvas
        ref={canvasRef}
        width={canvasContext?.canvasSize.width}
        height={canvasContext?.canvasSize.height}
      ></canvas>
      {canvas && (
        <CanvasRefContext.Provider value={canvas}>
          {children}
        </CanvasRefContext.Provider>
      )}
    </>
  );
};

export const useCanvasRefContext = () => {
  const context = useContext(CanvasRefContext);
  if (!context) {
    throw new Error(
      'useCanvasRefContext must be used within a CanvasRefProvider'
    );
  }
  return context;
};
