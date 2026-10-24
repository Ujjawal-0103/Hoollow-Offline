import { Request, Response, NextFunction } from 'express';
import { createRoadmapSchema } from '../validators/roadmap.schema';
import { roadmapService, RoadmapNotFoundError } from '../services/roadmap.service';
import { LearnerNotFoundError } from '../services/learner.service';
import { UnsupportedSkillError } from '../services/roadmap-generator.service';

function extractParamId(param: string | string[] | undefined): string | null {
  if (typeof param === 'string' && param.trim().length > 0) {
    return param.trim();
  }
  if (Array.isArray(param) && param.length > 0 && typeof param[0] === 'string' && param[0].trim().length > 0) {
    return param[0].trim();
  }
  return null;
}

export class RoadmapController {
  /**
   * POST /api/roadmaps
   * Creates a structured learning roadmap for a learner.
   */
  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = createRoadmapSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed for roadmap creation',
            statusCode: 400,
            details: parseResult.error.format(),
          },
        });
        return;
      }

      const roadmap = await roadmapService.create(parseResult.data);
      res.status(201).json({
        success: true,
        data: roadmap,
        roadmap,
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
      if (err instanceof UnsupportedSkillError) {
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
   * GET /api/roadmaps/:id
   * Retrieves a roadmap by ID with ordered milestones and lessons.
   */
  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = extractParamId(req.params.id);
      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Roadmap ID parameter is required',
            statusCode: 400,
          },
        });
        return;
      }

      const roadmap = await roadmapService.findById(id);
      if (!roadmap) {
        res.status(404).json({
          success: false,
          error: {
            message: `Roadmap with ID "${id}" was not found`,
            statusCode: 404,
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: roadmap,
        roadmap,
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
   * GET /api/learners/:id/roadmaps
   * Lists roadmaps belonging to a specific learner.
   */
  public listByLearner = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const roadmaps = await roadmapService.listByLearnerId(id);
      res.status(200).json({
        success: true,
        data: roadmaps,
        roadmaps,
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

export const roadmapController = new RoadmapController();
