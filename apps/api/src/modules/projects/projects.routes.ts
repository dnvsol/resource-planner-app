import { Router } from 'express';
import { DataSource } from 'typeorm';
import { ProjectsController } from './projects.controller.js';
import { ProjectsService } from './projects.service.js';
import { validate } from '../../middleware/validate.middleware.js';
import { rbac } from '../../middleware/rbac.middleware.js';
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  ProjectFilterSchema,
  CreatePhaseSchema,
  UpdatePhaseSchema,
  CreateMilestoneSchema,
  UpdateMilestoneSchema,
  CreateProjectNoteSchema,
  CreateOtherExpenseSchema,
  UpdateOtherExpenseSchema,
  ProjectRateSchema,
  UpdateRateCardEntrySchema,
} from '@dnvsol/shared';

export function createProjectRoutes(dataSource: DataSource): Router {
  const service = new ProjectsService(dataSource);
  const controller = new ProjectsController(service);
  const router = Router();

  // Core CRUD
  router.get('/', validate(ProjectFilterSchema, 'query'), controller.list);
  router.post('/', rbac('admin', 'manager'), validate(CreateProjectSchema), controller.create);
  router.get('/:id', controller.getById);
  router.put('/:id', rbac('admin', 'manager'), validate(UpdateProjectSchema), controller.update);
  router.delete('/:id', rbac('admin', 'manager'), controller.delete);
  router.post('/:id/archive', rbac('admin', 'manager'), controller.archive);

  // Phases
  router.post('/:id/phases', rbac('admin', 'manager'), validate(CreatePhaseSchema), controller.createPhase);
  router.put('/:id/phases/:phaseId', rbac('admin', 'manager'), validate(UpdatePhaseSchema), controller.updatePhase);
  router.delete('/:id/phases/:phaseId', rbac('admin', 'manager'), controller.deletePhase);

  // Milestones
  router.post('/:id/milestones', rbac('admin', 'manager'), validate(CreateMilestoneSchema), controller.createMilestone);
  router.put('/:id/milestones/:milestoneId', rbac('admin', 'manager'), validate(UpdateMilestoneSchema), controller.updateMilestone);
  router.delete('/:id/milestones/:milestoneId', rbac('admin', 'manager'), controller.deleteMilestone);

  // Notes
  router.get('/:id/notes', controller.listNotes);
  router.post('/:id/notes', validate(CreateProjectNoteSchema), controller.createNote);
  router.delete('/:id/notes/:noteId', controller.deleteNote);

  // Tags
  router.post('/:id/tags/:tagId', rbac('admin', 'manager'), controller.addTag);
  router.delete('/:id/tags/:tagId', rbac('admin', 'manager'), controller.removeTag);

  // Managers
  router.post('/:id/managers/:userId', rbac('admin', 'manager'), controller.addManager);
  router.delete('/:id/managers/:userId', rbac('admin', 'manager'), controller.removeManager);

  // Budget Roles
  router.put('/:id/budget-roles', rbac('admin', 'manager'), controller.setBudgetRoles);

  // Other Expenses
  router.get('/:id/other-expenses', controller.listOtherExpenses);
  router.post('/:id/other-expenses', rbac('admin', 'manager'), validate(CreateOtherExpenseSchema), controller.createOtherExpense);
  router.put('/:id/other-expenses/:eid', rbac('admin', 'manager'), validate(UpdateOtherExpenseSchema), controller.updateOtherExpense);
  router.delete('/:id/other-expenses/:eid', rbac('admin', 'manager'), controller.deleteOtherExpense);

  // Project Rates
  router.get('/:id/rates', controller.listProjectRates);
  router.put('/:id/rates', rbac('admin', 'manager'), controller.setProjectRates);
  router.put('/:id/rates/:rid', rbac('admin', 'manager'), controller.updateProjectRate);
  router.delete('/:id/rates/:rid', rbac('admin', 'manager'), controller.deleteProjectRate);

  return router;
}
