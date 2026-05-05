import { createApp, ensureDatabaseConnection, getDatabaseStatus } from '../server/app.ts';
import { getNodeEnv } from '../server/utils/env.ts';

let appInstance: ReturnType<typeof createApp> | null = null;

export default async function handler(req: any, res: any) {
  const requestPath = typeof req?.url === 'string' ? req.url : '';
  const isHealthCheck = requestPath === '/api/health' || requestPath === '/health';

  if (isHealthCheck) {
    try {
      await ensureDatabaseConnection();
    } catch {
      // Health responses should reflect the latest database status instead of masking failures.
    }

    const databaseStatus = getDatabaseStatus();
    const isHealthy = databaseStatus.connected;

    return res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      status: isHealthy ? 'ok' : 'degraded',
      uptime: process.uptime(),
      env: getNodeEnv(),
      database: isHealthy ? 'connected' : 'unavailable',
      ...(!isHealthy && getNodeEnv() === 'development' && databaseStatus.error
        ? { databaseMessage: databaseStatus.error.message }
        : {}),
    });
  }

  try {
    if (!appInstance) {
      appInstance = createApp();
    }

    await ensureDatabaseConnection();
    return appInstance(req, res);
  } catch (error) {
    // Reset cached instances so subsequent requests can retry fresh
    appInstance = null;

    console.error('[api:index] Request failed.', {
      url: requestPath,
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    if (res.headersSent) {
      return;
    }

    return res.status(500).json({
      success: false,
      error: 'Service temporarily unavailable. Please try again.',
    });
  }
}
