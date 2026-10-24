import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../lib/prisma';
import { LearnerNotFoundError } from './learner.service';

export interface DailyPlanTask {
  lessonId: string;
  title: string;
  durationMinutes: number;
  order: number;
  status: 'NOT_STARTED';
  milestoneId: string;
  milestoneTitle: string;
  roadmapId: string;
  roadmapTitle: string;
}

export interface DailyPlanResponse {
  learnerId: string;
  date: string;
  availableMinutes: number;
  plannedMinutes: number;
  tasks: DailyPlanTask[];
  nextLessonId: string | null;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'NO_ROADMAPS';
}

export class DailyPlanService {
  constructor(private readonly prismaClient?: PrismaClient) {}

  private get client(): PrismaClient {
    return this.prismaClient ?? getPrismaClient();
  }

  /**
   * Generates a deterministic daily learning plan for a learner based on their roadmaps,
   * sequential milestone/lesson order, and daily minute allocation.
   */
  public async getDailyPlan(learnerId: string): Promise<DailyPlanResponse> {
    // 1. Confirm learner exists
    const learner = await this.client.learner.findUnique({
      where: { id: learnerId },
    });

    if (!learner) {
      throw new LearnerNotFoundError(learnerId);
    }

    const availableMinutes = learner.minutesPerDay;
    const today = new Date().toISOString().slice(0, 10);

    // 2. Fetch roadmaps in deterministic order (earliest created first)
    const roadmaps = await this.client.roadmap.findMany({
      where: { learnerId },
      orderBy: { createdAt: 'asc' },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (roadmaps.length === 0) {
      return {
        learnerId,
        date: today,
        availableMinutes,
        plannedMinutes: 0,
        tasks: [],
        nextLessonId: null,
        status: 'NO_ROADMAPS',
      };
    }

    // 3. Fetch completed lesson IDs for this learner
    const completedRecords = await this.client.lessonProgress.findMany({
      where: {
        learnerId,
        completed: true,
      },
      select: {
        lessonId: true,
      },
    });

    const completedSet = new Set(completedRecords.map((r) => r.lessonId));

    // 4. Collect incomplete lessons in sequential order: Roadmap -> Milestone -> Lesson
    const incompleteLessons: Array<{
      lesson: {
        id: string;
        title: string;
        durationMinutes: number;
      };
      milestone: {
        id: string;
        title: string;
      };
      roadmap: {
        id: string;
        title: string;
      };
    }> = [];

    for (const roadmap of roadmaps) {
      for (const milestone of roadmap.milestones) {
        for (const lesson of milestone.lessons) {
          if (!completedSet.has(lesson.id)) {
            incompleteLessons.push({
              lesson: {
                id: lesson.id,
                title: lesson.title,
                durationMinutes: lesson.durationMinutes,
              },
              milestone: {
                id: milestone.id,
                title: milestone.title,
              },
              roadmap: {
                id: roadmap.id,
                title: roadmap.title,
              },
            });
          }
        }
      }
    }

    if (incompleteLessons.length === 0) {
      return {
        learnerId,
        date: today,
        availableMinutes,
        plannedMinutes: 0,
        tasks: [],
        nextLessonId: null,
        status: 'COMPLETED',
      };
    }

    // 5. Fill daily plan budget deterministically
    const tasks: DailyPlanTask[] = [];
    let plannedMinutes = 0;

    for (let i = 0; i < incompleteLessons.length; i++) {
      const item = incompleteLessons[i];
      const lessonDuration = item.lesson.durationMinutes;

      // Always include the first incomplete lesson even if it exceeds availableMinutes
      if (tasks.length === 0) {
        tasks.push({
          lessonId: item.lesson.id,
          title: item.lesson.title,
          durationMinutes: lessonDuration,
          order: 1,
          status: 'NOT_STARTED',
          milestoneId: item.milestone.id,
          milestoneTitle: item.milestone.title,
          roadmapId: item.roadmap.id,
          roadmapTitle: item.roadmap.title,
        });
        plannedMinutes += lessonDuration;
      } else if (plannedMinutes + lessonDuration <= availableMinutes) {
        tasks.push({
          lessonId: item.lesson.id,
          title: item.lesson.title,
          durationMinutes: lessonDuration,
          order: tasks.length + 1,
          status: 'NOT_STARTED',
          milestoneId: item.milestone.id,
          milestoneTitle: item.milestone.title,
          roadmapId: item.roadmap.id,
          roadmapTitle: item.roadmap.title,
        });
        plannedMinutes += lessonDuration;
      } else {
        // Daily time budget filled
        break;
      }
    }

    const nextLessonId = tasks.length > 0 ? tasks[0].lessonId : null;

    return {
      learnerId,
      date: today,
      availableMinutes,
      plannedMinutes,
      tasks,
      nextLessonId,
      status: 'IN_PROGRESS',
    };
  }
}

export const dailyPlanService = new DailyPlanService();
