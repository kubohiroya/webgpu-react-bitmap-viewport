import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  root: __dirname,
  publicDir: resolve(__dirname, './examples/public'),
  cacheDir: './node_modules/.vite/.',

  resolve: {
    alias: {
      'webgpu-react-bitmap-viewport': resolve(__dirname, './src/index.ts'),
    },
    dedupe: ['react', 'react-dom'],
  },

  plugins: [react()],

  build: {
    // target: 'esnext',
    copyPublicDir: false,
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
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        '@webgpu/types',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'ReactJSXRuntime',
          'react/jsx-dev-runtime': 'ReactJSXDevRuntime',
        },
      },
    },
    sourcemap: true,
  },
});
