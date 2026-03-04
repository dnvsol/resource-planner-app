import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { validate } from '../../middleware/validate.middleware.js';
import { LoginSchema, RegisterSchema, RefreshTokenSchema } from '@dnvsol/shared';
import { DataSource } from 'typeorm';

export function createAuthRoutes(dataSource: DataSource, jwtSecret: string, accessExpiry: string, refreshExpiry: string): Router {
  const router = Router();
  const authService = new AuthService(dataSource, jwtSecret, accessExpiry, refreshExpiry);
  const controller = new AuthController(authService);

  // Public routes (no auth middleware)
  router.post('/login', validate(LoginSchema), controller.login);
  router.post('/register', validate(RegisterSchema), controller.register);
  router.post('/refresh', validate(RefreshTokenSchema), controller.refresh);
  router.post('/logout', controller.logout);

  return router;
}
