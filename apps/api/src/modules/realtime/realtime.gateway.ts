import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from '../../middleware/auth.middleware.js';
import { logger } from '../../common/logger.js';

export function setupRealtimeGateway(io: SocketIOServer, jwtSecret: string) {
  // JWT authentication middleware for Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(token as string, jwtSecret) as JwtPayload;
      (socket as any).userId = payload.sub;
      (socket as any).accountId = payload.accountId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const accountId = (socket as any).accountId;
    const userId = (socket as any).userId;

    // Join account room for tenant-scoped broadcasts
    socket.join(`account:${accountId}`);
    logger.info({ socketId: socket.id, userId, accountId }, 'WebSocket connected');

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id, userId }, 'WebSocket disconnected');
    });
  });

  return io;
}

// Broadcast helper for use by services
export function broadcastToAccount(io: SocketIOServer, accountId: string, event: string, data: unknown) {
  io.to(`account:${accountId}`).emit(event, data);
}
