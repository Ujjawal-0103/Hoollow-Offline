import { Router } from 'express';
import { roadmapController } from '../controllers/roadmap.controller';
import { lessonController } from '../controllers/lesson.controller';
import { roadmapAdaptationController } from '../controllers/roadmap-adaptation.controller';

const router = Router();

// POST /api/roadmaps - Create and persist a new roadmap
router.post('/', roadmapController.create);

// GET /api/roadmaps/:id - Retrieve roadmap with ordered milestones and lessons
router.get('/:id', roadmapController.getById);

// GET /api/roadmaps/:id/lessons - List ordered lessons belonging to a roadmap
router.get('/:id/lessons', lessonController.getRoadmapLessons);

// Part 5: Dynamic Roadmaps, Adaptation & Versioning
router.get('/:id/updates', (req, res, next) => roadmapAdaptationController.getUpdates(req, res, next));
router.post('/:id/adapt', (req, res, next) => roadmapAdaptationController.adaptRoadmap(req, res, next));
router.post('/:id/updates/:updateId/approve', (req, res, next) =>
  roadmapAdaptationController.approveUpdate(req, res, next)
);
router.post('/:id/updates/:updateId/reject', (req, res, next) =>
  roadmapAdaptationController.rejectUpdate(req, res, next)
);
router.get('/:id/versions', (req, res, next) => roadmapAdaptationController.getVersions(req, res, next));
router.get('/:id/versions/:versionId', (req, res, next) =>
  roadmapAdaptationController.getVersionById(req, res, next)
);

export const roadmapRoutes = router;
