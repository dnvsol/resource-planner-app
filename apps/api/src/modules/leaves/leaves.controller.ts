import { Request, Response, NextFunction } from 'express';
import { LeavesService } from './leaves.service.js';
import { success, created, noContent, successPaginated } from '../../common/response.js';

export class LeavesController {
  constructor(private readonly service: LeavesService) {}

  // ============================================================
  // List Leaves
  // ============================================================

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const filter = req.query as Record<string, unknown>;

      const result = await this.service.listLeaves(accountId, filter as never);
      successPaginated(res, result.data, result.meta);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Create Leave
  // ============================================================

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const leave = await this.service.createLeave(accountId, req.body);
      created(res, leave);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Get Leave By ID
  // ============================================================

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const leave = await this.service.getLeave(accountId, req.params.id);
      success(res, leave);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Update Leave
  // ============================================================

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const leave = await this.service.updateLeave(accountId, req.params.id, req.body);
      success(res, leave);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Delete Leave
  // ============================================================

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      await this.service.deleteLeave(accountId, req.params.id);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Bulk Create Leaves
  // ============================================================

  bulkCreate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const leaves = await this.service.bulkCreateLeaves(accountId, req.body);
      created(res, leaves);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Bulk Delete Leaves
  // ============================================================

  bulkDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      await this.service.bulkDeleteLeaves(accountId, req.body);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };
}
