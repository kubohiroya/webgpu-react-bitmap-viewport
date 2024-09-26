import React, { ReactNode, useLayoutEffect, useState } from 'react';

export type WebGPUDeviceContextType = GPUDevice | null;

export const WebGPUDeviceContext =
  React.createContext<WebGPUDeviceContextType>(null);

export const WebGPUDeviceContextProvider = ({
  children,
}: {
  children?: ReactNode;
}) => {
  const [device, setDevice] = useState<GPUDevice | null>(null);

  useLayoutEffect(() => {
    (async () => {
      const initWebGPU = async function (
        callback: (device: GPUDevice) => void
      ) {
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
                return callback(await requestDevice());
              }
            });
            return device;
          } catch (ex: any) {
            console.error('Trying to recreate the device...');
            return await requestDevice();
          }
        };

        callback(await requestDevice());
      };
      await initWebGPU((device: GPUDevice) => {
        if (!navigator.gpu) {
          throw new Error('WebGPU not supported on this browser.');
        }
        setDevice(device);
      });
    })();

    return () => {
      device?.destroy();
    };
  }, []);

  return !device ? null : (
    <WebGPUDeviceContext.Provider value={device}>
      {children}
    </WebGPUDeviceContext.Provider>
  );
};

export const useWebGPUDeviceContext = () => {
  const device = React.useContext(WebGPUDeviceContext);
  if (device == null) {
    throw new Error(
      'useWebGPUDeviceContext must be used within a WebGPUDeviceContextProvider'
    );
  }
  return device;
};
