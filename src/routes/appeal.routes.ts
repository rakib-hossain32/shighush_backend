import { Router } from 'express';
import {
	createAppeal,
	listAppeals,
	getAppealById,
	updateAppealStatus,
} from '@/controllers/appeal.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';

const router = Router();

// Public routes
router.post('/', createAppeal);

// Protected routes
router.get(
	'/',
	authenticate,
	authorize('appeal:handle'),
	listAppeals
);

router.get(
	'/:id',
	authenticate,
	authorize('appeal:handle'),
	getAppealById
);

router.patch(
	'/:id/status',
	authenticate,
	authorize('appeal:handle'),
	updateAppealStatus
);

export default router;
