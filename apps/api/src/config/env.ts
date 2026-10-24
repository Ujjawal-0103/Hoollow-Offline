import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  PORT: z
    .string()
    .default('5000')
    .transform((val, ctx) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'PORT must be a valid positive integer',
        });
        return z.NEVER;
      }
      return parsed;
    }),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  FRONTEND_URL: z
    .string()
    .url('FRONTEND_URL must be a valid URL')
    .default('http://localhost:3000'),
  DATABASE_URL: z
    .string()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : undefined)),
});

export type Env = z.infer<typeof envSchema>;

function loadAndValidateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || 'root'}: ${issue.message}`)
      .join('\n');
    console.error(`Invalid environment configuration:\n${errorDetails}`);
    throw new Error(`Environment validation failed:\n${errorDetails}`);
  }
  return result.data;
}

export const env = loadAndValidateEnv();

/**
 * Validates and returns the DATABASE_URL.
 * Must be called before performing database operations.
 * Throws a descriptive error if DATABASE_URL is not set or invalid.
 */
export function getValidatedDatabaseUrl(): string {
  if (!env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not configured. Please define DATABASE_URL in your .env file to enable database operations.'
    );
  }

  try {
    const url = new URL(env.DATABASE_URL);
    if (!url.protocol.startsWith('postgres')) {
      throw new Error(`DATABASE_URL protocol must be postgresql:// or postgres:// (got ${url.protocol})`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid connection URL format';
    throw new Error(`Invalid DATABASE_URL: ${message}`);
  }

  return env.DATABASE_URL;
}
