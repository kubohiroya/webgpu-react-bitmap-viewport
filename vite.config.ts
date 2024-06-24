import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const libConfig = defineConfig({
  root: __dirname,
  cacheDir: './node_modules/.vite/.',

  plugins: [react()],

  build: {
    outDir: './dist/lib',
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      entry: resolve(__dirname, './src/index.ts'),
      name: 'WebGPU-React-Grid',
      fileName: (format) => `webgpu-react-grid.${format}.js`
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'jsx-runtime', '@webgpu/types'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        }
      },
    },
    sourcemap: true,
  },

  publicDir: 'public',

});

const examplesConfig = defineConfig({
  root: __dirname,
  cacheDir: './node_modules/.vite/.',

  server: {
    port: 4200,
    host: 'localhost',
  },

  preview: {
    port: 4300,
    host: 'localhost',
  },

  base: '/webgpu-react-grid',

  resolve:{
    alias:{
      'webgpu-react-grid': resolve(__dirname, 'src/index.ts'),
    }
  },

  plugins: [react()],
  build: {
    outDir: 'dist/webgpu-react-grid',
    rollupOptions: {
      external: ['@webgpu/types'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        }
      },
      input: {
        main: resolve(__dirname, 'examples/index.html'),
      },
    },
  },
});

export default defineConfig(({ command, mode }) => {
  if (mode === 'lib') {
    return libConfig;
  } else {
    return examplesConfig;
  }
});

