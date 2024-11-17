import { defineConfig } from 'vite';
import assemblyScriptPlugin from 'vite-plugin-assemblyscript-asc';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  root: __dirname,
  cacheDir: './node_modules/.vite/.',

  server: {
    host: 'localhost',
    port: 4200,
  },

  preview: {
    host: '0.0.0.0',
    port: 4300,
  },

  publicDir: './public',

  base: '/webgpu-react-bitmap-viewport',

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
    {
      name: 'configure-response-headers',
      configureServer: (server) => {
        server.middlewares.use((_req, res, next) => {
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
          next();
        });
      },
    },
  ],
  build: {
    target: 'esnext',
    outDir: './dist/webgpu-react-bitmap-viewport',
    rollupOptions: {
      external: ['@webgpu/types'],
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
