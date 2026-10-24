import { Router } from 'express';
import { lessonController } from '../controllers/lesson.controller';
import { quizController } from '../controllers/quiz.controller';
import { recommendationController } from '../controllers/recommendation.controller';

const router = Router();

// GET /api/lessons/:id - Retrieve single lesson content
router.get('/:id', lessonController.getLessonById);

// POST /api/lessons/:id/complete - Idempotently mark lesson as completed
router.post('/:id/complete', lessonController.completeLesson);

// GET /api/lessons/:id/quiz - Retrieve quizzes associated with a lesson
router.get('/:id/quiz', quizController.getLessonQuizzes);

// Part 5: GET /api/lessons/:id/recommendations - Video and learning recommendations
router.get('/:id/recommendations', (req, res, next) =>
  recommendationController.getRecommendations(req, res, next)
);

export const lessonRoutes = router;
