import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Hoollow Backend Foundation API', () => {
  it('GET / should return 200 with welcome message', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: 'Welcome to Hoollow API',
    });
  });

  it('GET /api/health should return 200 with service health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.service).toBe('Hoollow Backend');
    expect(res.body.status).toBe('healthy');
    expect(typeof res.body.timestamp).toBe('string');
  });

  it('GET /api/health/ready should report honest database readiness status', async () => {
    const res = await request(app).get('/api/health/ready');
    // If DATABASE_URL is unset or DB is unreachable, status should be 503; if connected, 200
    expect([200, 503]).toContain(res.status);
    expect(typeof res.body.success).toBe('boolean');
    expect(res.body.service).toBe('Hoollow Backend');
    expect(['ready', 'not_ready']).toContain(res.body.status);
    expect(res.body.database).toBeDefined();
    expect(typeof res.body.database.connected).toBe('boolean');
  });

  it('GET /unknown-route should return 404 with standard error JSON', async () => {
    const res = await request(app).get('/unknown-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.statusCode).toBe(404);
  });
});
