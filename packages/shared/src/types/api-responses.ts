// ============================================================
// API Response Envelope Types
// ============================================================

/**
 * Cursor-based pagination info returned in the `meta` field.
 */
export interface CursorInfo {
  /** Opaque cursor string for the next page. Null if no more results. */
  cursor: string | null;
  /** Whether there are more results beyond this page. */
  hasMore: boolean;
  /** Total count of matching records (may be omitted for performance). */
  total?: number;
}

/**
 * Standard success response wrapping a single resource.
 */
export interface ApiResponse<T> {
  data: T;
}

/**
 * Success response wrapping a paginated list of resources.
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: CursorInfo;
}

/**
 * Alias for PaginatedResponse — used interchangeably.
 */
export type PaginatedResult<T> = PaginatedResponse<T>;

// ============================================================
// Error Types
// ============================================================

/**
 * A single field-level validation error.
 */
export interface ValidationFieldError {
  field: string;
  rule: string;
  message: string;
}

/**
 * Structured error response returned by the API.
 */
export interface ApiError {
  error: {
    /** HTTP status code */
    status: number;
    /** Error code from the taxonomy (e.g. AUTH-001, VAL-002, BIZ-003) */
    code: string;
    /** Human-readable error message */
    message: string;
    /** Additional context — may contain field-level errors or conflict info */
    details?: {
      field?: string;
      errors?: ValidationFieldError[];
      conflicting_contract_id?: string;
      [key: string]: unknown;
    };
  };
}

// ============================================================
// Rate Limit Headers (parsed from response)
// ============================================================

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
  retryAfter?: number; // seconds — only present on 429
}

// ============================================================
// Auth Response Types
// ============================================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

export interface LoginResponse {
  token: AuthTokens;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: 'admin' | 'manager' | 'contributor';
    accountId: string;
  };
}

export interface MeResponse {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'admin' | 'manager' | 'contributor';
  accountId: string;
  permissions: Record<string, unknown>;
  lastLoginAt: string | null;
}
