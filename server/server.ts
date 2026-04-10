import http from 'http';
import { createApp, configureFrontend, ensureDatabaseConnection } from './app.ts';

const HOST = process.env.HOST || '0.0.0.0';
const DEFAULT_PORT = Number(process.env.PORT || 3000);
const FALLBACK_PORT = Number(process.env.FALLBACK_PORT || 3001);
const hasExplicitPort = Boolean(process.env.PORT);

let currentPort = DEFAULT_PORT;

const log = (scope: string, message: string, details?: Record<string, unknown>) => {
  if (details) {
    console.log(`[server:${scope}] ${message}`, details);
    return;
  }

  console.log(`[server:${scope}] ${message}`);
};

const app = createApp();

const createHttpServer = () => {
  const server = http.createServer(app);

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      if (!hasExplicitPort && currentPort !== FALLBACK_PORT) {
        log('startup', `Port ${currentPort} is busy. Retrying on ${FALLBACK_PORT}.`);
        currentPort = FALLBACK_PORT;
        server.close(() => {
          createHttpServer().listen(currentPort, HOST);
        });
        return;
      }

      console.error(`[server:error] Port ${HOST}:${currentPort} is already in use.`);
      process.exit(1);
    }

    console.error('[server:error] HTTP server failed to start.', error);
    process.exit(1);
  });

  return server;
};

async function startServer() {
  await ensureDatabaseConnection();
  await configureFrontend(app);

  const server = createHttpServer();
  server.listen(currentPort, HOST, () => {
    const address = server.address();
    log('startup', 'Backend server is listening.', {
      host: typeof address === 'object' && address ? address.address : HOST,
      port: typeof address === 'object' && address ? address.port : currentPort,
      nodeEnv: process.env.NODE_ENV || 'development',
      pid: process.pid,
    });
  });
}

process.on('unhandledRejection', (reason) => {
  console.error('[server:error] Unhandled promise rejection.', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[server:error] Uncaught exception.', error);
});

startServer().catch((error) => {
  console.error('[server:error] Failed to bootstrap the backend.', error);
  process.exit(1);
});
