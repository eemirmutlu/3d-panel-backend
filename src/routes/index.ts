/**
 * src/routes/index.ts
 *
 * Central route registry.
 *
 * All module routers are registered here and mounted under /api/v1.
 * To add a new module (e.g., posts), import its router and add it below.
 *
 * Convention:
 *   v1Router.use('/posts', postsRouter);
 *   v1Router.use('/comments', commentsRouter);
 */

import { Router, type Request, type Response } from 'express';
import authRouter from '../modules/auth/auth.routes';
import profilesRouter from '../modules/profiles/profiles.routes';
import friendsRouter from '../modules/friends/friends.routes';
import newsRouter from '../modules/news/news.routes';
import adminRouter from '../modules/admin/admin.routes';

// ── v1 Router ────────────────────────────────────────────────────────────────

const v1Router = Router();

v1Router.use('/auth', authRouter);
v1Router.use('/profiles', profilesRouter);
v1Router.use('/friends', friendsRouter);
v1Router.use('/news', newsRouter);
v1Router.use('/admin', adminRouter);

// Register future module routers here:
// v1Router.use('/users', usersRouter);
// v1Router.use('/posts', postsRouter);
// v1Router.use('/comments', commentsRouter);
// v1Router.use('/tags', tagsRouter);
// v1Router.use('/notifications', notificationsRouter);
// v1Router.use('/subscriptions', subscriptionsRouter);
// v1Router.use('/admin', adminRouter);

// ── Root API Router ──────────────────────────────────────────────────────────

const apiRouter = Router();

apiRouter.use('/v1', v1Router);

// ── Health Check ─────────────────────────────────────────────────────────────

apiRouter.get('/health', (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: 'v1',
  });
});

// Future: /api/v2 can be mounted here as:
// apiRouter.use('/v2', v2Router);

export default apiRouter;
