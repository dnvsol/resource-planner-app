import { Request, Response, NextFunction } from 'express';
import { AssignmentsService } from './assignments.service.js';
import { success, created, noContent, successPaginated } from '../../common/response.js';

export class AssignmentsController {
  constructor(private readonly service: AssignmentsService) {}

  // ============================================================
  // List Assignments
  // ============================================================

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const filter = req.query as Record<string, unknown>;

      const result = await this.service.listAssignments(accountId, filter as never);
      successPaginated(res, result.data, result.meta);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Create Assignment
  // ============================================================

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const assignments = await this.service.createAssignment(accountId, req.body);
      created(res, assignments);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Get Assignment By ID
  // ============================================================

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const assignment = await this.service.getAssignment(accountId, req.params.id);
      success(res, assignment);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Update Assignment (with optimistic locking via x-expected-version header)
  // ============================================================

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const versionHeader = req.headers['x-expected-version'];
      const expectedVersion = versionHeader ? parseInt(versionHeader as string, 10) : undefined;

      const assignment = await this.service.updateAssignment(
        accountId,
        req.params.id,
        req.body,
        expectedVersion,
      );
      success(res, assignment);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Delete Assignment
  // ============================================================

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      await this.service.deleteAssignment(accountId, req.params.id);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Split Assignment
  // ============================================================

  split = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const { splitDate } = req.body;
      const result = await this.service.splitAssignment(accountId, req.params.id, splitDate);
      success(res, result);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Transfer Assignment
  // ============================================================

  transfer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const { projectId } = req.body;
      const assignment = await this.service.transferAssignment(accountId, req.params.id, projectId);
      success(res, assignment);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Clone Assignment
  // ============================================================

  clone = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const overrides = req.body;
      const assignment = await this.service.cloneAssignment(accountId, req.params.id, overrides);
      created(res, assignment);
    } catch (err) {
      next(err);
    }
  };
}
