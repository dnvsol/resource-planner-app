import { Router } from 'express';
import { DataSource } from 'typeorm';
import { RateCardsController } from './rate-cards.controller.js';
import { RateCardsService } from './rate-cards.service.js';
import { validate } from '../../middleware/validate.middleware.js';
import { rbac } from '../../middleware/rbac.middleware.js';
import {
  CreateRateCardSchema,
  UpdateRateCardSchema,
  CreateRateCardEntrySchema,
  UpdateRateCardEntrySchema,
} from '@dnvsol/shared';

export function createRateCardRoutes(dataSource: DataSource): Router {
  const service = new RateCardsService(dataSource);
  const controller = new RateCardsController(service);
  const router = Router();

  // Rate Card CRUD
  router.get('/', controller.list);
  router.post('/', rbac('admin', 'manager'), validate(CreateRateCardSchema), controller.create);
  router.get('/:id', controller.getById);
  router.put('/:id', rbac('admin', 'manager'), validate(UpdateRateCardSchema), controller.update);
  router.delete('/:id', rbac('admin', 'manager'), controller.delete);

  // Rate Card Entries
  router.post('/:id/entries', rbac('admin', 'manager'), validate(CreateRateCardEntrySchema), controller.addEntry);
  router.put('/:id/entries/:eid', rbac('admin', 'manager'), validate(UpdateRateCardEntrySchema), controller.updateEntry);
  router.delete('/:id/entries/:eid', rbac('admin', 'manager'), controller.deleteEntry);

  return router;
}
