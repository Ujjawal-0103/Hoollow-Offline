import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { learnerRoutes } from './learner.routes';
import { roadmapRoutes } from './roadmap.routes';
import { lessonRoutes } from './lesson.routes';
import { quizRoutes } from './quiz.routes';
import { industryRoutes } from './industry.routes';

const router = Router();

// Liveness and readiness probes
router.use('/', healthRoutes);

// Learner profile, preferences, roadmaps, progress, daily plan, quiz attempts, and notifications (/api/learners)
router.use('/learners', learnerRoutes);

// Roadmap generation, retrieval, lessons, and adaptation (/api/roadmaps)
router.use('/roadmaps', roadmapRoutes);

// Lesson retrieval, completion, lesson quizzes, and recommendations (/api/lessons)
router.use('/lessons', lessonRoutes);

// Quiz creation, retrieval, and submission (/api/quizzes)
router.use('/quizzes', quizRoutes);

// Industry monitoring, sources, events, scanning, and status (/api/industry)
router.use('/industry', industryRoutes);

export const apiRouter = router;
