import { Request, Response, NextFunction } from 'express';
import { ContractsService } from './contracts.service.js';
import { BusinessException } from '../../common/business-exception.js';
import { success, created, noContent } from '../../common/response.js';

export class ContractsController {
  constructor(private readonly service: ContractsService) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const { personId } = req.params;

      const contracts = await this.service.listContracts(accountId, personId);
      success(res, contracts);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const { contractId } = req.params;

      const contract = await this.service.getContract(accountId, contractId);
      success(res, contract);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const { personId } = req.params;

      const contract = await this.service.createContract(accountId, {
        ...req.body,
        personId,
      });
      created(res, contract);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const { contractId } = req.params;

      const contract = await this.service.updateContract(accountId, contractId, req.body);
      success(res, contract);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const { contractId } = req.params;

      await this.service.deleteContract(accountId, contractId);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  getActive = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const { personId } = req.params;

      const contract = await this.service.getActiveContract(accountId, personId);
      if (!contract) {
        throw BusinessException.notFound('Active contract', personId);
      }
      success(res, contract);
    } catch (err) {
      next(err);
    }
  };
}
