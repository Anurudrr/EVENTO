import { createApp, ensureDatabaseConnection } from '../server/app.ts';

let appInstance: ReturnType<typeof createApp> | null = null;

export default async function handler(req: any, res: any) {
  const requestPath = typeof req?.url === 'string' ? req.url : '';
  const isHealthCheck = requestPath === '/api/health' || requestPath === '/health';

  if (isHealthCheck) {
    return res.status(200).json({
      success: true,
      status: 'ok',
      uptime: process.uptime(),
      env: process.env.NODE_ENV?.trim() || 'unknown',
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
