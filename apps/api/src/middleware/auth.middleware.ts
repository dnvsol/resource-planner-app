import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: string;
  accountId: string;
  role: 'admin' | 'manager' | 'contributor';
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest {
  user: {
    userId: string;
    accountId: string;
    role: 'admin' | 'manager' | 'contributor';
  };
}

export function createAuthMiddleware(jwtSecret: string): RequestHandler {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res
        .status(401)
        .json({ error: { status: 401, code: 'AUTH-001', message: 'Missing or invalid token' } });
    }

    try {
      const payload = jwt.verify(header.slice(7), jwtSecret) as JwtPayload;
      (req as unknown as AuthenticatedRequest).user = {
        userId: payload.sub,
        accountId: payload.accountId,
        role: payload.role,
      };
      next();
    } catch (err) {
      const isExpired = err instanceof jwt.TokenExpiredError;
      return res.status(401).json({
        error: {
          status: 401,
          code: isExpired ? 'AUTH-002' : 'AUTH-001',
          message: isExpired ? 'Token expired' : 'Invalid token',
        },
      });
    }
  };
}
