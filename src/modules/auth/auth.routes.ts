/**
 * src/modules/auth/auth.routes.ts
 *
 * Express router for /api/v1/auth
 *
 * Route structure:
 *  POST   /register  — public
 *  POST   /login     — public
 *  POST   /refresh   — public
 *  GET    /me        — protected (authenticate)
 *  POST   /logout    — protected (authenticate)
 */

import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.validator';

const router = Router();

// ── Public Routes ────────────────────────────────────────────────────────────

router.post(
  '/register',
  validate(registerSchema),
  (req, res, next) => { void authController.register(req, res, next); },
);

router.post(
  '/login',
  validate(loginSchema),
  (req, res, next) => { void authController.login(req, res, next); },
);

router.post(
  '/refresh',
  validate(refreshTokenSchema),
  (req, res, next) => { void authController.refresh(req, res, next); },
);

// ── Protected Routes ─────────────────────────────────────────────────────────

router.get(
  '/me',
  (req, res, next) => { void authenticate(req, res, next); },
  (req, res, next) => { void authController.me(req, res, next); },
);

router.post(
  '/logout',
  (req, res, next) => { void authenticate(req, res, next); },
  (req, res, next) => { void authController.logout(req, res, next); },
);

export default router;
