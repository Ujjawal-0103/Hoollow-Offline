import { Router } from 'express';
import { roadmapController } from '../controllers/roadmap.controller';
import { lessonController } from '../controllers/lesson.controller';

const router = Router();

// POST /api/roadmaps - Create and persist a new roadmap
router.post('/', roadmapController.create);

// GET /api/roadmaps/:id - Retrieve roadmap with ordered milestones and lessons
router.get('/:id', roadmapController.getById);

// GET /api/roadmaps/:id/lessons - List ordered lessons belonging to a roadmap
router.get('/:id/lessons', lessonController.getRoadmapLessons);

export const roadmapRoutes = router;
