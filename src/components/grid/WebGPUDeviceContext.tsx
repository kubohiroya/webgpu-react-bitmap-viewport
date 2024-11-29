import React, { ReactNode, useLayoutEffect, useState } from 'react';

type WebGPUDeviceContextType = GPUDevice | null;

export const WebGPUDeviceContext =
  React.createContext<WebGPUDeviceContextType>(null);

export const WebGPUDeviceContextProvider = ({
  loadingMessage,
  notSupportedMessage,
  children,
}: {
  loadingMessage?: ReactNode;
  notSupportedMessage?: ReactNode;
  children?: ReactNode;
}) => {
  const [device, setDevice] = useState<GPUDevice | null>(null);
  const [isWebGPUSupported, setIsWebGPUSupported] = useState<boolean | null>(
    null
  );

  useLayoutEffect(() => {
    (async () => {
      const initWebGPU = async function (
        callback: (device: GPUDevice | undefined) => void
      ) {
        const requestDevice = async (): Promise<GPUDevice | undefined> => {
          if (!navigator.gpu || !navigator.gpu.requestAdapter) {
            setIsWebGPUSupported(false);
            return;
          }
          try {
            const adapter = await navigator.gpu.requestAdapter();
            if (!adapter) {
              setIsWebGPUSupported(false);
              return;
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
            console.error('Trying to recreate the device...' + ex);
            return await requestDevice();
          }
        };

        callback(await requestDevice());
      };
      await initWebGPU((device: GPUDevice | undefined) => {
        if (!navigator.gpu || !device) {
          setIsWebGPUSupported(false);
          return;
        }
        setIsWebGPUSupported(true);
        setDevice(device);
      });
    })();

    return () => {
      device?.destroy();
    };
  }, []);

  if (isWebGPUSupported === null) {
    return loadingMessage ? loadingMessage : <p>Loading...</p>;
  }

  if (!isWebGPUSupported) {
    return notSupportedMessage ? (
      notSupportedMessage
    ) : (
      <p>WebGPU is not supported on this browser.</p>
    );
  }

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
