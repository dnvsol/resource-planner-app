import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient, setTokens, clearTokens, getAccessToken } from '../api/client';
import type { LoginResponse, MeResponse } from '@dnvsol/shared';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  accountId: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a display name from first/last, falling back to email. */
export function displayName(user: AuthUser | null): string {
  if (!user) return 'Unknown';
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : user.email;
}

/** Build 1-2 character initials from a user. */
export function userInitials(user: AuthUser | null): string {
  if (!user) return '??';
  const first = user.firstName?.[0] ?? '';
  const last = user.lastName?.[0] ?? '';
  const initials = (first + last).toUpperCase();
  return initials || (user.email[0]?.toUpperCase() ?? '?');
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // ---- State ----
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // ---- Actions ----

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const { data } = await apiClient.post<{ data: LoginResponse }>(
            '/auth/login',
            { email, password },
          );

          const { token: tokens, user } = data.data;

          // Persist tokens in localStorage for the interceptor
          setTokens(tokens.accessToken, tokens.refreshToken);

          set({
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
              accountId: user.accountId,
            },
            token: tokens.accessToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (err: unknown) {
          const message =
            (err as { response?: { data?: { error?: { message?: string } } } })
              ?.response?.data?.error?.message ?? 'An unexpected error occurred';
          set({ isLoading: false, error: message });
        }
      },

      logout: async () => {
        // Best-effort server-side logout — ignore errors
        try {
          await apiClient.post('/auth/logout');
        } catch {
          // Silently ignore — we still clear local state
        }

        clearTokens();

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      initialize: async () => {
        const token = getAccessToken();

        if (!token) {
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
          return;
        }

        set({ isLoading: true });

        try {
          const { data } = await apiClient.get<{ data: MeResponse }>('/me');
          const me = data.data;

          set({
            user: {
              id: me.id,
              email: me.email,
              firstName: me.firstName,
              lastName: me.lastName,
              role: me.role,
              accountId: me.accountId,
            },
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          // Token is invalid or expired (refresh interceptor already tried)
          clearTokens();
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'dnvsol_auth',
      // Only persist user state — tokens are managed separately in
      // localStorage by the interceptor helpers so they're immediately
      // available before Zustand hydrates.
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
