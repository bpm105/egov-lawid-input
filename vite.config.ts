import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'node:path';

export default defineConfig(({ mode }) => {
  if (mode === 'lib' || process.env.BUILD_LIB) {
    // ライブラリビルド
    return {
      plugins: [
        react(),
        dts({
          include: ['src'],
          rollupTypes: true,
          insertTypesEntry: true,
        }),
      ],
      build: {
        lib: {
          entry: resolve(__dirname, 'src/index.ts'),
          name: 'EgovLawIdInput',
          formats: ['es', 'cjs'],
          fileName: (format) => (format === 'es' ? 'index.mjs' : 'index.js'),
        },
        rollupOptions: {
          external: ['react', 'react-dom', 'react/jsx-runtime'],
          output: {
            globals: {
              react: 'React',
              'react-dom': 'ReactDOM',
            },
            assetFileNames: (assetInfo) => {
              if (assetInfo.name?.endsWith('.css')) return 'styles.css';
              return assetInfo.name ?? 'asset';
            },
          },
        },
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: true,
      },
    };
  }
  if (mode === 'examples') {
    // GitHub Pages 向け examples プロダクションビルド
    return {
      plugins: [react()],
      root: resolve(__dirname, 'examples'),
      base: '/egov-lawid-input/',
      build: {
        outDir: resolve(__dirname, 'dist-examples'),
        emptyOutDir: true,
      },
    };
  }
  // dev サーバー: examples/ をルートにする
  return {
    plugins: [react()],
    root: resolve(__dirname, 'examples'),
    server: {
      port: 5173,
    },
  };
});
