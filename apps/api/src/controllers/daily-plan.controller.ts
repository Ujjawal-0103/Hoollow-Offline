import { Request, Response, NextFunction } from 'express';
import { dailyPlanService } from '../services/daily-plan.service';
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

export class DailyPlanController {
  /**
   * GET /api/learners/:id/daily-plan
   * Generates a deterministic daily learning plan for a learner.
   */
  public getDailyPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const dailyPlan = await dailyPlanService.getDailyPlan(learnerId);
      res.status(200).json({
        success: true,
        data: dailyPlan,
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

export const dailyPlanController = new DailyPlanController();
