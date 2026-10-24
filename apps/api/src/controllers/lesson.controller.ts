import { Request, Response, NextFunction } from 'express';
import { lessonService, LessonNotFoundError } from '../services/lesson.service';
import { completeLessonSchema } from '../validators/lesson-progress.schema';
import { LearnerNotFoundError } from '../services/learner.service';
import { RoadmapNotFoundError } from '../services/roadmap.service';

function extractParamId(param: string | string[] | undefined): string | null {
  if (typeof param === 'string' && param.trim().length > 0) {
    return param.trim();
  }
  if (Array.isArray(param) && param.length > 0 && typeof param[0] === 'string' && param[0].trim().length > 0) {
    return param[0].trim();
  }
  return null;
}

export class LessonController {
  /**
   * GET /api/lessons/:id
   * Retrieves single lesson content with milestone and roadmap metadata.
   */
  public getLessonById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = extractParamId(req.params.id);
      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Lesson ID parameter is required',
            statusCode: 400,
          },
        });
        return;
      }

      const lesson = await lessonService.getLessonById(id);
      res.status(200).json({
        success: true,
        data: lesson,
        lesson,
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
   * GET /api/roadmaps/:id/lessons
   * Lists ordered lessons belonging to a roadmap, optionally with learner-specific completion status.
   */
  public getRoadmapLessons = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roadmapId = extractParamId(req.params.id);
      if (!roadmapId) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Roadmap ID parameter is required',
            statusCode: 400,
          },
        });
        return;
      }

      const learnerId = typeof req.query.learnerId === 'string' && req.query.learnerId.trim().length > 0
        ? req.query.learnerId.trim()
        : undefined;

      const lessons = await lessonService.getRoadmapLessons(roadmapId, learnerId);
      res.status(200).json({
        success: true,
        data: lessons,
        lessons,
      });
    } catch (err: unknown) {
      if (err instanceof RoadmapNotFoundError) {
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
   * POST /api/lessons/:id/complete
   * Idempotently marks a lesson as completed for a given learner.
   */
  public completeLesson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const parseResult = completeLessonSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed for lesson completion',
            statusCode: 400,
            details: parseResult.error.format(),
          },
        });
        return;
      }

      const progress = await lessonService.completeLesson(lessonId, parseResult.data.learnerId);
      res.status(200).json({
        success: true,
        data: progress,
        progress,
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
}

export const lessonController = new LessonController();
