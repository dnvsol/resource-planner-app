import { RequestHandler } from 'express';
import { DataSource } from 'typeorm';
import { AuthenticatedRequest } from './auth.middleware.js';

/**
 * Tenant isolation middleware.
 * Auth middleware already validates the JWT and sets req.user.accountId.
 * Services use req.user.accountId to scope all queries.
 *
 * (PostgreSQL RLS replaced with application-level filtering for MySQL compatibility.)
 */
export function createRlsMiddleware(_dataSource: DataSource): RequestHandler {
  return (req, _res, next) => {
    const accountId = (req as unknown as AuthenticatedRequest).user?.accountId;
    if (!accountId) return next();
    // accountId is available on req.user for all downstream services
    next();
  };
}
