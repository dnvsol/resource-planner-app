import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '../../.env' });
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from './config/env.js';
import { initializeDatabase } from './config/data-source.js';
import { createApp } from './app.js';
import { setupRealtimeGateway } from './modules/realtime/realtime.gateway.js';
import { logger } from './common/logger.js';

async function main() {
  logger.info('DNVSol API starting...');

  // Initialize database
  const dataSource = await initializeDatabase();

  // Create Express app
  const app = createApp({
    dataSource,
    jwtSecret: env.JWT_SECRET,
    jwtAccessExpiry: env.JWT_ACCESS_EXPIRY,
    jwtRefreshExpiry: env.JWT_REFRESH_EXPIRY,
    corsOrigins: env.CORS_ORIGINS.join(','),
    rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
    rateLimitMax: env.RATE_LIMIT_MAX,
  });

  const server = http.createServer(app);

  // Socket.io setup
  const io = new SocketIOServer(server, {
    cors: { origin: env.CORS_ORIGINS },
    path: '/ws',
  });

  // Setup realtime gateway with JWT auth and account rooms
  setupRealtimeGateway(io, env.JWT_SECRET);

  server.listen(env.API_PORT, () => {
    logger.info({ port: env.API_PORT, env: env.NODE_ENV }, 'DNVSol API ready');
  });
}

main().catch((err) => {
  logger.error(err, 'Failed to start API');
  process.exit(1);
});
