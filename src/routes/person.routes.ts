import { Router } from 'express';
import {
	listPeople,
	getPersonBySlug,
	createPerson,
	updatePersonVisibility,
} from '@/controllers/person.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';

const router = Router();

// Public routes
router.get('/', listPeople);
router.get('/:slug', getPersonBySlug);

// Protected routes (ADMIN only)
router.post(
	'/',
	authenticate,
	authorize('person:write'),
	createPerson
);

router.patch(
	'/:id/visibility',
	authenticate,
	authorize('person:write'),
	updatePersonVisibility
);

export default router;
