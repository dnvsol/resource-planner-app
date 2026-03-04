import { RequestHandler } from 'express';
import { ZodSchema } from 'zod';

/**
 * Factory: creates middleware that validates req[source] against a Zod schema.
 * Replaces req[source] with parsed/coerced data on success.
 */
export function validate(
  schema: ZodSchema,
  source: 'body' | 'query' | 'params' = 'body',
): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({
        error: {
          status: 400,
          code: 'VAL-001',
          message: 'Validation failed',
          details: {
            errors: result.error.errors.map((e) => ({
              field: e.path.join('.'),
              rule: e.code,
              message: e.message,
            })),
          },
        },
      });
    }
    (req as any)[source] = result.data;
    next();
  };
}
