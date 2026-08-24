/**
 * src/middlewares/validation.middleware.ts
 *
 * Generic Zod validation middleware factory.
 *
 * Now locale-aware: translates Zod error messages using req.locale.
 * Zod schemas use TranslationKeys as their error messages.
 */

import { type Request, type Response, type NextFunction } from 'express';
import { type ZodTypeAny, ZodError } from 'zod';
import { tOrRaw } from '../i18n';
import { t } from '../i18n';
import type { SupportedLocale } from '../types/i18n.types';

type ValidationTarget = 'body' | 'query' | 'params';

interface ZodFieldError {
  field: string;
  message: string;
}

function formatZodErrors(error: ZodError, locale: SupportedLocale): ZodFieldError[] {
  return error.errors.map((issue) => ({
    field: issue.path.join('.') || 'root',
    // Translate if the message is a TranslationKey, otherwise keep as-is
    message: tOrRaw(issue.message, locale),
  }));
}

export function validate(schema: ZodTypeAny, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const locale = req.locale ?? 'en';
      const errors = formatZodErrors(result.error, locale);
      const message = t('validation.failed', locale);

      res.status(422).json({
        success: false,
        message,
        errors,
      });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    req[target] = result.data;
    next();
  };
}
