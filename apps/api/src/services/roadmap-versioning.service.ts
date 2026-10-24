import { PrismaClient, RoadmapUpdate, RoadmapVersion } from '@prisma/client';
import { getPrismaClient } from '../lib/prisma';
import { ProposedLessonChange } from './roadmap-impact-analyzer.service';

export class UpdateAlreadyAppliedError extends Error {
  public statusCode = 400;
  constructor(updateId: string) {
    super(`Roadmap update "${updateId}" has already been processed.`);
    this.name = 'UpdateAlreadyAppliedError';
  }
}

export class RoadmapUpdateNotFoundError extends Error {
  public statusCode = 404;
  constructor(updateId: string) {
    super(`Roadmap update "${updateId}" was not found.`);
    this.name = 'RoadmapUpdateNotFoundError';
  }
}

export class RoadmapVersioningService {
  constructor(private readonly prismaClient?: PrismaClient) {}

  private get client(): PrismaClient {
    return this.prismaClient ?? getPrismaClient();
  }

  /**
   * Applies an approved roadmap update atomically, creates a version snapshot,
   * adds/updates lessons, and notifies the affected learner.
   */
  public async applyUpdate(updateId: string): Promise<{
    version: RoadmapVersion;
    update: RoadmapUpdate;
  }> {
    const update = await this.client.roadmapUpdate.findUnique({
      where: { id: updateId },
      include: {
        roadmap: {
          include: {
            milestones: {
              include: { lessons: true },
              orderBy: { order: 'asc' },
            },
          },
        },
        industryEvent: true,
      },
    });

    if (!update) {
      throw new RoadmapUpdateNotFoundError(updateId);
    }

    if (update.approvalStatus === 'APPLIED') {
      throw new UpdateAlreadyAppliedError(updateId);
    }

    const roadmap = update.roadmap;
    const now = new Date();

    // 1. Transactional atomic version creation, roadmap modification, and notification
    const result = await this.client.$transaction(async (tx) => {
      // Create snapshot of current roadmap state
      const currentVersionNumber = roadmap.version || 1;
      const snapshot = {
        roadmapId: roadmap.id,
        title: roadmap.title,
        skill: roadmap.skill,
        version: currentVersionNumber,
        milestones: roadmap.milestones.map((m) => ({
          id: m.id,
          title: m.title,
          order: m.order,
          lessons: m.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            order: l.order,
            durationMinutes: l.durationMinutes,
            learningObjectives: l.learningObjectives,
          })),
        })),
      };

      const versionRecord = await tx.roadmapVersion.create({
        data: {
          roadmapId: roadmap.id,
          versionNumber: currentVersionNumber,
          changeSummary: `Applied industry update: "${update.industryEvent.title}"`,
          changeReason: update.rationale,
          triggeringEventId: update.industryEventId,
          snapshot: snapshot as any,
          publishedAt: now,
        },
      });

      // Apply concrete proposed changes
      const proposedList = (update.proposedChanges as any) as ProposedLessonChange[];
      for (const change of proposedList || []) {
        if (change.action === 'ADD_LESSON') {
          // Identify target milestone (by order or fallback to highest)
          let targetMilestone = roadmap.milestones.find(
            (m) => m.order === change.targetMilestoneOrder
          );
          if (!targetMilestone && roadmap.milestones.length > 0) {
            targetMilestone = roadmap.milestones[roadmap.milestones.length - 1];
          }

          if (targetMilestone) {
            const nextOrder = (targetMilestone.lessons?.length || 0) + 1;

            await tx.lesson.create({
              data: {
                milestoneId: targetMilestone.id,
                title: change.lessonTitle,
                description: change.description,
                order: nextOrder,
                durationMinutes: change.durationMinutes || 30,
                learningObjectives: change.learningObjectives || [],
                content: change.content || 'Content for new lesson',
                examples: change.examples || [],
                keyTakeaways: change.keyTakeaways || [],
              },
            });
          }
        }
      }

      // Increment roadmap version
      await tx.roadmap.update({
        where: { id: roadmap.id },
        data: {
          version: currentVersionNumber + 1,
        },
      });

      // Update proposal status
      const updatedUpdate = await tx.roadmapUpdate.update({
        where: { id: update.id },
        data: {
          approvalStatus: 'APPLIED',
          reviewedAt: now,
          appliedAt: now,
        },
      });

      // Create in-app learner notification
      await tx.notification.create({
        data: {
          learnerId: roadmap.learnerId,
          roadmapUpdateId: update.id,
          title: `Roadmap Updated: ${update.industryEvent.title}`,
          message: `Your learning path for "${roadmap.skill}" was enhanced with recent industry developments.`,
          reason: update.rationale,
          actionUrl: `/roadmaps/${roadmap.id}`,
        },
      });

      return {
        version: versionRecord,
        update: updatedUpdate,
      };
    });

    return result;
  }

  /**
   * Rejects a proposed roadmap update.
   */
  public async rejectUpdate(updateId: string, reason?: string): Promise<RoadmapUpdate> {
    const update = await this.client.roadmapUpdate.findUnique({
      where: { id: updateId },
    });

    if (!update) {
      throw new RoadmapUpdateNotFoundError(updateId);
    }

    if (update.approvalStatus === 'APPLIED') {
      throw new UpdateAlreadyAppliedError(updateId);
    }

    return this.client.roadmapUpdate.update({
      where: { id: updateId },
      data: {
        approvalStatus: 'REJECTED',
        reviewedAt: new Date(),
        rationale: reason ? `${update.rationale}\n\nRejection note: ${reason}` : update.rationale,
      },
    });
  }

  /**
   * Lists all updates proposed or applied to a roadmap.
   */
  public async getUpdatesForRoadmap(roadmapId: string): Promise<any[]> {
    return this.client.roadmapUpdate.findMany({
      where: { roadmapId },
      include: {
        industryEvent: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Lists all historical versions of a roadmap.
   */
  public async getVersionsForRoadmap(roadmapId: string): Promise<RoadmapVersion[]> {
    return this.client.roadmapVersion.findMany({
      where: { roadmapId },
      include: {
        triggeringEvent: true,
      },
      orderBy: { versionNumber: 'desc' },
    });
  }

  /**
   * Retrieves a specific version by ID.
   */
  public async getVersionById(roadmapId: string, versionId: string): Promise<RoadmapVersion | null> {
    return this.client.roadmapVersion.findFirst({
      where: {
        id: versionId,
        roadmapId,
      },
      include: {
        triggeringEvent: true,
      },
    });
  }
}

export const roadmapVersioningService = new RoadmapVersioningService();
