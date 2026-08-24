/**
 * src/app.ts
 *
 * Express application factory.
 *
 * This file exports the configured Express app WITHOUT calling app.listen().
 * This separation is intentional:
 *
 *   - server.ts calls app.listen() for local development
 *   - Vercel imports this file directly as a serverless function handler
 *
 * Middleware order matters:
 *   1. Security (Helmet, CORS)
 *   2. Request parsing
 *   3. Rate limiting
 *   4. Logging
 *   5. Routes
 *   6. 404 handler
 *   7. Global error handler
 */

import express, { type Application, type Request, type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env } from './config/env';
import apiRouter from './routes/index';
import { errorMiddleware, notFoundMiddleware } from './middlewares/error.middleware';
import { i18nMiddleware } from './middlewares/i18n.middleware';
import { setupSwagger } from './docs/swagger';

// ─── App Factory ─────────────────────────────────────────────────────────────

function createApp(): Application {
  const app = express();

  // ── 1. Security Headers ─────────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: env.nodeEnv === 'production',
      crossOriginEmbedderPolicy: env.nodeEnv === 'production',
    }),
  );

  // ── 2. CORS ─────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, Postman)
        if (!origin) {
          callback(null, true);
          return;
        }

        if (
          env.cors.origin.includes(origin) ||
          env.cors.origin.includes('*') ||
          (env.nodeEnv === 'development' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
        ) {
          callback(null, true);
        } else {
          callback(new Error(`CORS: Origin "${origin}" not allowed`));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      maxAge: 86400, // 24h preflight cache
    }),
  );

  // ── 3. Body Parsing & Compression ───────────────────────────────────────
  // Limit is 10mb to support base64-encoded media uploads.
  // For large video files, Supabase Storage is recommended instead.
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(compression());

  // ── 4. i18n — must run after body parsing so locale can be read from body ──
  app.use(i18nMiddleware);

  // ── 5. Rate Limiting ────────────────────────────────────────────────────
  const limiter = rateLimit({
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.maxRequests,
    standardHeaders: true, // RateLimit-* headers
    legacyHeaders: false,  // Disable X-RateLimit-* headers
    message: {
      success: false,
      message: 'Too many requests, please try again later',
      error: { code: 'RATE_LIMIT_EXCEEDED' },
    },
    skip: (req: Request) => {
      // Skip rate limiting for health checks and docs
      return req.path === '/api/health' || req.path.startsWith('/api/docs');
    },
  });

  app.use(limiter);

  // ── 5. Logging ──────────────────────────────────────────────────────────
  if (env.nodeEnv === 'development') {
    // Verbose dev logging: method, url, status, response-time
    app.use(morgan('dev'));
  } else {
    // Production: compact combined format (timestamp, method, url, status, size)
    // Never log Authorization headers
    app.use(
      morgan('combined', {
        skip: (_req, res) => res.statusCode < 400,
      }),
    );
  }

  // ── 6. Trust Proxy (for Vercel / reverse proxies) ───────────────────────
  app.set('trust proxy', 1);

  // ── 7. Static Files (Public Demo Client) ─────────────────────────────────
  app.use(express.static('public'));

  // ── 8. Swagger Documentation ─────────────────────────────────────────────
  setupSwagger(app);

  // ── 9. API Routes ────────────────────────────────────────────────────────
  app.use('/api', apiRouter);

  // ── 10. Root & Demo Endpoints ───────────────────────────────────────────
  app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: '3D Blog Backend API',
      demo: '/index.html',
      docs: '/api/docs',
      health: '/api/health',
    });
  });

  // ── 10. 404 Handler ──────────────────────────────────────────────────────
  app.use(notFoundMiddleware);

  // ── 11. Global Error Handler ─────────────────────────────────────────────
  app.use(errorMiddleware);

  return app;
}

const app = createApp();

export default app;
