import { createRoot } from 'react-dom/client';
//import WebGPUApp from './WebGPUApp';
import App from './app';

const root = createRoot(document.getElementById('root') as HTMLElement);

const render = () => {
  //root.render(<WebGPUApp />);
  root.render(<App />);
};

render();
