import { RequestHandler } from 'express';
import { AuthenticatedRequest } from './auth.middleware.js';

/**
 * Factory: creates middleware that checks user role against allowed roles.
 * Usage: rbac('admin', 'manager')
 */
export function rbac(...allowedRoles: string[]): RequestHandler {
  return (req, res, next) => {
    const role = (req as unknown as AuthenticatedRequest).user?.role;
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({
        error: {
          status: 403,
          code: 'AUTHZ-001',
          message: 'Insufficient permissions',
        },
      });
    }
    next();
  };
}
