import { Router } from 'express';
import { learnerController } from '../controllers/learner.controller';
import { roadmapController } from '../controllers/roadmap.controller';
import { progressController } from '../controllers/progress.controller';
import { dailyPlanController } from '../controllers/daily-plan.controller';
import { quizController } from '../controllers/quiz.controller';

const router = Router();

// POST /api/learners - Create learner profile
router.post('/', learnerController.create);

// GET /api/learners/:id - Retrieve learner profile
router.get('/:id', learnerController.getById);

// PATCH /api/learners/:id/preferences - Update learner preferences
router.patch('/:id/preferences', learnerController.updatePreferences);

// GET /api/learners/:id/roadmaps - List all roadmaps for a learner
router.get('/:id/roadmaps', roadmapController.listByLearner);

// GET /api/learners/:id/progress - Overall progress metrics across learner's roadmaps
router.get('/:id/progress', progressController.getProgress);

// GET /api/learners/:id/daily-plan - Deterministic daily learning plan
router.get('/:id/daily-plan', dailyPlanController.getDailyPlan);

// GET /api/learners/:id/quiz-attempts - Learner's quiz attempt history
router.get('/:id/quiz-attempts', quizController.getLearnerAttempts);

// GET /api/learners/:id/quiz-performance - Aggregate quiz statistics and best scores
router.get('/:id/quiz-performance', quizController.getLearnerPerformance);

export const learnerRoutes = router;
