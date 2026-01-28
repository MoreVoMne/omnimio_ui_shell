import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // `loadEnv` reads `.env*` files (including `.env.local`). In some sandboxed
    // environments that file may exist but be unreadable, which would crash
    // Vite during config load. Treat env files as optional.
    let env: Record<string, string> = {};
    try {
      env = loadEnv(mode, '.', '');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[vite] Skipping env file load:', err);
    }

    const geminiApiKey = env.GEMINI_API_KEY ?? process.env.GEMINI_API_KEY ?? '';
    return {
      server: {
        port: 8000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(geminiApiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
