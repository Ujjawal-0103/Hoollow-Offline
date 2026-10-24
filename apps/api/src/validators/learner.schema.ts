import { z } from 'zod';

export const LEARNER_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;
export type LearnerLevel = (typeof LEARNER_LEVELS)[number];

export const createLearnerSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, 'Display name cannot be empty')
    .max(100, 'Display name must not exceed 100 characters')
    .optional(),
  preferredLanguage: z
    .string()
    .trim()
    .min(1, 'Preferred language is required')
    .max(50, 'Language name is too long')
    .default('English'),
  currentLevel: z.enum(LEARNER_LEVELS, {
    errorMap: () => ({
      message: `currentLevel must be one of: ${LEARNER_LEVELS.join(', ')}`,
    }),
  }),
  learningGoal: z
    .string()
    .trim()
    .min(3, 'learningGoal must be at least 3 characters long')
    .max(500, 'learningGoal must not exceed 500 characters'),
  minutesPerDay: z
    .number({ invalid_type_error: 'minutesPerDay must be a positive integer' })
    .int('minutesPerDay must be an integer')
    .min(5, 'minutesPerDay must be at least 5 minutes')
    .max(480, 'minutesPerDay cannot exceed 480 minutes (8 hours)')
    .default(30),
});

export type CreateLearnerInput = z.infer<typeof createLearnerSchema>;

export const updatePreferencesSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1, 'Display name cannot be empty')
      .max(100, 'Display name must not exceed 100 characters')
      .optional(),
    preferredLanguage: z
      .string()
      .trim()
      .min(1, 'Preferred language cannot be empty')
      .max(50, 'Language name is too long')
      .optional(),
    currentLevel: z.enum(LEARNER_LEVELS, {
      errorMap: () => ({
        message: `currentLevel must be one of: ${LEARNER_LEVELS.join(', ')}`,
      }),
    }).optional(),
    learningGoal: z
      .string()
      .trim()
      .min(3, 'learningGoal must be at least 3 characters long')
      .max(500, 'learningGoal must not exceed 500 characters')
      .optional(),
    minutesPerDay: z
      .number({ invalid_type_error: 'minutesPerDay must be a positive integer' })
      .int('minutesPerDay must be an integer')
      .min(5, 'minutesPerDay must be at least 5 minutes')
      .max(480, 'minutesPerDay cannot exceed 480 minutes')
      .optional(),
  })
  .strict('Unrecognized fields are not allowed in preferences update')
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: 'At least one preference field must be provided for update',
    }
  );

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
