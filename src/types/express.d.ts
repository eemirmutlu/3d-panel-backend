/**
 * src/types/express.d.ts
 *
 * Augments Express's Request interface to carry:
 *   - req.user    — authenticated user (set by auth.middleware.ts)
 *   - req.locale  — detected locale (set by i18n.middleware.ts)
 */

import type { AuthenticatedUser } from './auth.types';
import type { SupportedLocale } from './i18n.types';

declare global {
  namespace Express {
    interface Request {
      /**
       * Set by `auth.middleware.ts` after successful token verification.
       * Undefined on unauthenticated routes.
       */
      user?: AuthenticatedUser;

      /**
       * Set by `i18n.middleware.ts` on every request.
       * Defaults to 'en'. Use this to send localized responses.
       */
      locale: SupportedLocale;
    }
  }
}
