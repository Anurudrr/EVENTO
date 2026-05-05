import http from 'http';
import { createApp, configureFrontend, ensureDatabaseConnection, getDatabaseStatus } from './app.ts';
import {
  getFallbackPort,
  getNodeEnv,
  getServerHost,
  getServerPort,
  hasEnvValue,
  isDevelopmentEnv,
} from './utils/env.ts';

const HOST = getServerHost();
const DEFAULT_PORT = getServerPort();
const FALLBACK_PORT = getFallbackPort();
const hasExplicitPort = hasEnvValue('PORT');

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
  try {
    await ensureDatabaseConnection();
  } catch (error) {
    if (!isDevelopmentEnv()) {
      throw error;
    }

    log('startup', 'Database unavailable. Starting development server in degraded mode.', {
      message: error instanceof Error ? error.message : 'Unknown database connection error',
    });
  }

  await configureFrontend(app);

  const server = createHttpServer();
  server.listen(currentPort, HOST, () => {
    const address = server.address();
    log('startup', 'Backend server is listening.', {
      host: typeof address === 'object' && address ? address.address : HOST,
      port: typeof address === 'object' && address ? address.port : currentPort,
      nodeEnv: getNodeEnv(),
      pid: process.pid,
    });

    const databaseStatus = getDatabaseStatus();

    if (!databaseStatus.connected) {
      log('startup', 'API routes will return 503 until MongoDB is configured.', {
        message: databaseStatus.error?.message || 'Database unavailable',
      });
    }
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
