import { z } from 'zod';

export const createSourceSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters long'),
  type: z.enum(['RSS', 'ATOM', 'OFFICIAL_RELEASE', 'DOCS_UPDATE', 'PUBLIC_API'], {
    errorMap: () => ({ message: 'Invalid source type' }),
  }),
  url: z.string().url('Source URL must be a valid HTTP/HTTPS URL'),
  technologies: z.array(z.string().trim().min(1)).min(1, 'At least one technology tag is required'),
  pollingIntervalMinutes: z.number().int().min(15).max(10080).optional().default(360),
  isActive: z.boolean().optional().default(true),
});

export const updateSourceSchema = z.object({
  name: z.string().trim().min(2).optional(),
  url: z.string().url().optional(),
  technologies: z.array(z.string().trim().min(1)).optional(),
  pollingIntervalMinutes: z.number().int().min(15).max(10080).optional(),
  isActive: z.boolean().optional(),
});

export const rejectUpdateSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export type CreateSourceSchema = z.infer<typeof createSourceSchema>;
export type UpdateSourceSchema = z.infer<typeof updateSourceSchema>;
export type RejectUpdateSchema = z.infer<typeof rejectUpdateSchema>;
