import { Router } from 'express';
import { DataSource } from 'typeorm';
import { AssignmentsController } from './assignments.controller.js';
import { AssignmentsService } from './assignments.service.js';
import { validate } from '../../middleware/validate.middleware.js';
import { rbac } from '../../middleware/rbac.middleware.js';
import {
  CreateAssignmentSchema,
  UpdateAssignmentSchema,
  AssignmentFilterSchema,
} from '@dnvsol/shared';

export function createAssignmentRoutes(dataSource: DataSource): Router {
  const service = new AssignmentsService(dataSource);
  const controller = new AssignmentsController(service);
  const router = Router();

  router.get('/', validate(AssignmentFilterSchema, 'query'), controller.list);
  router.post('/', rbac('admin', 'manager'), validate(CreateAssignmentSchema), controller.create);
  router.get('/:id', controller.getById);
  router.put('/:id', rbac('admin', 'manager'), validate(UpdateAssignmentSchema), controller.update);
  router.delete('/:id', rbac('admin', 'manager'), controller.delete);
  router.post('/:id/split', rbac('admin', 'manager'), controller.split);
  router.post('/:id/transfer', rbac('admin', 'manager'), controller.transfer);
  router.post('/:id/clone', rbac('admin', 'manager'), controller.clone);

  return router;
}
