import React, { useEffect, useState } from 'react';
const App = React.lazy(() => import('./app'));

const WebGPUApp = () => {
  const [isWebGPUSupported, setIsWebGPUSupported] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    const checkWebGPU = async () => {
      if (navigator.gpu) {
        try {
          const adapter = await navigator.gpu.requestAdapter();
          if (adapter) {
            console.log('WebGPU is available and adapter was found.');
            // WebGPU が有効である場合のみ動的に WebGPU 関連のコンポーネントを読み込む
            setIsWebGPUSupported(true);
          } else {
            console.log(
              'WebGPU is available but no suitable adapter was found.',
            );
            setIsWebGPUSupported(false);
          }
        } catch (e) {
          console.error('Error checking WebGPU availability:', e);
          setIsWebGPUSupported(false);
        }
      } else {
        console.log('WebGPU is not available on this browser.');
        setIsWebGPUSupported(false);
      }
    };

    checkWebGPU();
  }, []);

  if (isWebGPUSupported === null) {
    return <div>Loading...</div>; // WebGPU チェック中
  }

  if (!isWebGPUSupported) {
    return <div>WebGPU is not supported on this browser.</div>; // WebGPU 未サポートの場合の表示
  }

  // WebGPU がサポートされている場合のみ WebGPUComponent をレンダリング
  return <App />;
};

export default WebGPUApp;
