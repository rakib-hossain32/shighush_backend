import { Router } from 'express';
import userRoutes from './user.routes';
import authRoutes from './auth.routes';
import reportRoutes from './report.routes';
import institutionRoutes from './institution.routes';
import appealRoutes from './appeal.routes';
import flagRoutes from './flag.routes';
import personRoutes from './person.routes';
import adminRoutes from './admin.routes';
import evidenceRoutes from './evidence.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) =>
	res.status(200).json({
		status: 'OK',
		timestamp: new Date().toISOString(),
		service: 'Shighush API',
	}),
);

// Public routes
router.use('/auth', authRoutes);
router.use('/reports', reportRoutes);
router.use('/institutions', institutionRoutes);
router.use('/appeals', appealRoutes);
router.use('/flags', flagRoutes);
router.use('/people', personRoutes);
router.use(evidenceRoutes); // Evidence has its own paths

// Protected routes
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

export default router;
