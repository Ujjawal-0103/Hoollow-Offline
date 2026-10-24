import { Router } from 'express';
import { industryController } from '../controllers/industry.controller';

const router = Router();

router.get('/sources', (req, res, next) => industryController.getSources(req, res, next));
router.post('/sources', (req, res, next) => industryController.createSource(req, res, next));
router.patch('/sources/:id', (req, res, next) => industryController.updateSource(req, res, next));
router.post('/scan', (req, res, next) => industryController.triggerScan(req, res, next));
router.get('/events', (req, res, next) => industryController.getEvents(req, res, next));
router.get('/events/:id', (req, res, next) => industryController.getEventById(req, res, next));
router.get('/status', (req, res, next) => industryController.getStatus(req, res, next));

export const industryRoutes = router;
