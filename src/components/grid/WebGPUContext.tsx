import React, { ReactNode, useLayoutEffect, useState } from 'react';
import { CanvasElementContextType, useCanvasElementContext } from './CanvasElementContext';
import { RenderBundleBuilder } from './RenderBundleBuilder';
import { GridContextProps, GridContextValue, useGridContext } from './GridContext';
import { useViewportContext } from './ViewportContext';

export type WebGPUContextType = {
  device: GPUDevice | null;
  canvasContext: GPUCanvasContext | null;
  canvasFormat: GPUTextureFormat | null;
  texture: GPUTexture | null;
};

export const WebGPUContext = React.createContext<WebGPUContextType>({
  device: null,
  canvasContext: null,
  canvasFormat: null,
  texture: null,
});

export const WebGPUContextProvider = ({
                                        children
                                      }: {
  children?: ReactNode;
}) => {
  const canvasElementContext = useCanvasElementContext();
  const gridContext = useGridContext();

  const [context, setContext] = useState<WebGPUContextType>({
    device: null,
    canvasContext: null,
    canvasFormat: null,
    texture: null,
  });

  useLayoutEffect(() => {
    if (context.device) {
      return;
    }
    (async () => {
      const initWebGPU = async function(
        callback: (device: GPUDevice, gridContext: GridContextValue) => void
      ) {
        if (!canvasElementContext.canvasRef.current) return;

        const requestDevice = async (): Promise<GPUDevice> => {
          try {
            const adapter = await navigator.gpu.requestAdapter();
            if (!adapter) {
              throw new Error('No appropriate GPUAdapter found.');
            }

            const device = await adapter.requestDevice();
            device.lost.then(async (info) => {
              console.error(
                `WebGPU device was lost: ${info.message}: ${info.reason}`
              );

              // 'reason' will be 'destroyed' if we intentionally destroy the device.
              if (info.reason !== 'destroyed') {
                // try again
                console.error('Trying to recreate the device...');
                return callback(await requestDevice(), gridContext);
              }
            });
            return device;
          } catch (ex: any) {
            console.error('Trying to recreate the device...');
            return await requestDevice();
          }
        };

        callback(await requestDevice(), gridContext);
      };
      await initWebGPU(
        (device: GPUDevice, gridContextProps: GridContextProps) => {
          const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
          const canvasElement = canvasElementContext.canvasRef.current;

          if (!canvasElement) {
            throw new Error('Canvas element not found.');
          }

          const canvasContext = canvasElement.getContext('webgpu');

          if (!canvasContext || !navigator.gpu || !canvasFormat) {
            throw new Error('WebGPU not supported on this browser.');
          }
          canvasContext.configure({
            device,
            format: canvasFormat,
            //alphaMode: 'opaque',
            alphaMode: 'premultiplied'
          });

          const texture = canvasContext.getCurrentTexture();

          setContext({
            canvasContext,
            device,
            texture,
            canvasFormat
          });
        }
      );
    })();

    return () => {
      context.texture?.destroy();
      context.canvasContext?.unconfigure();
      context.device?.destroy();
    };
  }, [canvasElementContext.canvasRef.current]);

  if (
    !context.device ||
    !context.canvasContext
  ) {
    return;
  }

  return (
    <WebGPUContext.Provider value={context}>{children}</WebGPUContext.Provider>
  );
};

export const useWebGPUContext = () => {
  const context = React.useContext(WebGPUContext);

  if (!context) {
    throw new Error(
      'useWebGPUContext must be used within a WebGPUContextProvider'
    );
  }

  if (
    !context.device ||
    !context.canvasContext
  ) {
    return;
  }

  return context;
};

export default WebGPUContext;
