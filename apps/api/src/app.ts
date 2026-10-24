import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { apiRouter } from './routes';
import { notFoundHandler } from './middleware/not-found.middleware';
import { errorHandler } from './middleware/error.middleware';

export function createApp(): Application {
  const app: Application = express();

  // 1. Core middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 2. CORS configuration using validated environment variable
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // 3. Root endpoint
  // GET / -> Welcome message
  app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'Welcome to Hoollow API',
    });
  });

  // 4. Mount API routes under /api
  app.use('/api', apiRouter);

  // 5. Unknown routes handler (404)
  app.use(notFoundHandler);

  // 6. Centralized error handling middleware
  app.use(errorHandler);

  return app;
}

export const app = createApp();
