import { Milestone, Lesson, PrismaClient, Roadmap } from '@prisma/client';
import { getPrismaClient } from '../lib/prisma';
import { CreateRoadmapInput } from '../validators/roadmap.schema';
import { roadmapGeneratorService } from './roadmap-generator.service';
import { LearnerNotFoundError } from './learner.service';

export type MilestoneWithLessons = Milestone & {
  lessons: Lesson[];
};

export type RoadmapWithDetails = Roadmap & {
  milestones: MilestoneWithLessons[];
};

export class RoadmapNotFoundError extends Error {
  public statusCode = 404;
  constructor(id: string) {
    super(`Roadmap with ID "${id}" was not found.`);
    this.name = 'RoadmapNotFoundError';
  }
}

export class RoadmapService {
  constructor(private readonly prismaClient?: PrismaClient) {}

  private get client(): PrismaClient {
    return this.prismaClient ?? getPrismaClient();
  }

  /**
   * Creates and persists a personalized roadmap using a deterministic generator and transaction.
   */
  public async create(input: CreateRoadmapInput): Promise<RoadmapWithDetails> {
    // 1. Verify learner exists
    const learner = await this.client.learner.findUnique({
      where: { id: input.learnerId },
    });

    if (!learner) {
      throw new LearnerNotFoundError(input.learnerId);
    }

    // 2. Generate structured roadmap
    const currentLevel = input.currentLevel || learner.currentLevel;
    const goal = input.goal || learner.learningGoal;
    const minutesPerDay = input.minutesPerDay || learner.minutesPerDay;

    const generated = roadmapGeneratorService.generate(
      input.skill,
      currentLevel,
      goal,
      minutesPerDay
    );

    // 3. Atomically persist roadmap, milestones, and lessons in a transaction
    const roadmap = await this.client.$transaction(async (tx) => {
      const created = await tx.roadmap.create({
        data: {
          learnerId: learner.id,
          title: generated.title,
          skill: generated.skill,
          currentLevel: generated.currentLevel,
          goal: generated.goal,
          estimatedDurationMinutes: generated.estimatedDurationMinutes,
          milestones: {
            create: generated.milestones.map((m) => ({
              title: m.title,
              description: m.description,
              order: m.order,
              estimatedDurationMinutes: m.estimatedDurationMinutes,
              lessons: {
                create: m.lessons.map((l) => ({
                  title: l.title,
                  description: l.description,
                  order: l.order,
                  durationMinutes: l.durationMinutes,
                  learningObjectives: l.learningObjectives,
                  content: l.content,
                  examples: l.examples,
                  keyTakeaways: l.keyTakeaways,
                })),
              },
            })),
          },
        },
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

      return created;
    });

    return roadmap as RoadmapWithDetails;
  }

  /**
   * Retrieves a roadmap by ID with ordered milestones and lessons.
   */
  public async findById(id: string): Promise<RoadmapWithDetails | null> {
    const roadmap = await this.client.roadmap.findUnique({
      where: { id },
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

    return roadmap as RoadmapWithDetails | null;
  }

  /**
   * Lists all roadmaps belonging to a specific learner.
   * Throws LearnerNotFoundError if the learner does not exist.
   */
  public async listByLearnerId(learnerId: string): Promise<RoadmapWithDetails[]> {
    // Verify learner exists first
    const learner = await this.client.learner.findUnique({
      where: { id: learnerId },
    });

    if (!learner) {
      throw new LearnerNotFoundError(learnerId);
    }

    const roadmaps = await this.client.roadmap.findMany({
      where: { learnerId },
      orderBy: { createdAt: 'desc' },
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

    return roadmaps as RoadmapWithDetails[];
  }
}

export const roadmapService = new RoadmapService();
