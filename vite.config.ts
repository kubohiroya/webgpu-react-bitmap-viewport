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
      name: 'webgpu-react-bitmap-viewport',
      fileName: (format) => `webgpu-react-bitmap-viewport.${format}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'jsx-runtime', '@webgpu/types'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    sourcemap: true,
  },
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

  publicDir: './examples/public',

  base: '/webgpu-react-bitmap-viewport',

  resolve: {
    alias: {
      'webgpu-react-bitmap-viewport': resolve(__dirname, 'src/index.ts'),
    },
  },

  plugins: [react()],
  build: {
    outDir: 'dist/webgpu-react-bitmap-viewport',
    rollupOptions: {
      external: ['@webgpu/types'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
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
