import React, { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { Grid1024 } from './Grid1024';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const render = () => {

  root.render(
    <>
      <Grid1024 />
    </>
  );
};

render();

