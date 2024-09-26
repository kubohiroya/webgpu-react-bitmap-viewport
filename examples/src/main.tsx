import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { Index } from './index';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

const render = () => {
  root.render(<Index />);
};

render();
