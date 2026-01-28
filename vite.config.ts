import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Запрещенные порты - приложение НЕ МОЖЕТ запускаться на этих портах
const FORBIDDEN_PORTS = [8000, 5173];
const DEFAULT_PORT = 3002;

// Функция для проверки и получения безопасного порта
function getSafePort(requestedPort?: number): number {
  let port: number;
  
  if (requestedPort !== undefined) {
    port = requestedPort;
  } else if (process.env.PORT) {
    port = parseInt(process.env.PORT, 10);
  } else {
    port = DEFAULT_PORT;
  }
  
  // Строгая проверка: если порт запрещен, выбрасываем ошибку
  if (FORBIDDEN_PORTS.includes(port)) {
    console.error(`\n❌ ERROR: PORT ${port} IS FORBIDDEN`);
    console.error(`   Application cannot run on ports 8000 or 5173 under any circumstances.`);
    console.error(`   Please use a different port (e.g., 3001, 3002, 5174, 8080).\n`);
    process.exit(1);
  }
  
  return port;
}

// Проверяем переменные окружения при загрузке конфига
const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : undefined;
if (envPort !== undefined && FORBIDDEN_PORTS.includes(envPort)) {
  console.error(`\n❌ ERROR: PORT ${envPort} IS FORBIDDEN`);
  console.error(`   Application cannot run on ports 8000 or 5173 under any circumstances.`);
  console.error(`   Please unset PORT or set it to a different value.\n`);
  process.exit(1);
}

// Функция для поиска следующего безопасного порта
function findNextSafePort(startPort: number): number {
  let port = startPort;
  let attempts = 0;
  const maxAttempts = 100;
  
  while (FORBIDDEN_PORTS.includes(port) && attempts < maxAttempts) {
    port++;
    attempts++;
  }
  
  if (FORBIDDEN_PORTS.includes(port)) {
    console.error(`\n❌ ERROR: Could not find a safe port. All ports in range are forbidden.`);
    process.exit(1);
  }
  
  return port;
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@omnimio/ui-core': path.resolve(__dirname, './ui-core'),
    },
    dedupe: ['react', 'react-dom', 'framer-motion', 'lucide-react', 'three', '@react-three/fiber', '@react-three/drei'],
  },
  optimizeDeps: {
    include: ['framer-motion', 'lucide-react', 'uuid'],
  },
  server: {
    port: getSafePort(),
    strictPort: true, // Не позволяем Vite автоматически переключаться на другой порт
    proxy: {
      '/api': 'http://localhost:3000',
    },
    // Хук для проверки порта перед запуском сервера
    configureServer(server) {
      const actualPort = server.config.server.port || DEFAULT_PORT;
      
      // Дополнительная проверка на случай, если порт был изменен
      if (FORBIDDEN_PORTS.includes(actualPort)) {
        console.error(`\n❌ ERROR: Server attempted to start on forbidden port ${actualPort}`);
        console.error(`   Application cannot run on ports 8000 or 5173 under any circumstances.`);
        process.exit(1);
      }
      
      server.httpServer?.once('listening', () => {
        const address = server.httpServer?.address();
        if (address && typeof address === 'object') {
          const port = address.port;
          if (FORBIDDEN_PORTS.includes(port)) {
            console.error(`\n❌ ERROR: Server started on forbidden port ${port}`);
            console.error(`   Application cannot run on ports 8000 or 5173 under any circumstances.`);
            server.httpServer?.close();
            process.exit(1);
          }
          console.log(`✅ Server running on port ${port}`);
        }
      });
    },
  },
  preview: {
    port: getSafePort(process.env.PREVIEW_PORT ? parseInt(process.env.PREVIEW_PORT, 10) : undefined),
    strictPort: true,
  },
});
