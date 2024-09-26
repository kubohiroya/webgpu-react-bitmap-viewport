import React, { ReactNode, useContext, useEffect } from 'react';
import { CanvasRefContext } from './CanvasRefContext';
import { useWebGPUDeviceContext } from './WebGPUDeviceContext';
import { useCanvasContext } from './CanvasContext';

export type WebGPUDisplayContextType = {
  gpuCanvasContext: GPUCanvasContext;
  textureFormat: GPUTextureFormat;
  texture: GPUTexture;
};

export const WebGPUDisplayContext =
  React.createContext<WebGPUDisplayContextType | null>(null);

export const WebGPUDisplayContextProvider = ({
  children,
}: {
  children?: ReactNode;
}) => {
  const device = useWebGPUDeviceContext();
  const canvasContext = useCanvasContext();
  const canvas = useContext(CanvasRefContext);

  //const displayContext = useContext(WebGPUDisplayContext);
  const [displayContextValue, setDisplayContextValue] =
    React.useState<WebGPUDisplayContextType | null>(null);

  useEffect(() => {
    if (!device) {
      throw new Error('device is not configured.');
    }
    if (!canvasContext) {
      throw new Error('CanvasContext not found.');
    }
    if (!canvas) {
      throw new Error('CanvasRef not found.');
    }

    const textureFormat = navigator.gpu.getPreferredCanvasFormat();

    const gpuCanvasContext = canvas.getContext('webgpu');
    if (!gpuCanvasContext) {
      throw new Error('WebGPU not supported on this browser.');
    }

    gpuCanvasContext.configure({
      device,
      format: textureFormat,
      alphaMode: 'premultiplied',
    });

    const texture = gpuCanvasContext.getCurrentTexture();

    setDisplayContextValue({
      gpuCanvasContext,
      textureFormat,
      texture,
    });

    return () => {
      //gpuCanvasContext?.unconfigure();
      texture?.destroy();
    };
  }, [device, canvasContext, canvas]);

  return (
    displayContextValue && (
      <WebGPUDisplayContext.Provider value={displayContextValue}>
        {children}
      </WebGPUDisplayContext.Provider>
    )
  );
};

export const useWebGPUDisplayContext = () => {
  const displayContext = React.useContext(WebGPUDisplayContext);

  if (!displayContext) {
    throw new Error(
      'useWebGPUCanvasContext must be used within a WebGPUCanvasContextProvider'
    );
  }

  return displayContext;
};
