import { Lesson, LessonProgress, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../lib/prisma';
import { RoadmapNotFoundError } from './roadmap.service';
import { LearnerNotFoundError } from './learner.service';

export class LessonNotFoundError extends Error {
  public statusCode = 404;
  constructor(id: string) {
    super(`Lesson with ID "${id}" was not found.`);
    this.name = 'LessonNotFoundError';
  }
}

export interface LessonWithHierarchy extends Lesson {
  milestone: {
    id: string;
    roadmapId: string;
    title: string;
    order: number;
    estimatedDurationMinutes: number;
  };
  roadmap: {
    id: string;
    title: string;
    skill: string;
  };
}

export interface RoadmapLessonItem {
  id: string;
  milestoneId: string;
  milestoneTitle: string;
  milestoneOrder: number;
  roadmapId: string;
  roadmapTitle: string;
  title: string;
  description: string | null;
  order: number;
  durationMinutes: number;
  learningObjectives: string[];
  content: string;
  examples: string[];
  keyTakeaways: string[];
  completed?: boolean;
  completedAt?: Date | null;
}

export class LessonService {
  constructor(private readonly prismaClient?: PrismaClient) {}

  private get client(): PrismaClient {
    return this.prismaClient ?? getPrismaClient();
  }

  /**
   * Retrieves a single lesson by ID with its parent milestone and roadmap metadata.
   */
  public async getLessonById(id: string): Promise<LessonWithHierarchy> {
    const lesson = await this.client.lesson.findUnique({
      where: { id },
      include: {
        milestone: {
          include: {
            roadmap: {
              select: {
                id: true,
                title: true,
                skill: true,
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new LessonNotFoundError(id);
    }

    return {
      id: lesson.id,
      milestoneId: lesson.milestoneId,
      title: lesson.title,
      description: lesson.description,
      order: lesson.order,
      durationMinutes: lesson.durationMinutes,
      learningObjectives: lesson.learningObjectives,
      content: lesson.content,
      examples: lesson.examples,
      keyTakeaways: lesson.keyTakeaways,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
      milestone: {
        id: lesson.milestone.id,
        roadmapId: lesson.milestone.roadmapId,
        title: lesson.milestone.title,
        order: lesson.milestone.order,
        estimatedDurationMinutes: lesson.milestone.estimatedDurationMinutes,
      },
      roadmap: lesson.milestone.roadmap,
    };
  }

  /**
   * Lists ordered lessons belonging to a roadmap.
   * If a valid learnerId is provided, includes learner-specific completion information.
   */
  public async getRoadmapLessons(
    roadmapId: string,
    learnerId?: string
  ): Promise<RoadmapLessonItem[]> {
    // 1. Validate roadmap exists
    const roadmap = await this.client.roadmap.findUnique({
      where: { id: roadmapId },
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

    if (!roadmap) {
      throw new RoadmapNotFoundError(roadmapId);
    }

    // 2. Fetch completion status if learnerId is provided and exists
    const completionMap = new Map<string, { completed: boolean; completedAt: Date | null }>();
    if (learnerId) {
      const learner = await this.client.learner.findUnique({
        where: { id: learnerId },
      });

      if (learner) {
        const progressRecords = await this.client.lessonProgress.findMany({
          where: {
            learnerId,
            lesson: {
              milestone: {
                roadmapId,
              },
            },
          },
        });

        for (const p of progressRecords) {
          completionMap.set(p.lessonId, {
            completed: p.completed,
            completedAt: p.completedAt,
          });
        }
      }
    }

    // 3. Assemble ordered lessons
    const result: RoadmapLessonItem[] = [];

    for (const milestone of roadmap.milestones) {
      for (const lesson of milestone.lessons) {
        const item: RoadmapLessonItem = {
          id: lesson.id,
          milestoneId: milestone.id,
          milestoneTitle: milestone.title,
          milestoneOrder: milestone.order,
          roadmapId: roadmap.id,
          roadmapTitle: roadmap.title,
          title: lesson.title,
          description: lesson.description,
          order: lesson.order,
          durationMinutes: lesson.durationMinutes,
          learningObjectives: lesson.learningObjectives,
          content: lesson.content,
          examples: lesson.examples,
          keyTakeaways: lesson.keyTakeaways,
        };

        if (learnerId) {
          const progress = completionMap.get(lesson.id);
          item.completed = progress ? progress.completed : false;
          item.completedAt = progress ? progress.completedAt : null;
        }

        result.push(item);
      }
    }

    return result;
  }

  /**
   * Idempotently marks a lesson as completed for a given learner.
   * Throws 404 if learner or lesson does not exist.
   */
  public async completeLesson(
    lessonId: string,
    learnerId: string
  ): Promise<LessonProgress> {
    // 1. Confirm learner exists
    const learner = await this.client.learner.findUnique({
      where: { id: learnerId },
    });

    if (!learner) {
      throw new LearnerNotFoundError(learnerId);
    }

    // 2. Confirm lesson exists
    const lesson = await this.client.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new LessonNotFoundError(lessonId);
    }

    // 3. Check for existing progress record (idempotency)
    const existing = await this.client.lessonProgress.findUnique({
      where: {
        learnerId_lessonId: {
          learnerId,
          lessonId,
        },
      },
    });

    if (existing) {
      if (existing.completed) {
        return existing;
      }
      return await this.client.lessonProgress.update({
        where: { id: existing.id },
        data: {
          completed: true,
          completedAt: new Date(),
        },
      });
    }

    // 4. Create new completion record
    return await this.client.lessonProgress.create({
      data: {
        learnerId,
        lessonId,
        completed: true,
        completedAt: new Date(),
      },
    });
  }
}

export const lessonService = new LessonService();
