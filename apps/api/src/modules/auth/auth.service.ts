import { DataSource } from 'typeorm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserEntity, UserSessionEntity, AccountEntity } from './auth.entity.js';
import { BusinessException } from '../../common/business-exception.js';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtSecret: string,
    private readonly accessExpiry: string,
    private readonly refreshExpiry: string,
  ) {}

  async login(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ tokens: TokenPair; user: UserEntity }> {
    const userRepo = this.dataSource.getRepository(UserEntity);

    const user = await userRepo.findOne({ where: { email } });
    if (!user) throw BusinessException.authFailed();

    if (!user.isActive) throw BusinessException.authFailed('Account is deactivated');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw BusinessException.authFailed();

    const tokens = await this.issueTokens(user, ipAddress, userAgent);

    // Update last login
    await userRepo.update(user.id, { lastLoginAt: new Date() });

    return { tokens, user };
  }

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    const sessionRepo = this.dataSource.getRepository(UserSessionEntity);
    const userRepo = this.dataSource.getRepository(UserEntity);

    const hash = this.hashToken(refreshToken);
    const session = await sessionRepo.findOne({ where: { refreshTokenHash: hash } });

    if (!session || session.expiresAt < new Date()) {
      if (session) await sessionRepo.delete(session.id);
      throw BusinessException.tokenExpired('Refresh token expired or invalid');
    }

    const user = await userRepo.findOne({ where: { id: session.userId } });
    if (!user || !user.isActive) {
      await sessionRepo.delete(session.id);
      throw BusinessException.authFailed('User not found or deactivated');
    }

    // Delete old session
    await sessionRepo.delete(session.id);

    // Issue new token pair
    return this.issueTokens(user, null, null);
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    const sessionRepo = this.dataSource.getRepository(UserSessionEntity);

    if (refreshToken) {
      const hash = this.hashToken(refreshToken);
      await sessionRepo.delete({ userId, refreshTokenHash: hash });
    } else {
      // Logout all sessions
      await sessionRepo.delete({ userId });
    }
  }

  async getMe(userId: string): Promise<UserEntity> {
    const userRepo = this.dataSource.getRepository(UserEntity);
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) throw BusinessException.notFound('User', userId);
    return user;
  }

  async register(
    accountName: string,
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
  ): Promise<{ tokens: TokenPair; user: UserEntity; account: AccountEntity }> {
    const accountRepo = this.dataSource.getRepository(AccountEntity);
    const userRepo = this.dataSource.getRepository(UserEntity);

    // Create slug from account name
    const slug = accountName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const existingSlug = await accountRepo.findOne({ where: { slug } });
    if (existingSlug) {
      throw BusinessException.duplicate('An account with this name already exists');
    }

    const existingEmail = await userRepo.findOne({ where: { email } });
    if (existingEmail) {
      throw BusinessException.duplicate('Email already registered');
    }

    // Create account
    const account = accountRepo.create({
      name: accountName,
      slug,
    });
    await accountRepo.save(account);

    // Create admin user
    const passwordHash = await bcrypt.hash(password, 12);
    const user = userRepo.create({
      accountId: account.id,
      email,
      passwordHash,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      role: 'admin',
    });
    await userRepo.save(user);

    const tokens = await this.issueTokens(user);

    return { tokens, user, account };
  }

  private async issueTokens(
    user: UserEntity,
    ipAddress?: string | null,
    userAgent?: string | null,
  ): Promise<TokenPair> {
    const expiresInSeconds = this.parseExpiry(this.accessExpiry);

    const accessToken = jwt.sign(
      { sub: user.id, accountId: user.accountId, role: user.role },
      this.jwtSecret,
      { expiresIn: expiresInSeconds },
    );

    const refreshToken = crypto.randomBytes(64).toString('hex');
    const refreshTokenHash = this.hashToken(refreshToken);

    const sessionRepo = this.dataSource.getRepository(UserSessionEntity);
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);

    const session = sessionRepo.create({
      userId: user.id,
      refreshTokenHash,
      expiresAt: refreshExpiresAt,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    });
    await sessionRepo.save(session);

    return {
      accessToken,
      refreshToken,
      expiresIn: expiresInSeconds,
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return 900; // default 15 minutes
    const value = parseInt(match[1]);
    const unit = match[2];
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 900;
    }
  }
}
