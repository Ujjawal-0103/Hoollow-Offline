import { z } from 'zod';

export const createQuizQuestionSchema = z
  .object({
    question: z
      .string()
      .trim()
      .min(3, 'Question text must be at least 3 characters long'),
    options: z
      .array(z.string().trim().min(1, 'Option text cannot be empty'))
      .length(4, 'Every question must have exactly four answer options')
      .refine(
        (opts) => new Set(opts).size === 4,
        {
          message: 'All four answer options must be distinct',
        }
      ),
    correctAnswer: z
      .string()
      .trim()
      .min(1, 'correctAnswer is required'),
    explanation: z
      .string()
      .trim()
      .min(3, 'Explanation must be at least 3 characters long'),
    order: z
      .number({ invalid_type_error: 'order must be a positive integer' })
      .int('order must be an integer')
      .min(1, 'order must be at least 1'),
  })
  .refine(
    (data) => data.options.includes(data.correctAnswer),
    {
      message: 'correctAnswer must match one of the four provided options',
      path: ['correctAnswer'],
    }
  );

export const createQuizSchema = z.object({
  lessonId: z
    .string()
    .trim()
    .min(1, 'lessonId is required'),
  title: z
    .string()
    .trim()
    .min(2, 'title must be at least 2 characters long')
    .max(200, 'title must not exceed 200 characters'),
  description: z
    .string()
    .trim()
    .max(1000, 'description must not exceed 1000 characters')
    .optional(),
  questions: z
    .array(createQuizQuestionSchema)
    .min(1, 'A quiz must contain at least one question')
    .max(50, 'A quiz cannot exceed 50 questions')
    .refine(
      (questions) => {
        const orders = questions.map((q) => q.order);
        return new Set(orders).size === orders.length;
      },
      {
        message: 'Question display orders must be unique within the quiz',
      }
    ),
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type CreateQuizQuestionInput = z.infer<typeof createQuizQuestionSchema>;

// Standardized single answer submission item
export const submittedAnswerItemSchema = z.object({
  questionId: z.string().trim().min(1, 'questionId cannot be empty'),
  selectedAnswer: z.string().trim().min(1, 'selectedAnswer cannot be empty'),
});

export type SubmittedAnswerItem = z.infer<typeof submittedAnswerItemSchema>;

export const submitQuizSchema = z
  .object({
    learnerId: z
      .string()
      .trim()
      .min(1, 'learnerId is required'),
    // Accept either array of items or record/dictionary of questionId -> answer
    answers: z
      .union([
        z.array(submittedAnswerItemSchema).min(1, 'At least one answer must be submitted'),
        z.record(z.string(), z.string()).refine(
          (dict) => Object.keys(dict).length > 0,
          { message: 'At least one answer must be submitted' }
        ),
      ])
      .transform((val): SubmittedAnswerItem[] => {
        if (Array.isArray(val)) {
          return val;
        }
        return Object.entries(val).map(([questionId, selectedAnswer]) => ({
          questionId: questionId.trim(),
          selectedAnswer: selectedAnswer.trim(),
        }));
      })
      .refine(
        (items) => {
          const ids = items.map((i) => i.questionId);
          return new Set(ids).size === ids.length;
        },
        {
          message: 'Duplicate question answers are not allowed in the same submission',
        }
      ),
  })
  .strict('Unrecognized fields such as score or correctness are not permitted in submission');

export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
