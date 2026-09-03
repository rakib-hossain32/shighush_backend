import { Router } from 'express';
import {
	listInstitutions,
	getInstitutionBySlug,
	createInstitution,
	updateInstitution,
	deleteInstitution,
} from '@/controllers/institution.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';

const router = Router();

// Public routes
router.get('/', listInstitutions);
router.get('/:slug', getInstitutionBySlug);

// Protected routes (ADMIN only)
router.post(
	'/',
	authenticate,
	authorize('institution:write'),
	createInstitution
);

router.patch(
	'/:id',
	authenticate,
	authorize('institution:write'),
	updateInstitution
);

router.delete(
	'/:id',
	authenticate,
	authorize('institution:write'),
	deleteInstitution
);

export default router;
