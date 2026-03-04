import { Router } from 'express';
import { DataSource } from 'typeorm';
import { LeavesController } from './leaves.controller.js';
import { LeavesService } from './leaves.service.js';
import { validate } from '../../middleware/validate.middleware.js';
import { rbac } from '../../middleware/rbac.middleware.js';
import {
  CreateLeaveSchema,
  UpdateLeaveSchema,
  BulkCreateLeaveSchema,
  BulkDeleteLeaveSchema,
  LeaveFilterSchema,
} from '@dnvsol/shared';

export function createLeaveRoutes(dataSource: DataSource): Router {
  const service = new LeavesService(dataSource);
  const controller = new LeavesController(service);
  const router = Router();

  // Core CRUD
  router.get('/', validate(LeaveFilterSchema, 'query'), controller.list);
  router.post('/', rbac('admin', 'manager'), validate(CreateLeaveSchema), controller.create);
  router.get('/:id', controller.getById);
  router.put('/:id', rbac('admin', 'manager'), validate(UpdateLeaveSchema), controller.update);
  router.delete('/:id', rbac('admin', 'manager'), controller.delete);

  // Bulk operations
  router.post('/bulk', rbac('admin', 'manager'), validate(BulkCreateLeaveSchema), controller.bulkCreate);
  router.delete('/bulk', rbac('admin', 'manager'), validate(BulkDeleteLeaveSchema), controller.bulkDelete);

  return router;
}
