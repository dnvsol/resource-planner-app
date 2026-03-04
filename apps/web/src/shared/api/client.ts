import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

// ---------------------------------------------------------------------------
// Axios instance — base URL handled by Vite proxy (see vite.config.ts)
// ---------------------------------------------------------------------------

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------

const TOKEN_KEY = 'dnvsol_token';
const REFRESH_KEY = 'dnvsol_refresh_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// ---------------------------------------------------------------------------
// Request interceptor — attach Bearer token
// ---------------------------------------------------------------------------

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ---------------------------------------------------------------------------
// Response interceptor — handle 401 with silent token refresh
// ---------------------------------------------------------------------------

// Guard against concurrent refresh attempts. When a refresh is in-flight we
// queue subsequent 401 failures and resolve/reject them once the refresh
// settles.

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processPendingQueue(token: string | null, error: unknown): void {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (token) {
      resolve(token);
    } else {
      reject(error);
    }
  });
  pendingQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only handle 401 responses (and not from the refresh endpoint itself)
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url === '/auth/refresh'
    ) {
      return Promise.reject(error);
    }

    // If a refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      isRefreshing = false;
      processPendingQueue(null, error);
      clearTokens();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      // Use a plain axios call (not apiClient) to avoid the request interceptor
      // attaching the expired access token. The refresh endpoint only needs the
      // refresh token in the body.
      const { data } = await axios.post('/api/v1/auth/refresh', {
        refreshToken,
      });

      const newAccessToken: string = data.data.accessToken ?? data.accessToken;
      const newRefreshToken: string =
        data.data.refreshToken ?? data.refreshToken;

      setTokens(newAccessToken, newRefreshToken);

      // Retry the original request with the new token
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      // Resolve any requests that were queued while refreshing
      processPendingQueue(newAccessToken, null);

      return apiClient(originalRequest);
    } catch (refreshError) {
      processPendingQueue(null, refreshError);
      clearTokens();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
