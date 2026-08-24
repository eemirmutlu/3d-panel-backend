/**
 * src/modules/auth/auth.controller.ts
 *
 * HTTP layer — uses req.locale for localized success messages.
 */

import { type Request, type Response, type NextFunction } from 'express';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { sendSuccess, sendCreated } from '../../utils/api-response';
import { AuthenticationError } from '../../utils/errors';
import { t } from '../../i18n';
import { isSupportedLocale } from '../../types/i18n.types';
import type { RegisterDto, LoginDto, RefreshTokenDto } from './auth.validator';

const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);

export const authController = {
  /**
   * POST /api/v1/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as RegisterDto;
      const dtoLocale = isSupportedLocale(dto.locale ?? '') ? dto.locale as import('../../types/i18n.types').SupportedLocale : undefined;
      const result = await authService.register(
        { ...dto, locale: dtoLocale },
        req.locale,
      );
      const responseLocale = result.user.locale ?? req.locale;
      sendCreated(res, result, t('auth.register.success', responseLocale));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as LoginDto;
      const dtoLocale = isSupportedLocale(dto.locale ?? '') ? dto.locale as import('../../types/i18n.types').SupportedLocale : undefined;
      const result = await authService.login(
        { ...dto, locale: dtoLocale },
        req.locale,
      );
      const responseLocale = result.user.locale ?? req.locale;
      sendSuccess(res, result, t('auth.login.success', responseLocale));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.slice(7).trim();

      if (!token) {
        throw new AuthenticationError('Access token is required', 'MISSING_TOKEN');
      }

      await authService.logout(token);
      sendSuccess(res, null, t('auth.logout.success', req.locale));
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/auth/me
   */
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required', 'UNAUTHENTICATED');
      }

      const profile = await authService.getMe(req.user.id);
      sendSuccess(res, profile, t('auth.me.success', req.locale));
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/auth/refresh
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as RefreshTokenDto;
      const tokens = await authService.refreshToken(dto);
      sendSuccess(res, tokens, t('auth.refresh.success', req.locale));
    } catch (error) {
      next(error);
    }
  },
};
