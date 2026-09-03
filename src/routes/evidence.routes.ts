import { Router } from 'express';
import {
	uploadEvidence,
	listEvidence,
	verifyEvidence,
	deleteEvidence,
} from '@/controllers/evidence.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { upload } from '@/middlewares/upload.middleware';

const router = Router();

// Public routes
router.post('/reports/:reportId/evidence', upload.single('file'), uploadEvidence);
router.get('/reports/:reportId/evidence', listEvidence);

// Protected routes
router.patch(
	'/evidence/:id/verify',
	authenticate,
	authorize('report:review'),
	verifyEvidence
);

router.delete(
	'/evidence/:id',
	authenticate,
	authorize('report:remove'),
	deleteEvidence
);

export default router;
