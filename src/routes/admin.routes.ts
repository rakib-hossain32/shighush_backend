import { Router } from 'express';
import {
	getDashboardStats,
	listUsers,
	createUser,
	updateUserRole,
	listAuditLogs,
} from '@/controllers/admin.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Dashboard stats
router.get('/stats', getDashboardStats);

// User management (ADMIN only)
router.get('/users', authorize('user:read'), listUsers);
router.post('/users', authorize('user:write'), createUser);
router.patch('/users/:id/role', authorize('user:write'), updateUserRole);

// Audit logs (ADMIN only)
router.get('/audit-logs', authorize('audit:read'), listAuditLogs);

export default router;
