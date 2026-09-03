/**
 * src/modules/news/news.routes.ts
 *
 * Public Express router for News module.
 */

import { Router } from 'express';
import { newsController } from './news.controller';

const router = Router();

// Public routes (No auth required)
router.get('/', newsController.list);
router.get('/:idOrSlug', newsController.getDetail);

export default router;
