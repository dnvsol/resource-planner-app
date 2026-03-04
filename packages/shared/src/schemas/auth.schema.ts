import { z } from 'zod';
import { UserRole } from './common.schema.js';

// ============================================================
// Login
// ============================================================

export const LoginSchema = z.object({
  email: z.string().email('Must be a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

// ============================================================
// Register (create new account + first admin user)
// ============================================================

export const RegisterSchema = z.object({
  accountName: z
    .string()
    .min(1, 'Account name is required')
    .max(255),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100),
  email: z.string().email('Must be a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

// ============================================================
// Refresh Token
// ============================================================

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;

// ============================================================
// Invite User
// ============================================================

export const InviteUserSchema = z.object({
  email: z.string().email('Must be a valid email address'),
  role: UserRole.default('contributor'),
});
export type InviteUserInput = z.infer<typeof InviteUserSchema>;

// ============================================================
// Update User
// ============================================================

export const UpdateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  role: UserRole.optional(),
  permissions: z.record(z.string(), z.unknown()).optional(),
});
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

// ============================================================
// Password Reset
// ============================================================

export const PasswordResetRequestSchema = z.object({
  email: z.string().email(),
});
export type PasswordResetRequestInput = z.infer<typeof PasswordResetRequestSchema>;

export const PasswordResetSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});
export type PasswordResetInput = z.infer<typeof PasswordResetSchema>;
