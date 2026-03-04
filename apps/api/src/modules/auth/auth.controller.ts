import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { success, created, noContent } from '../../common/response.js';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const { tokens, user } = await this.authService.login(
        email,
        password,
        req.ip,
        req.headers['user-agent'],
      );

      success(res, {
        token: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
        },
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          accountId: user.accountId,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { accountName, email, password, firstName, lastName } = req.body;
      const { tokens, user, account } = await this.authService.register(
        accountName,
        email,
        password,
        firstName,
        lastName,
      );

      created(res, {
        token: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
        },
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          accountId: account.id,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      const tokens = await this.authService.refreshToken(refreshToken);

      success(res, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      });
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user
        ? ((req as any).user as { userId: string }).userId
        : undefined;
      if (!userId) return noContent(res);

      const { refreshToken } = req.body ?? {};
      await this.authService.logout(userId, refreshToken);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = ((req as any).user as { userId: string }).userId;
      const user = await this.authService.getMe(userId);

      success(res, {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        accountId: user.accountId,
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      });
    } catch (err) {
      next(err);
    }
  };
}
