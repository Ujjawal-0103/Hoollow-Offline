import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { learnerRoutes } from './learner.routes';
import { roadmapRoutes } from './roadmap.routes';
import { lessonRoutes } from './lesson.routes';
import { quizRoutes } from './quiz.routes';

const router = Router();

// Liveness and readiness probes
router.use('/', healthRoutes);

// Learner profile, preferences, roadmaps, progress, daily plan, and quiz attempts (/api/learners)
router.use('/learners', learnerRoutes);

// Roadmap generation, retrieval, and lessons (/api/roadmaps)
router.use('/roadmaps', roadmapRoutes);

// Lesson retrieval, completion, and lesson quizzes (/api/lessons)
router.use('/lessons', lessonRoutes);

// Quiz creation, retrieval, and submission (/api/quizzes)
router.use('/quizzes', quizRoutes);

export const apiRouter = router;
