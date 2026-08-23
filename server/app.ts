import { readFile } from 'fs/promises';
import path from 'path';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import connectDB from './config/db.ts';
import errorHandler from './middleware/errorMiddleware.ts';
import authRoutes from './routes/authRoutes.ts';
import userRoutes from './routes/userRoutes.ts';
import eventRoutes from './routes/eventRoutes.ts';
import bookingRoutes from './routes/bookingRoutes.ts';
import uploadRoutes from './routes/uploadRoutes.ts';
import reviewRoutes from './routes/reviewRoutes.ts';
import contactRoutes from './routes/contactRoutes.ts';
import serviceRoutes from './routes/serviceRoutes.ts';
import chatRoutes from './routes/chatRoutes.ts';
import notificationRoutes from './routes/notificationRoutes.ts';
import adminRoutes from './routes/adminRoutes.ts';
import plannerRoutes from './routes/plannerRoutes.ts';
import telemetryRoutes from './routes/telemetryRoutes.ts';
import {
  getCorsOrigins,
  getRateLimitConfig,
  isDevelopmentEnv,
  isProductionEnv,
} from './utils/env.ts';

// Do not call getJwtSecret()/getMongoUri() here at module level.
// A missing env var would throw and permanently crash the Vercel function.

let dbPromise: Promise<void> | null = null;
let databaseConnected = false;
let databaseError: Error | null = null;

const normalizeDatabaseError = (error: unknown) => (
  error instanceof Error ? error : new Error('Unknown database connection error')
);

export const getDatabaseStatus = () => ({
  connected: databaseConnected,
  error: databaseError,
});

export const ensureDatabaseConnection = async () => {
  if (databaseConnected) {
    return;
  }

  if (!dbPromise) {
    dbPromise = connectDB()
      .then(() => {
        databaseConnected = true;
        databaseError = null;
      })
      .catch((error) => {
        databaseConnected = false;
        databaseError = normalizeDatabaseError(error);
        throw databaseError;
      });
  }

  try {
    await dbPromise;
  } catch (err) {
    dbPromise = null;
    throw err;
  }
};

const log = (scope: string, message: string, details?: Record<string, unknown>) => {
  if (details) {
    console.log(`[server:${scope}] ${message}`, details);
    return;
  }

  console.log(`[server:${scope}] ${message}`);
};

export const createApp = () => {
  const app = express();
  const rootDir = path.resolve();
  const apiLimiter = rateLimit({
    ...getRateLimitConfig(),
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => ['GET', 'HEAD', 'OPTIONS'].includes(req.method),
  });
  const getHealthPayload = () => {
    const dbStatus = getDatabaseStatus();

    return {
      success: true,
      status: 'ok',
      uptime: process.uptime(),
      database: dbStatus.connected ? 'connected' : 'unavailable',
      ...(dbStatus.error && isDevelopmentEnv() ? { databaseMessage: dbStatus.error.message } : {}),
    };
  };

  app.set('trust proxy', 1);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    const startedAt = Date.now();

    res.on('finish', () => {
      log('request', `${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - startedAt}ms)`);
    });

    next();
  });

  if (isDevelopmentEnv()) {
    app.use(morgan('dev'));
  }

  app.use(helmet({
    contentSecurityPolicy: false,
  }));

  app.use(cors({
    origin: getCorsOrigins(),
    credentials: true,
  }));

  // Prevent MongoDB operator injection in request bodies, queries, and params
  app.use(mongoSanitize());

  app.use('/api', apiLimiter);

  app.get('/health', (req, res) => {
    res.status(200).json(getHealthPayload());
  });

  app.get('/api/health', (req, res) => {
    res.status(200).json(getHealthPayload());
  });

  app.use('/api', (req, res, next) => {
    const dbStatus = getDatabaseStatus();

    if (dbStatus.connected) {
      next();
      return;
    }

    res.status(503).json({
      success: false,
      error: isDevelopmentEnv()
        ? `Database unavailable. ${dbStatus.error?.message || 'Set MONGO_URI in your .env and restart the server.'}`
        : 'Service temporarily unavailable. Please try again later.',
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/services', serviceRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/contact', contactRoutes);
  app.use('/api/chats', chatRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/planner', plannerRoutes);
  app.use('/api/telemetry', telemetryRoutes);
  app.use('/uploads', express.static(path.join(rootDir, 'uploads')));

  app.use(errorHandler);

  return app;
};

export const configureFrontend = async (app: express.Express) => {
  const rootDir = path.resolve();
  const isProduction = isProductionEnv();

  if (isProduction) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get(/^(?!\/api(?:\/|$)).*/, (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    log('startup', 'Serving built frontend assets from dist.');
    return;
  }

  const { createServer: createViteServer } = await import('vite');
  const indexHtmlPath = path.join(rootDir, 'index.html');
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
    },
    appType: 'spa',
  });

  log('startup', 'Serving frontend through Vite middleware in development.');
  app.use(vite.middlewares);
  app.get(/^(?!\/api(?:\/|$)|\/uploads(?:\/|$)).*/, async (req, res, next) => {
    try {
      const template = await readFile(indexHtmlPath, 'utf8');
      const html = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (error) {
      next(error);
    }
  });
};
