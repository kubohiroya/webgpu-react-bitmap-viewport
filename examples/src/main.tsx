import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { GridExample } from './GridExample';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const render = () => {
  root.render(
    <>
      <GridExample />
    </>
  );
};

render();

