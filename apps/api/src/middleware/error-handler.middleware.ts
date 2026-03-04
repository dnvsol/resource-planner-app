import { ErrorRequestHandler } from 'express';
import { BusinessException } from '../common/business-exception.js';
import { logger } from '../common/logger.js';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof BusinessException) {
    return res.status(err.httpStatus).json({
      error: {
        status: err.httpStatus,
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
  }

  // Unexpected error — log full stack, return generic message
  const requestId = req.headers['x-request-id'];
  logger.error({ err, requestId, path: req.path }, 'Unhandled error');

  res.status(500).json({
    error: {
      status: 500,
      code: 'SYS-001',
      message: 'Internal server error',
    },
  });
};
