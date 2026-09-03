import { Router } from 'express';
import {
	createReport,
	listReports,
	getReportByCaseId,
	updateReportStatus,
	redactReport,
} from '@/controllers/report.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';

const router = Router();

// Public routes
router.post('/', createReport);
router.get('/', listReports); // Public gets only published
router.get('/:caseId', getReportByCaseId);

// Protected routes
router.patch(
	'/:id/status',
	authenticate,
	authorize('report:review'),
	updateReportStatus
);

router.patch(
	'/:id/redact',
	authenticate,
	authorize('report:redact'),
	redactReport
);

export default router;
