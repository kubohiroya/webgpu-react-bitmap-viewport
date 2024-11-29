import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
} from 'react';

export type CanvasRefType = HTMLCanvasElement;

export const CanvasRefContext = createContext<CanvasRefType | null>(null);

export const CanvasRefProvider = ({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children?: ReactNode;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = React.useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      setCanvas(canvasRef.current);
    }
  }, [canvasRef.current]);

  return (
    <>
      <canvas ref={canvasRef} width={width} height={height}></canvas>
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
