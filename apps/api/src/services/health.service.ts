import { checkDatabaseConnectivity, DatabaseHealthResult } from '../lib/prisma';

export interface HealthCheckResponse {
  success: boolean;
  service: string;
  status: string;
  timestamp: string;
}

export interface ReadinessCheckResponse {
  success: boolean;
  service: string;
  status: 'ready' | 'not_ready';
  database: DatabaseHealthResult;
  timestamp: string;
}

export class HealthService {
  /**
   * Basic liveness check to verify HTTP application is running.
   */
  public getHealth(): HealthCheckResponse {
    return {
      success: true,
      service: 'Hoollow Backend',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Deep readiness check to verify external dependencies (e.g., PostgreSQL).
   */
  public async getReadiness(): Promise<{ statusCode: number; body: ReadinessCheckResponse }> {
    const dbStatus = await checkDatabaseConnectivity();

    const isReady = dbStatus.connected;
    return {
      statusCode: isReady ? 200 : 503,
      body: {
        success: isReady,
        service: 'Hoollow Backend',
        status: isReady ? 'ready' : 'not_ready',
        database: dbStatus,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const healthService = new HealthService();
