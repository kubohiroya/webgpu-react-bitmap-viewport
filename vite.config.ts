/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { resolve } from 'path';

const libConfig = defineConfig({
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

  plugins: [react(), nxViteTsPaths(),
    /*
    dts({
      // insertTypesEntry: true,
      // tsconfigPath: './tsconfig.json',
      // outDir: 'dist/types',
      // exclude: ['src/main.tsx'],
      // rollupTypes: true
    }),
     */
  ],


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
      external: ['react', 'react-dom', '@webgpu/types'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        }
      },
    },
    sourcemap: true,
  },

  test: {
    globals: true,
    cache: {
      dir: './node_modules/.vitest',
    },
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

    reporters: ['default'],
    coverage: {
      reportsDirectory: './coverage/webgpu-react-grid',
      provider: 'v8',
    },
  },
  publicDir: 'public',

});

const examplesConfig = defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/webgpu-react-grid',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'examples/index.html'),
      },
      output:{

      }
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

