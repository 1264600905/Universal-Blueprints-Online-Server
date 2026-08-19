import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    // 固定为新公开仓库的 base，用于 GitHub Pages 部署
    const base = '/Universal-Blueprints-Online-Server/';

    return {
      base: base,
      build: {
        // 输出到 docs 目录用于 GitHub Pages
        outDir: 'docs',
        emptyOutDir: true,
      },
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
