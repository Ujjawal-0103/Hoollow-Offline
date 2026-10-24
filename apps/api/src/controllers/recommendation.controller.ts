import { Request, Response, NextFunction } from 'express';
import { recommendationService } from '../services/recommendation.service';

function extractParamId(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0];
  return param ?? '';
}

export class RecommendationController {
  public async getRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lessonId = extractParamId(req.params.id);
      const recommendations = await recommendationService.getRecommendationsForLesson(lessonId);

      res.status(200).json({
        success: true,
        data: recommendations,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const recommendationController = new RecommendationController();
