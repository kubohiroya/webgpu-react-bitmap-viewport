import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import assemblyScriptPlugin from 'vite-plugin-assemblyscript-asc';
import topLevelWait from 'vite-plugin-top-level-await';
import { resolve } from 'path';

export default defineConfig({
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

  publicDir: './public',

  base: '/webgpu-react-bitmap-viewport',

  resolve: {
    alias: {
      'webgpu-react-bitmap-viewport': resolve(__dirname, '../src/index.ts'),
      SchellingSegregationKernelFunctions: resolve(
        __dirname,
        './dist/webgpu-react-bitmap-viewport/examples/lib/SchellingSegregationKernelFunctions.release',
      ),
    },
  },

  plugins: [
    react(),
    assemblyScriptPlugin({
      projectRoot: resolve(__dirname, '../'),
      srcEntryFile: 'examples/src/as/assembly/index.ts',
      configFile: 'examples/asconfig.json',
      targetWasmFile:
        'examples/dist/webgpu-react-bitmap-viewport/lib/SchellingSegregationKernelFunctions.wasm',
    }),
    wasm(),
    topLevelWait(),
  ],
  build: {
    // target: 'esnext',
    outDir: './dist/webgpu-react-bitmap-viewport',
    rollupOptions: {
      external: ['@webgpu/types', 'SchellingSegregationKernelFunctions'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
});
