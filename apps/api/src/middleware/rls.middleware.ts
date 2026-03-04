import { RequestHandler } from 'express';
import { DataSource } from 'typeorm';
import { AuthenticatedRequest } from './auth.middleware.js';

/**
 * RLS middleware: creates a per-request QueryRunner with
 * SET LOCAL app.current_account_id inside a transaction.
 * Services use req.queryRunner for tenant-isolated queries.
 */
export function createRlsMiddleware(dataSource: DataSource): RequestHandler {
  return async (req, res, next) => {
    const accountId = (req as unknown as AuthenticatedRequest).user?.accountId;
    if (!accountId) return next();

    try {
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      // SET doesn't support parameterized queries; accountId is a validated UUID from JWT
      await queryRunner.query(`SET LOCAL app.current_account_id = '${accountId}'`);

      (req as any).queryRunner = queryRunner;

      let cleaned = false;
      const cleanup = async () => {
        if (cleaned) return;
        cleaned = true;
        try {
          await queryRunner.commitTransaction();
        } catch {
          try {
            await queryRunner.rollbackTransaction();
          } catch {
            // already rolled back
          }
        } finally {
          await queryRunner.release();
        }
      };

      res.on('finish', cleanup);
      res.on('close', cleanup);
      next();
    } catch (err) {
      next(err);
    }
  };
}
