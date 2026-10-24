import { Router } from 'express';
import { healthController } from '../controllers/health.controller';

const router = Router();

// Liveness probe: GET /api/health
router.get('/health', healthController.getHealth);

// Readiness probe: GET /api/health/ready
router.get('/health/ready', healthController.getReadiness);

export const healthRoutes = router;
