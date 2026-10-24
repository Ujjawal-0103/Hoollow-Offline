import { Router } from 'express';
import { quizController } from '../controllers/quiz.controller';

const router = Router();

// POST /api/quizzes - Create a quiz and its questions for a lesson
router.post('/', quizController.createQuiz);

// GET /api/quizzes/:id - Retrieve quiz questions (stripped of secret answers)
router.get('/:id', quizController.getQuizById);

// POST /api/quizzes/:id/submit - Submit answers, calculate score, record attempt
router.post('/:id/submit', quizController.submitQuiz);

export const quizRoutes = router;
