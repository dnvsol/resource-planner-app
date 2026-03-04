import rateLimit from 'express-rate-limit';

export function createRateLimiter(windowMs: number, max: number) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: {
        status: 429,
        code: 'RATE-001',
        message: 'Too many requests, please try again later',
      },
    },
  });
}
