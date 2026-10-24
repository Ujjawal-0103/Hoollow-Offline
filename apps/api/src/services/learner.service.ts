import { Learner, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../lib/prisma';
import { CreateLearnerInput, UpdatePreferencesInput } from '../validators/learner.schema';

export class LearnerNotFoundError extends Error {
  public statusCode = 404;
  constructor(id: string) {
    super(`Learner with ID "${id}" was not found.`);
    this.name = 'LearnerNotFoundError';
  }
}

export class LearnerService {
  constructor(private readonly prismaClient?: PrismaClient) {}

  private get client(): PrismaClient {
    return this.prismaClient ?? getPrismaClient();
  }

  /**
   * Creates a new learner profile.
   */
  public async create(input: CreateLearnerInput): Promise<Learner> {
    const learner = await this.client.learner.create({
      data: {
        displayName: input.displayName,
        preferredLanguage: input.preferredLanguage,
        currentLevel: input.currentLevel,
        learningGoal: input.learningGoal,
        minutesPerDay: input.minutesPerDay,
      },
    });

    return learner;
  }

  /**
   * Retrieves a learner by unique ID.
   */
  public async findById(id: string): Promise<Learner | null> {
    const learner = await this.client.learner.findUnique({
      where: { id },
    });

    return learner;
  }

  /**
   * Updates learning preferences for a learner.
   * Throws LearnerNotFoundError if learner does not exist.
   */
  public async updatePreferences(
    id: string,
    updates: UpdatePreferencesInput
  ): Promise<Learner> {
    const existing = await this.client.learner.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new LearnerNotFoundError(id);
    }

    const updated = await this.client.learner.update({
      where: { id },
      data: {
        ...(updates.displayName !== undefined ? { displayName: updates.displayName } : {}),
        ...(updates.preferredLanguage !== undefined ? { preferredLanguage: updates.preferredLanguage } : {}),
        ...(updates.currentLevel !== undefined ? { currentLevel: updates.currentLevel } : {}),
        ...(updates.learningGoal !== undefined ? { learningGoal: updates.learningGoal } : {}),
        ...(updates.minutesPerDay !== undefined ? { minutesPerDay: updates.minutesPerDay } : {}),
      },
    });

    return updated;
  }
}

export const learnerService = new LearnerService();
