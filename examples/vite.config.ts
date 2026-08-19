import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { assemblyScriptPlugin } from './vite-plugin-assemblyscript';

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
    dedupe: ['react', 'react-dom'],
  },

  plugins: [
    react(),
    assemblyScriptPlugin({
      projectRoot: __dirname,
      configFile: 'asconfig.json',
      sourceDirectory: 'src/as/assembly',
      entryFile: 'src/as/assembly/index.ts',
    }),
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
