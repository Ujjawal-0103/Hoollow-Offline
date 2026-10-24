import { Request, Response, NextFunction } from 'express';
import { roadmapVersioningService } from '../services/roadmap-versioning.service';
import { roadmapImpactAnalyzerService } from '../services/roadmap-impact-analyzer.service';
import { industryMonitorService } from '../services/industry-monitor.service';
import { rejectUpdateSchema } from '../validators/industry.schema';
import { getPrismaClient } from '../lib/prisma';

function extractParamId(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0];
  return param ?? '';
}

export class RoadmapAdaptationController {
  public async getUpdates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roadmapId = extractParamId(req.params.id);
      const updates = await roadmapVersioningService.getUpdatesForRoadmap(roadmapId);

      res.status(200).json({
        success: true,
        data: updates,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * On-demand adaptation evaluation: matches pending/recent events against this specific roadmap.
   */
  public async adaptRoadmap(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roadmapId = extractParamId(req.params.id);
      const prisma = getPrismaClient();

      const roadmap = await prisma.roadmap.findUnique({
        where: { id: roadmapId },
      });

      if (!roadmap) {
        return next({
          statusCode: 404,
          message: `Roadmap with ID "${roadmapId}" was not found.`,
        });
      }

      // Check all recent events
      const events = await industryMonitorService.getEvents({ limit: 20 });
      const proposalsCreated: any[] = [];

      for (const event of events) {
        const result = await roadmapImpactAnalyzerService.analyzeAndPropagateEvent(event.id);
        const thisRoadmapProposal = result.proposalsCreated.find((p) => p.roadmapId === roadmapId);
        if (thisRoadmapProposal) {
          proposalsCreated.push(thisRoadmapProposal);
        }
      }

      const allUpdates = await roadmapVersioningService.getUpdatesForRoadmap(roadmapId);

      res.status(200).json({
        success: true,
        message: `Adaptation evaluation complete. Generated ${proposalsCreated.length} new update proposals.`,
        data: {
          newProposalsCount: proposalsCreated.length,
          updates: allUpdates,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async approveUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updateId = extractParamId(req.params.updateId);
      const result = await roadmapVersioningService.applyUpdate(updateId);

      res.status(200).json({
        success: true,
        message: 'Roadmap update successfully approved and applied.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public async rejectUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updateId = extractParamId(req.params.updateId);
      const validation = rejectUpdateSchema.safeParse(req.body);
      const reason = validation.success ? validation.data.reason : undefined;

      const update = await roadmapVersioningService.rejectUpdate(updateId, reason);

      res.status(200).json({
        success: true,
        message: 'Roadmap update rejected.',
        data: update,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getVersions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roadmapId = extractParamId(req.params.id);
      const versions = await roadmapVersioningService.getVersionsForRoadmap(roadmapId);

      res.status(200).json({
        success: true,
        data: versions,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getVersionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roadmapId = extractParamId(req.params.id);
      const versionId = extractParamId(req.params.versionId);

      const version = await roadmapVersioningService.getVersionById(roadmapId, versionId);
      if (!version) {
        return next({
          statusCode: 404,
          message: `Roadmap version "${versionId}" was not found.`,
        });
      }

      res.status(200).json({
        success: true,
        data: version,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const roadmapAdaptationController = new RoadmapAdaptationController();
