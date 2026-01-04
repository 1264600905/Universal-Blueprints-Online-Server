import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    // GitHub Pages 配置
    // 仓库名称: Universal-Blueprints-Online-Server
    // 部署到: https://1264600905.github.io/Universal-Blueprints-Online-Server/
    // 可以通过环境变量 BASE_URL 覆盖
    const base = env.BASE_URL || '/Universal-Blueprints-Online-Server/';

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
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
