import { Request, Response, NextFunction } from 'express';
import { createQuizSchema, submitQuizSchema } from '../validators/quiz.schema';
import { quizService, QuizNotFoundError, InvalidQuizSubmissionError } from '../services/quiz.service';
import { LessonNotFoundError } from '../services/lesson.service';
import { LearnerNotFoundError } from '../services/learner.service';

function extractParamId(param: string | string[] | undefined): string | null {
  if (typeof param === 'string' && param.trim().length > 0) {
    return param.trim();
  }
  if (Array.isArray(param) && param.length > 0 && typeof param[0] === 'string' && param[0].trim().length > 0) {
    return param[0].trim();
  }
  return null;
}

export class QuizController {
  /**
   * POST /api/quizzes
   * Creates a quiz and its questions for an existing lesson.
   */
  public createQuiz = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = createQuizSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed for quiz creation',
            statusCode: 400,
            details: parseResult.error.format(),
          },
        });
        return;
      }

      const quiz = await quizService.createQuiz(parseResult.data);
      res.status(201).json({
        success: true,
        data: quiz,
        quiz,
      });
    } catch (err: unknown) {
      if (err instanceof LessonNotFoundError) {
        res.status(404).json({
          success: false,
          error: {
            message: err.message,
            statusCode: 404,
          },
        });
        return;
      }
      next(err);
    }
  };

  /**
   * GET /api/lessons/:id/quiz
   * Retrieves the quizzes associated with a lesson (stripped of secret answers).
   */
  public getLessonQuizzes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lessonId = extractParamId(req.params.id);
      if (!lessonId) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Lesson ID parameter is required',
            statusCode: 400,
          },
        });
        return;
      }

      const quizzes = await quizService.getQuizzesByLessonId(lessonId);
      res.status(200).json({
        success: true,
        data: quizzes,
        quizzes,
      });
    } catch (err: unknown) {
      if (err instanceof LessonNotFoundError) {
        res.status(404).json({
          success: false,
          error: {
            message: err.message,
            statusCode: 404,
          },
        });
        return;
      }
      next(err);
    }
  };

  /**
   * GET /api/quizzes/:id
   * Retrieves quiz metadata and questions in display order.
   * SECURITY: Correct answers and explanations are omitted.
   */
  public getQuizById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const quizId = extractParamId(req.params.id);
      if (!quizId) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Quiz ID parameter is required',
            statusCode: 400,
          },
        });
        return;
      }

      const quiz = await quizService.getQuizById(quizId);
      res.status(200).json({
        success: true,
        data: quiz,
        quiz,
      });
    } catch (err: unknown) {
      if (err instanceof QuizNotFoundError) {
        res.status(404).json({
          success: false,
          error: {
            message: err.message,
            statusCode: 404,
          },
        });
        return;
      }
      next(err);
    }
  };

  /**
   * POST /api/quizzes/:id/submit
   * Evaluates submitted answers, persists attempt atomically, and returns score + review feedback.
   */
  public submitQuiz = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const quizId = extractParamId(req.params.id);
      if (!quizId) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Quiz ID parameter is required',
            statusCode: 400,
          },
        });
        return;
      }

      const parseResult = submitQuizSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed for quiz submission',
            statusCode: 400,
            details: parseResult.error.format(),
          },
        });
        return;
      }

      const result = await quizService.submitQuiz(
        quizId,
        parseResult.data.learnerId,
        parseResult.data.answers
      );

      res.status(200).json({
        success: true,
        data: result,
        result,
      });
    } catch (err: unknown) {
      if (err instanceof LearnerNotFoundError) {
        res.status(404).json({
          success: false,
          error: {
            message: err.message,
            statusCode: 404,
          },
        });
        return;
      }
      if (err instanceof QuizNotFoundError) {
        res.status(404).json({
          success: false,
          error: {
            message: err.message,
            statusCode: 404,
          },
        });
        return;
      }
      if (err instanceof InvalidQuizSubmissionError) {
        res.status(400).json({
          success: false,
          error: {
            message: err.message,
            statusCode: 400,
          },
        });
        return;
      }
      next(err);
    }
  };

  /**
   * GET /api/learners/:id/quiz-attempts
   * Returns attempt history for a learner ordered newest first.
   */
  public getLearnerAttempts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const learnerId = extractParamId(req.params.id);
      if (!learnerId) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Learner ID parameter is required',
            statusCode: 400,
          },
        });
        return;
      }

      const attempts = await quizService.getLearnerAttempts(learnerId);
      res.status(200).json({
        success: true,
        data: attempts,
        attempts,
      });
    } catch (err: unknown) {
      if (err instanceof LearnerNotFoundError) {
        res.status(404).json({
          success: false,
          error: {
            message: err.message,
            statusCode: 404,
          },
        });
        return;
      }
      next(err);
    }
  };

  /**
   * GET /api/learners/:id/quiz-performance
   * Returns aggregate statistics across all quizzes for a learner.
   */
  public getLearnerPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const learnerId = extractParamId(req.params.id);
      if (!learnerId) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Learner ID parameter is required',
            statusCode: 400,
          },
        });
        return;
      }

      const performance = await quizService.getLearnerPerformance(learnerId);
      res.status(200).json({
        success: true,
        data: performance,
        performance,
      });
    } catch (err: unknown) {
      if (err instanceof LearnerNotFoundError) {
        res.status(404).json({
          success: false,
          error: {
            message: err.message,
            statusCode: 404,
          },
        });
        return;
      }
      next(err);
    }
  };
}

export const quizController = new QuizController();
