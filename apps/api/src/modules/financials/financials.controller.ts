import { Request, Response, NextFunction } from 'express';
import { FinancialsService } from './financials.service.js';
import { success } from '../../common/response.js';

export class FinancialsController {
  constructor(private readonly service: FinancialsService) {}

  // ============================================================
  // Insights
  // ============================================================

  getUtilization = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const { startDate, endDate } = req.query as { startDate: string; endDate: string };

      if (!startDate || !endDate) {
        return res.status(400).json({ error: { message: 'startDate and endDate are required' } });
      }

      const data = await this.service.getUtilization(accountId, { startDate, endDate });
      success(res, data);
    } catch (err) {
      next(err);
    }
  };

  getCapacity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const { startDate, endDate, period } = req.query as {
        startDate: string;
        endDate: string;
        period?: 'week' | 'month' | 'quarter';
      };

      if (!startDate || !endDate) {
        return res.status(400).json({ error: { message: 'startDate and endDate are required' } });
      }

      const data = await this.service.getCapacity(
        accountId,
        { startDate, endDate },
        period ?? 'month',
      );
      success(res, data);
    } catch (err) {
      next(err);
    }
  };

  getProjectFinancials = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const projectId = req.params.id;
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

      const dateRange = startDate && endDate ? { startDate, endDate } : undefined;
      const data = await this.service.getProjectFinancials(accountId, projectId, dateRange);
      success(res, data);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Reports
  // ============================================================

  getProjectsReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const dateRange = startDate && endDate ? { startDate, endDate } : undefined;

      const data = await this.service.getProjectsReport(accountId, dateRange);
      success(res, data);
    } catch (err) {
      next(err);
    }
  };

  getProjectReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const dateRange = startDate && endDate ? { startDate, endDate } : undefined;

      const data = await this.service.getProjectReport(accountId, req.params.id, dateRange);
      success(res, data);
    } catch (err) {
      next(err);
    }
  };

  getUtilizationReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const { startDate, endDate } = req.query as { startDate: string; endDate: string };

      if (!startDate || !endDate) {
        return res.status(400).json({ error: { message: 'startDate and endDate are required' } });
      }

      const data = await this.service.getUtilizationReport(accountId, { startDate, endDate });
      success(res, data);
    } catch (err) {
      next(err);
    }
  };

  getProfitabilityReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const dateRange = startDate && endDate ? { startDate, endDate } : undefined;

      const data = await this.service.getProfitabilityReport(accountId, dateRange);
      success(res, data);
    } catch (err) {
      next(err);
    }
  };
}
