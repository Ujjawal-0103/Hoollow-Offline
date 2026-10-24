import { app } from './app';
import { env } from './config/env';
import { disconnectPrisma } from './lib/prisma';
import http from 'http';

const server = http.createServer(app);

server.listen(env.PORT, () => {
  console.log(`=================================================`);
  console.log(`  Hoollow Backend API running in ${env.NODE_ENV} mode`);
  console.log(`  Listening on: http://localhost:${env.PORT}`);
  console.log(`  Health Check: http://localhost:${env.PORT}/api/health`);
  console.log(`  Readiness:    http://localhost:${env.PORT}/api/health/ready`);
  console.log(`  CORS Origin:  ${env.FRONTEND_URL}`);
  console.log(`=================================================`);
});

let isShuttingDown = false;

async function handleGracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  console.log(`\nReceived ${signal}. Initiating graceful shutdown...`);

  // Stop accepting new connections
  server.close(async (err?: Error) => {
    if (err) {
      console.error('Error closing HTTP server:', err);
      process.exit(1);
    }

    console.log('HTTP server closed.');

    // Disconnect Prisma client if active
    try {
      await disconnectPrisma();
      console.log('Database connection disconnected.');
    } catch (dbErr: unknown) {
      console.error('Error disconnecting database:', dbErr);
    }

    console.log('Graceful shutdown complete. Exiting.');
    process.exit(0);
  });

  // Force shutdown after timeout in case connections remain open
  setTimeout(() => {
    console.error('Shutdown timeout reached. Forcing exit.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

export { server };
