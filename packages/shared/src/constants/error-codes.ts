// ============================================================
// Error Code Taxonomy (from FDD Section 3.1.1)
// ============================================================

export interface ErrorCodeDefinition {
  code: string;
  httpStatus: number;
  category: string;
  description: string;
}

/**
 * Canonical error codes used throughout the platform.
 * Key is the error code string for constant-time lookup.
 */
export const ERROR_CODES = {
  // ---- Authentication ----
  'AUTH-001': {
    code: 'AUTH-001',
    httpStatus: 401,
    category: 'Authentication failed',
    description:
      'Invalid credentials, expired token, or invalid API key',
  },
  'AUTH-002': {
    code: 'AUTH-002',
    httpStatus: 401,
    category: 'Token expired',
    description:
      'Access token expired — use refresh token to obtain a new one',
  },
  'AUTH-003': {
    code: 'AUTH-003',
    httpStatus: 401,
    category: 'SSO required',
    description:
      'Account is configured for SSO-only login; password auth disabled',
  },

  // ---- Authorization ----
  'AUTHZ-001': {
    code: 'AUTHZ-001',
    httpStatus: 403,
    category: 'Insufficient role',
    description:
      'User role does not have permission for this action (e.g., contributor attempting admin action)',
  },
  'AUTHZ-002': {
    code: 'AUTHZ-002',
    httpStatus: 403,
    category: 'Restricted scope',
    description:
      'Restricted manager accessing a person or project outside their assigned scope',
  },

  // ---- Validation ----
  'VAL-001': {
    code: 'VAL-001',
    httpStatus: 400,
    category: 'Missing required field',
    description: 'A required field is missing from the request body',
  },
  'VAL-002': {
    code: 'VAL-002',
    httpStatus: 400,
    category: 'Invalid format',
    description:
      'A field value does not match the expected format (e.g., invalid email)',
  },
  'VAL-003': {
    code: 'VAL-003',
    httpStatus: 400,
    category: 'Out of range',
    description:
      'A numeric or date field is outside the allowed range',
  },

  // ---- Business Logic ----
  'BIZ-001': {
    code: 'BIZ-001',
    httpStatus: 409,
    category: 'Duplicate entity',
    description:
      'Assignment already exists for this person/project/date combination',
  },
  'BIZ-002': {
    code: 'BIZ-002',
    httpStatus: 409,
    category: 'Contract overlap',
    description:
      'Contract dates overlap with an existing contract for this person',
  },
  'BIZ-003': {
    code: 'BIZ-003',
    httpStatus: 422,
    category: 'Timesheet locked',
    description:
      'Cannot modify timesheet entry in a locked period (auto-lock or manual lock)',
  },
  'BIZ-004': {
    code: 'BIZ-004',
    httpStatus: 422,
    category: 'Delete blocked',
    description:
      'Cannot delete entity because it has dependent records (e.g., person with active assignments)',
  },
  'BIZ-005': {
    code: 'BIZ-005',
    httpStatus: 409,
    category: 'Version conflict',
    description:
      'Optimistic locking conflict — the resource was modified since last read (stale version)',
  },
  'BIZ-006': {
    code: 'BIZ-006',
    httpStatus: 422,
    category: 'Business rule violation',
    description:
      'Generic business rule violation (e.g., last admin cannot be deactivated)',
  },

  // ---- Rate Limiting ----
  'RATE-001': {
    code: 'RATE-001',
    httpStatus: 429,
    category: 'Rate limited',
    description:
      'Too many requests — check Retry-After header for wait time (120 req/min per key per IP)',
  },

  // ---- System ----
  'SYS-001': {
    code: 'SYS-001',
    httpStatus: 500,
    category: 'Internal error',
    description:
      'Unexpected server error — logged internally, no details exposed to client',
  },
  'SYS-002': {
    code: 'SYS-002',
    httpStatus: 503,
    category: 'Service unavailable',
    description:
      'Database or Redis connection failure — service temporarily unavailable',
  },
} as const satisfies Record<string, ErrorCodeDefinition>;

export type ErrorCode = keyof typeof ERROR_CODES;

/**
 * Helper to get the HTTP status for a given error code.
 */
export function getHttpStatusForCode(code: ErrorCode): number {
  return ERROR_CODES[code].httpStatus;
}

/**
 * Helper to check if an error code belongs to a specific prefix.
 */
export function isAuthError(code: string): boolean {
  return code.startsWith('AUTH-');
}

export function isAuthzError(code: string): boolean {
  return code.startsWith('AUTHZ-');
}

export function isValidationError(code: string): boolean {
  return code.startsWith('VAL-');
}

export function isBusinessError(code: string): boolean {
  return code.startsWith('BIZ-');
}

export function isSystemError(code: string): boolean {
  return code.startsWith('SYS-');
}
