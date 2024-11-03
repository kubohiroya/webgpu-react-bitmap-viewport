import { createRoot } from 'react-dom/client';
import WebGPUApp from './WebGPUApp';

const root = createRoot(document.getElementById('root') as HTMLElement);

const render = () => {
  root.render(<WebGPUApp src="./app" />);
};

render();
