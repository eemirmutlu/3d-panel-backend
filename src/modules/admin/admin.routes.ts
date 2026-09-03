/**
 * src/modules/admin/admin.routes.ts
 *
 * Dedicated Express router for CRM Admin operations.
 * ALL routes are strictly guarded with `authenticate` + `requireAdmin`.
 */

import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware';

const router = Router();

// Apply strict authentication and admin authorization to ALL admin routes
router.use(authenticate, requireAdmin);

// User Management (CRM)
router.get('/users', adminController.listUsers);
router.patch('/users/:userId', adminController.updateUser);

// News / Announcements Management (CRM)
router.get('/news', adminController.listAllNews);
router.post('/news', adminController.createNews);
router.put('/news/:id', adminController.updateNews);
router.patch('/news/:id', adminController.updateNews);
router.delete('/news/:id', adminController.deleteNews);

// Upload Media (CRM File Upload)
router.post('/upload', adminController.uploadMedia);

export default router;
