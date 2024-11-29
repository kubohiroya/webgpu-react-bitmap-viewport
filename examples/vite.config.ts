import { defineConfig } from 'vite';
import assemblyScriptPlugin from 'vite-plugin-assemblyscript-asc';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  root: __dirname,

  server: {
    port: 4200,
    host: 'localhost',
  },

  base: '/webgpu-react-bitmap-viewport/examples/',

  resolve: {
    alias: {
      'webgpu-react-bitmap-viewport': resolve(__dirname, '../src/index.ts'),
    },
  },

  plugins: [
    react(),
    assemblyScriptPlugin({
      projectRoot: '.',
      configFile: 'asconfig.json',
      srcMatch: 'src/as/assembly',
      srcEntryFile: 'src/as/assembly/index.ts',
      targetWasmFile:
        'build/webgpu-react-bitmap-viewport/as/SegregationKernelFunctions.release/index.wasm',
      distFolder: 'dist',
    }) as any,
  ],
  build: {
    target: 'esnext',
    outDir: './dist/webgpu-react-bitmap-viewport/examples',
    rollupOptions: {
      external: ['@webgpu/types'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
      input: {
        main: 'index.html',
      },
    },
  },
});
