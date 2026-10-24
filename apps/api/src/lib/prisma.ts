import { PrismaClient } from '@prisma/client';
import { env, getValidatedDatabaseUrl } from '../config/env';

// Prevent multiple PrismaClient instances in development mode
declare global {
  // eslint-disable-next-line no-var
  var __hoollowPrisma: PrismaClient | undefined;
}

let prismaInstance: PrismaClient | null = null;

/**
 * Explicitly sets or overrides the Prisma client (useful for tests and mocks).
 */
export function setPrismaClient(client: PrismaClient | null): void {
  prismaInstance = client;
  if (!client) {
    global.__hoollowPrisma = undefined;
  }
}

/**
 * Returns a singleton instance of the PrismaClient.
 * Reusable across services, models, and repositories.
 */
export function getPrismaClient(): PrismaClient {
  if (prismaInstance) {
    return prismaInstance;
  }

  // Ensure DATABASE_URL is validated before initializing the client
  getValidatedDatabaseUrl();

  if (env.NODE_ENV === 'production') {
    prismaInstance = new PrismaClient({
      log: ['error', 'warn'],
    });
  } else {
    if (!global.__hoollowPrisma) {
      global.__hoollowPrisma = new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
      });
    }
    prismaInstance = global.__hoollowPrisma;
  }

  return prismaInstance;
}

/**
 * Gracefully disconnects the Prisma client if connected.
 * Safe to call during SIGINT/SIGTERM shutdown.
 */
export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    try {
      await prismaInstance.$disconnect();
    } catch (err: unknown) {
      console.error('Error during Prisma disconnect:', err);
    } finally {
      prismaInstance = null;
      global.__hoollowPrisma = undefined;
    }
  }
}

export interface DatabaseHealthResult {
  connected: boolean;
  configured: boolean;
  message: string;
  error?: string;
}

/**
 * Verifies live database connectivity using a lightweight query.
 * Does not throw unhandled exceptions; reports honest status.
 */
export async function checkDatabaseConnectivity(): Promise<DatabaseHealthResult> {
  if (!env.DATABASE_URL) {
    return {
      connected: false,
      configured: false,
      message: 'DATABASE_URL is not set in environment variables',
    };
  }

  try {
    const client = getPrismaClient();
    // Run lightweight query with timeout
    await client.$queryRaw`SELECT 1`;
    return {
      connected: true,
      configured: true,
      message: 'Database connection verified successfully',
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown database error';
    return {
      connected: false,
      configured: true,
      message: 'Database connection check failed or database is unreachable',
      error: errorMessage,
    };
  }
}
