import { Router } from 'express';
import {
	createFlag,
	listFlags,
	getFlagById,
	updateFlagStatus,
} from '@/controllers/flag.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';

const router = Router();

// Public routes
router.post('/', createFlag);

// Protected routes
router.get(
	'/',
	authenticate,
	authorize('flag:handle'),
	listFlags
);

router.get(
	'/:id',
	authenticate,
	authorize('flag:handle'),
	getFlagById
);

router.patch(
	'/:id/status',
	authenticate,
	authorize('flag:handle'),
	updateFlagStatus
);

export default router;
