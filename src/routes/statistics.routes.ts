import { Router } from 'express';
import { getStatistics } from '@/controllers/statistics.controller';

const router = Router();

// Public route - get statistics overview
router.get('/', getStatistics);

export default router;
