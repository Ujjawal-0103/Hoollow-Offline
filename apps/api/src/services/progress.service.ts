import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../lib/prisma';
import { LearnerNotFoundError } from './learner.service';

export interface RoadmapProgressSummary {
  roadmapId: string;
  title: string;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
}

export interface LearnerProgressSummary {
  learnerId: string;
  totalRoadmaps: number;
  totalLessons: number;
  completedLessons: number;
  remainingLessons: number;
  progressPercent: number;
  roadmaps: RoadmapProgressSummary[];
}

export class ProgressService {
  constructor(private readonly prismaClient?: PrismaClient) {}

  private get client(): PrismaClient {
    return this.prismaClient ?? getPrismaClient();
  }

  /**
   * Computes the overall learning progress for a specific learner across all their roadmaps.
   */
  public async getLearnerProgress(learnerId: string): Promise<LearnerProgressSummary> {
    // 1. Confirm learner exists
    const learner = await this.client.learner.findUnique({
      where: { id: learnerId },
    });

    if (!learner) {
      throw new LearnerNotFoundError(learnerId);
    }

    // 2. Fetch all roadmaps for the learner with milestones and lessons
    const roadmaps = await this.client.roadmap.findMany({
      where: { learnerId },
      include: {
        milestones: {
          include: {
            lessons: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (roadmaps.length === 0) {
      return {
        learnerId,
        totalRoadmaps: 0,
        totalLessons: 0,
        completedLessons: 0,
        remainingLessons: 0,
        progressPercent: 0,
        roadmaps: [],
      };
    }

    // 3. Fetch all completed lesson IDs for this learner
    const completedRecords = await this.client.lessonProgress.findMany({
      where: {
        learnerId,
        completed: true,
      },
      select: {
        lessonId: true,
      },
    });

    const completedLessonIdSet = new Set(completedRecords.map((r) => r.lessonId));

    // 4. Calculate per-roadmap and overall progress
    let overallTotalLessons = 0;
    let overallCompletedLessons = 0;
    const roadmapSummaries: RoadmapProgressSummary[] = [];

    for (const roadmap of roadmaps) {
      const roadmapLessonIds = new Set<string>();

      for (const milestone of roadmap.milestones) {
        for (const lesson of milestone.lessons) {
          roadmapLessonIds.add(lesson.id);
        }
      }

      const totalLessons = roadmapLessonIds.size;
      let completedLessons = 0;

      for (const id of roadmapLessonIds) {
        if (completedLessonIdSet.has(id)) {
          completedLessons++;
        }
      }

      const progressPercent = totalLessons === 0
        ? 0
        : Math.round((completedLessons / totalLessons) * 100);

      overallTotalLessons += totalLessons;
      overallCompletedLessons += completedLessons;

      roadmapSummaries.push({
        roadmapId: roadmap.id,
        title: roadmap.title,
        totalLessons,
        completedLessons,
        progressPercent,
      });
    }

    const overallProgressPercent = overallTotalLessons === 0
      ? 0
      : Math.round((overallCompletedLessons / overallTotalLessons) * 100);

    return {
      learnerId,
      totalRoadmaps: roadmaps.length,
      totalLessons: overallTotalLessons,
      completedLessons: overallCompletedLessons,
      remainingLessons: Math.max(0, overallTotalLessons - overallCompletedLessons),
      progressPercent: overallProgressPercent,
      roadmaps: roadmapSummaries,
    };
  }
}

export const progressService = new ProgressService();
