import { Request, Response, NextFunction } from 'express';
import { industryMonitorService } from '../services/industry-monitor.service';
import { createSourceSchema, updateSourceSchema } from '../validators/industry.schema';
import { env } from '../config/env';

function extractParamId(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0];
  return param ?? '';
}

function verifyAdminAccess(req: Request, next: NextFunction): boolean {
  if (!env.ADMIN_API_KEY) {
    // Development mode: permit when ADMIN_API_KEY is not configured
    return true;
  }

  const clientKey = req.headers['x-admin-key'] || req.headers['authorization']?.replace(/^Bearer\s+/i, '');
  if (clientKey !== env.ADMIN_API_KEY) {
    next({
      statusCode: 403,
      message: 'Administrative authorization required for this endpoint.',
    });
    return false;
  }
  return true;
}

export class IndustryController {
  public async getSources(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sources = await industryMonitorService.getSources();
      res.status(200).json({
        success: true,
        data: sources,
      });
    } catch (err) {
      next(err);
    }
  }

  public async createSource(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!verifyAdminAccess(req, next)) return;

    try {
      const validation = createSourceSchema.safeParse(req.body);
      if (!validation.success) {
        return next({
          statusCode: 400,
          message: 'Validation failed for source creation',
          details: validation.error.format(),
        });
      }

      const source = await industryMonitorService.createSource(validation.data);
      res.status(201).json({
        success: true,
        data: source,
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateSource(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!verifyAdminAccess(req, next)) return;

    try {
      const sourceId = extractParamId(req.params.id);
      const validation = updateSourceSchema.safeParse(req.body);
      if (!validation.success) {
        return next({
          statusCode: 400,
          message: 'Validation failed for source update',
          details: validation.error.format(),
        });
      }

      const source = await industryMonitorService.updateSource(sourceId, validation.data);
      res.status(200).json({
        success: true,
        data: source,
      });
    } catch (err) {
      next(err);
    }
  }

  public async triggerScan(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!verifyAdminAccess(req, next)) return;

    try {
      const results = await industryMonitorService.scanAllSources();
      const totalNewEvents = results.reduce((acc, r) => acc + r.newEventsCount, 0);

      res.status(200).json({
        success: true,
        message: `Scan completed across ${results.length} sources. Discovered ${totalNewEvents} new events.`,
        data: {
          results,
          totalNewEvents,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async getEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const skillSlug = typeof req.query.skill === 'string' ? req.query.skill : undefined;
      const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 50;

      const events = await industryMonitorService.getEvents({ status, skillSlug, limit });
      res.status(200).json({
        success: true,
        data: events,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getEventById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = extractParamId(req.params.id);
      const event = await industryMonitorService.getEventById(eventId);

      if (!event) {
        return next({
          statusCode: 404,
          message: `Industry event with ID "${eventId}" was not found.`,
        });
      }

      res.status(200).json({
        success: true,
        data: event,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getStatus(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = await industryMonitorService.getObservabilityStatus();
      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const industryController = new IndustryController();
