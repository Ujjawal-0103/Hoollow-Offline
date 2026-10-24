import { Request, Response, NextFunction } from 'express';
import { createLearnerSchema, updatePreferencesSchema } from '../validators/learner.schema';
import { learnerService, LearnerNotFoundError } from '../services/learner.service';

function extractParamId(param: string | string[] | undefined): string | null {
  if (typeof param === 'string' && param.trim().length > 0) {
    return param.trim();
  }
  if (Array.isArray(param) && param.length > 0 && typeof param[0] === 'string' && param[0].trim().length > 0) {
    return param[0].trim();
  }
  return null;
}

export class LearnerController {
  /**
   * POST /api/learners
   * Creates a learner profile.
   */
  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = createLearnerSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed for learner creation',
            statusCode: 400,
            details: parseResult.error.format(),
          },
        });
        return;
      }

      const learner = await learnerService.create(parseResult.data);
      res.status(201).json({
        success: true,
        data: learner,
        learner,
      });
    } catch (err: unknown) {
      next(err);
    }
  };

  /**
   * GET /api/learners/:id
   * Retrieves a learner profile by ID.
   */
  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = extractParamId(req.params.id);
      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Learner ID parameter is required',
            statusCode: 400,
          },
        });
        return;
      }

      const learner = await learnerService.findById(id);
      if (!learner) {
        res.status(404).json({
          success: false,
          error: {
            message: `Learner with ID "${id}" was not found`,
            statusCode: 404,
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: learner,
        learner,
      });
    } catch (err: unknown) {
      next(err);
    }
  };

  /**
   * PATCH /api/learners/:id/preferences
   * Updates learning preferences for a learner.
   */
  public updatePreferences = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = extractParamId(req.params.id);
      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Learner ID parameter is required',
            statusCode: 400,
          },
        });
        return;
      }

      const parseResult = updatePreferencesSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed for preferences update',
            statusCode: 400,
            details: parseResult.error.format(),
          },
        });
        return;
      }

      const updated = await learnerService.updatePreferences(id, parseResult.data);
      res.status(200).json({
        success: true,
        data: updated,
        learner: updated,
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

export const learnerController = new LearnerController();
