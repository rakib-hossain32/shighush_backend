import { Router } from 'express';
import {
	createReport,
	listReports,
	getReportByCaseId,
	getReportById,
	updateReportStatus,
	redactReport,
} from '@/controllers/report.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';

const router = Router();

// Public routes
router.post('/', createReport);
router.get('/', listReports); // Public gets only published
router.get('/case/:caseId', getReportByCaseId); // By case ID (শি-০০১)
router.get('/:id', getReportById); // By MongoDB ID

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
