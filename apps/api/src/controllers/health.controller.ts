import { Request, Response, NextFunction } from 'express';
import { healthService } from '../services/health.service';

export class HealthController {
  /**
   * GET /api/health
   * Liveness probe: verifies the HTTP server is alive and accepting traffic.
   */
  public getHealth = (_req: Request, res: Response): void => {
    const health = healthService.getHealth();
    res.status(200).json(health);
  };

  /**
   * GET /api/health/ready
   * Readiness probe: checks database connectivity and external readiness.
   */
  public getReadiness = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { statusCode, body } = await healthService.getReadiness();
      res.status(statusCode).json(body);
    } catch (err: unknown) {
      next(err);
    }
  };
}

export const healthController = new HealthController();
