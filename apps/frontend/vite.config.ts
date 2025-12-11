import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@services': path.resolve(__dirname, './src/services'),
        '@types': path.resolve(__dirname, './src/types'),
      },
    },
    server: {
      port: parseInt(env.FRONTEND_PORT || '5173'),
      proxy: {
        '/api': {
          target: env.BACKEND_URL || 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
      'import.meta.env.VITE_WS_URL': JSON.stringify(env.VITE_WS_URL),
    },
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
    },
  };
});
