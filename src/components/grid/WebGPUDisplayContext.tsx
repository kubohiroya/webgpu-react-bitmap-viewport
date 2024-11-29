import React, { ReactNode, useContext, useEffect } from 'react';
import { CanvasRefContext } from './CanvasRefContext';
import { useWebGPUDeviceContext } from './WebGPUDeviceContext';
import { useViewportContext } from './ViewportContext';

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
  const canvasContext = useViewportContext();
  const canvas = useContext(CanvasRefContext);

  const [displayContextValue, setDisplayContextValue] =
    React.useState<WebGPUDisplayContextType | null>(null);

  useEffect(() => {
    if (!device) {
      throw new Error('device is not configured.');
    }
    if (!canvasContext) {
      throw new Error('ViewportContext not found.');
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
