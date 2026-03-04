import { Router } from 'express';
import { DataSource } from 'typeorm';
import { ContractsController } from './contracts.controller.js';
import { ContractsService } from './contracts.service.js';
import { validate } from '../../middleware/validate.middleware.js';
import { rbac } from '../../middleware/rbac.middleware.js';
import { CreateContractSchema, UpdateContractSchema } from '@dnvsol/shared';

export function createContractRoutes(dataSource: DataSource): Router {
  const service = new ContractsService(dataSource);
  const controller = new ContractsController(service);
  const router = Router({ mergeParams: true });

  router.get('/', controller.list);
  router.get('/active', controller.getActive);
  router.get('/:contractId', controller.getById);
  router.post('/', rbac('admin', 'manager'), validate(CreateContractSchema), controller.create);
  router.put('/:contractId', rbac('admin', 'manager'), validate(UpdateContractSchema), controller.update);
  router.delete('/:contractId', rbac('admin', 'manager'), controller.delete);

  return router;
}
