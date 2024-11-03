import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  root: __dirname,
  cacheDir: './node_modules/.vite/.',

  plugins: [react()],

  build: {
    // target: 'esnext',
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
