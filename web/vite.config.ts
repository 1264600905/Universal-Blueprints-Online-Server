import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    // Base 路径配置
    // Docker/Zeabur 部署: '/' (根路径)
    // GitHub Pages: '/Universal-Blueprints-Online-Server/'
    // 可以通过环境变量 BASE_URL 覆盖
    const base = env.BASE_URL || '/';

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
