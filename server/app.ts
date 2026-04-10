import { readFile } from 'fs/promises';
import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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


dotenv.config();

// Do NOT call getJwtSecret()/getMongoUri() here at module level —
// a missing env var would throw and permanently crash the Vercel function.

let dbPromise: Promise<void> | null = null;

export const ensureDatabaseConnection = async () => {
  if (!dbPromise) {
    dbPromise = connectDB();
  }

  try {
    await dbPromise;
  } catch (err) {
    // Reset so the next request gets a fresh connection attempt
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

  if (process.env.NODE_ENV?.trim() === 'development') {
    app.use(morgan('dev'));
  }

  app.use(helmet({
    contentSecurityPolicy: false,
  }));

  app.use(cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
    credentials: true,
  }));

  const limiter = rateLimit({
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW as string, 10) || 15) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX as string, 10) || 100,
  });
  app.use('/api', limiter);

  app.get('/health', (req, res) => {
    res.status(200).json({ success: true, status: 'ok', uptime: process.uptime() });
  });

  app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, status: 'ok', uptime: process.uptime() });
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
  app.use('/uploads', express.static(path.join(rootDir, 'uploads')));

  app.use(errorHandler);

  return app;
};

export const configureFrontend = async (app: express.Express) => {
  const rootDir = path.resolve();
  const isProduction = process.env.NODE_ENV?.trim() === 'production';

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
