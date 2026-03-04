import path from 'path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { DataSource } from 'typeorm';
import {
  correlationId,
  createRateLimiter,
  createAuthMiddleware,
  createRlsMiddleware,
  errorHandler,
  notFound,
} from './middleware/index.js';
import { createAuthRoutes } from './modules/auth/auth.routes.js';
import { AuthService } from './modules/auth/auth.service.js';
import { AuthController } from './modules/auth/auth.controller.js';
import { createOrganizationRoutes } from './modules/organizations/organizations.routes.js';
import { createPeopleRoutes } from './modules/people/people.routes.js';
import { createContractRoutes } from './modules/contracts/contracts.routes.js';
import { createProjectRoutes } from './modules/projects/projects.routes.js';
import { createAssignmentRoutes } from './modules/assignments/assignments.routes.js';
import { createLeaveRoutes } from './modules/leaves/leaves.routes.js';
import { createRateCardRoutes } from './modules/rate-cards/rate-cards.routes.js';
import { createFinancialRoutes } from './modules/financials/financials.routes.js';
import { logger } from './common/logger.js';

export interface AppDeps {
  dataSource: DataSource;
  jwtSecret: string;
  jwtAccessExpiry: string;
  jwtRefreshExpiry: string;
  corsOrigins: string;
  rateLimitWindowMs: number;
  rateLimitMax: number;
}

export function createApp(deps: AppDeps) {
  const app = express();

  // Global middleware (order matters)
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? false : undefined,
    }),
  );
  app.use(
    cors({
      origin: deps.corsOrigins.split(',').map((s) => s.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(correlationId);
  app.use(createRateLimiter(deps.rateLimitWindowMs, deps.rateLimitMax));

  // Request logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      logger.info(
        {
          method: req.method,
          path: req.path,
          status: res.statusCode,
          ms: Date.now() - start,
          requestId: req.headers['x-request-id'],
        },
        'request',
      );
    });
    next();
  });

  // Health check (no auth)
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Auth routes (no auth middleware — public)
  const authRoutes = createAuthRoutes(
    deps.dataSource,
    deps.jwtSecret,
    deps.jwtAccessExpiry,
    deps.jwtRefreshExpiry,
  );
  app.use('/api/v1/auth', authRoutes);

  // Protected routes — auth + RLS
  const authMiddleware = createAuthMiddleware(deps.jwtSecret);
  const rlsMiddleware = createRlsMiddleware(deps.dataSource);
  app.use('/api/v1', authMiddleware, rlsMiddleware);

  // GET /api/v1/me — current user (protected)
  const meService = new AuthService(
    deps.dataSource,
    deps.jwtSecret,
    deps.jwtAccessExpiry,
    deps.jwtRefreshExpiry,
  );
  const meController = new AuthController(meService);
  app.get('/api/v1/me', meController.getMe);

  // Organization routes (teams, roles, skills, tags, clients)
  const orgRoutes = createOrganizationRoutes(deps.dataSource);
  app.use('/api/v1/teams', orgRoutes.teams);
  app.use('/api/v1/roles', orgRoutes.roles);
  app.use('/api/v1/skills', orgRoutes.skills);
  app.use('/api/v1/tags', orgRoutes.tags);
  app.use('/api/v1/clients', orgRoutes.clients);

  // People routes (CRUD, archive, bulk, managers, skills, tags, notes)
  const peopleRoutes = createPeopleRoutes(deps.dataSource);
  app.use('/api/v1/people', peopleRoutes);

  // Contract routes (nested under people — CRUD with overlap validation)
  const contractRoutes = createContractRoutes(deps.dataSource);
  app.use('/api/v1/people/:personId/contracts', contractRoutes);

  // Project routes (CRUD, phases, milestones, notes, tags, managers, budget roles)
  const projectRoutes = createProjectRoutes(deps.dataSource);
  app.use('/api/v1/projects', projectRoutes);

  // Assignment routes (CRUD, split, transfer, clone)
  const assignmentRoutes = createAssignmentRoutes(deps.dataSource);
  app.use('/api/v1/assignments', assignmentRoutes);

  // Leave/time-off routes (CRUD, bulk create/delete)
  const leaveRoutes = createLeaveRoutes(deps.dataSource);
  app.use('/api/v1/leaves', leaveRoutes);

  // Rate Card routes (CRUD rate cards + entries)
  const rateCardRoutes = createRateCardRoutes(deps.dataSource);
  app.use('/api/v1/rate-cards', rateCardRoutes);

  // Financial routes (insights + reports + project financials)
  const { insightsRouter, reportsRouter, controller: financialsController } =
    createFinancialRoutes(deps.dataSource);
  app.use('/api/v1/insights', insightsRouter);
  app.use('/api/v1/reports', reportsRouter);
  app.get('/api/v1/projects/:id/financials', financialsController.getProjectFinancials);

  // ---------- Production: serve frontend static files ----------
  if (process.env.NODE_ENV === 'production') {
    const webDist = path.resolve(__dirname, '../../web/dist');
    app.use(express.static(webDist));
    // SPA fallback: any non-API route serves index.html
    app.get('*', (_req, res) => {
      res.sendFile(path.join(webDist, 'index.html'));
    });
  } else {
    // Dev: 404 for non-API routes
    app.use(notFound);
  }

  // Error handling (must be last)
  app.use(errorHandler);

  return app;
}
