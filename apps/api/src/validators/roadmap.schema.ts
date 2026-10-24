import { z } from 'zod';
import { LEARNER_LEVELS } from './learner.schema';

export const createRoadmapSchema = z.object({
  learnerId: z
    .string()
    .trim()
    .min(1, 'learnerId is required'),
  skill: z
    .string()
    .trim()
    .min(2, 'skill must be at least 2 characters long')
    .max(100, 'skill must not exceed 100 characters'),
  currentLevel: z
    .enum(LEARNER_LEVELS, {
      errorMap: () => ({
        message: `currentLevel must be one of: ${LEARNER_LEVELS.join(', ')}`,
      }),
    })
    .optional(),
  goal: z
    .string()
    .trim()
    .min(3, 'goal must be at least 3 characters long')
    .max(500, 'goal must not exceed 500 characters')
    .optional(),
  minutesPerDay: z
    .number({ invalid_type_error: 'minutesPerDay must be a positive integer' })
    .int('minutesPerDay must be an integer')
    .min(5, 'minutesPerDay must be at least 5 minutes')
    .max(480, 'minutesPerDay cannot exceed 480 minutes')
    .optional(),
  preferredLanguage: z
    .string()
    .trim()
    .min(1, 'preferredLanguage cannot be empty')
    .max(50, 'Language name is too long')
    .optional(),
});

export type CreateRoadmapInput = z.infer<typeof createRoadmapSchema>;
