import { Router } from 'express';

import { InspirationController } from '@/controllers/inspiration.controller';

const router = Router();

// Route to get daily inspiration
router.get('/', InspirationController.getDailyInspiration);

export default router;
