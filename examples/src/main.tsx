import { Index } from './index';
import { createRoot } from 'react-dom/client';

const root = createRoot(document.getElementById('root') as HTMLElement);

const render = () => {
  root.render(<Index />);
};

render();
