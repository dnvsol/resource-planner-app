import { Request, Response, NextFunction } from 'express';
import { RateCardsService } from './rate-cards.service.js';
import { success, created, noContent } from '../../common/response.js';

export class RateCardsController {
  constructor(private readonly service: RateCardsService) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const rateCards = await this.service.listRateCards(accountId);
      success(res, rateCards);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const rateCard = await this.service.createRateCard(accountId, req.body);
      created(res, rateCard);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const rateCard = await this.service.getRateCard(accountId, req.params.id);
      success(res, rateCard);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const rateCard = await this.service.updateRateCard(accountId, req.params.id, req.body);
      success(res, rateCard);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      await this.service.deleteRateCard(accountId, req.params.id);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  addEntry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const entry = await this.service.addEntry(accountId, req.params.id, req.body);
      created(res, entry);
    } catch (err) {
      next(err);
    }
  };

  updateEntry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const entry = await this.service.updateEntry(accountId, req.params.id, req.params.eid, req.body);
      success(res, entry);
    } catch (err) {
      next(err);
    }
  };

  deleteEntry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      await this.service.deleteEntry(accountId, req.params.id, req.params.eid);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };
}
