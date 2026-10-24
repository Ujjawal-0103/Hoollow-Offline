import { z } from 'zod';

export const completeLessonSchema = z.object({
  learnerId: z
    .string()
    .trim()
    .min(1, 'learnerId is required'),
});

export type CompleteLessonInput = z.infer<typeof completeLessonSchema>;
