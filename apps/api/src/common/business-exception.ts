export class BusinessException extends Error {
  constructor(
    public readonly code: string,
    public readonly httpStatus: number,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'BusinessException';
  }

  // Auth errors
  static authFailed(message = 'Invalid credentials') {
    return new BusinessException('AUTH-001', 401, message);
  }

  static tokenExpired(message = 'Token expired') {
    return new BusinessException('AUTH-002', 401, message);
  }

  static ssoRequired(message = 'SSO login required for this account') {
    return new BusinessException('AUTH-003', 401, message);
  }

  // Authorization errors
  static insufficientRole(message = 'Insufficient permissions') {
    return new BusinessException('AUTHZ-001', 403, message);
  }

  static restrictedScope(message = 'Access denied — restricted manager scope') {
    return new BusinessException('AUTHZ-002', 403, message);
  }

  // Business logic errors
  static duplicate(message: string, details?: Record<string, unknown>) {
    return new BusinessException('BIZ-001', 409, message, details);
  }

  static contractOverlap(message: string, details?: Record<string, unknown>) {
    return new BusinessException('BIZ-002', 409, message, details);
  }

  static timesheetLocked(message: string) {
    return new BusinessException('BIZ-003', 422, message);
  }

  static deleteBlocked(message: string, details?: Record<string, unknown>) {
    return new BusinessException('BIZ-004', 422, message, details);
  }

  static versionConflict(message = 'Record has been modified by another user') {
    return new BusinessException('BIZ-005', 409, message);
  }

  static businessRule(message: string, details?: Record<string, unknown>) {
    return new BusinessException('BIZ-006', 422, message, details);
  }

  // Not found
  static notFound(entity: string, id: string) {
    return new BusinessException('BIZ-007', 404, `${entity} not found: ${id}`);
  }
}
