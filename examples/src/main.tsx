import { createRoot } from 'react-dom/client';
import App from './app';

const root = createRoot(document.getElementById('root') as HTMLElement);

const render = () => {
  root.render(<App />);
};

render();

// ReactDOM.createRoot(document.getElementById('root')).render(<App />);
