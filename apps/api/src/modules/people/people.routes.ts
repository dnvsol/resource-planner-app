import { Router } from 'express';
import { DataSource } from 'typeorm';
import { PeopleController } from './people.controller.js';
import { PeopleService } from './people.service.js';
import { validate } from '../../middleware/validate.middleware.js';
import { rbac } from '../../middleware/rbac.middleware.js';
import {
  CreatePersonSchema,
  UpdatePersonSchema,
  BulkUpdatePeopleSchema,
  PersonFilterSchema,
  PersonSkillSchema,
  CreatePersonNoteSchema,
} from '@dnvsol/shared';

export function createPeopleRoutes(dataSource: DataSource): Router {
  const service = new PeopleService(dataSource);
  const controller = new PeopleController(service);
  const router = Router();

  // Core CRUD
  router.get('/', validate(PersonFilterSchema, 'query'), controller.list);
  router.post('/', rbac('admin', 'manager'), validate(CreatePersonSchema), controller.create);
  router.get('/:id', controller.getById);
  router.put('/:id', rbac('admin', 'manager'), validate(UpdatePersonSchema), controller.update);
  router.delete('/:id', rbac('admin', 'manager'), controller.delete);

  // Archive
  router.post('/:id/archive', rbac('admin', 'manager'), controller.archive);
  router.post('/:id/unarchive', rbac('admin', 'manager'), controller.unarchive);

  // Bulk
  router.patch('/bulk', rbac('admin', 'manager'), validate(BulkUpdatePeopleSchema), controller.bulkUpdate);

  // Managers
  router.post('/:id/managers/:userId', rbac('admin', 'manager'), controller.addManager);
  router.delete('/:id/managers/:userId', rbac('admin', 'manager'), controller.removeManager);

  // Skills
  router.put('/:id/skills', rbac('admin', 'manager'), controller.setSkills);
  router.post('/:id/skills', rbac('admin', 'manager'), validate(PersonSkillSchema), controller.addSkill);
  router.delete('/:id/skills/:skillId', rbac('admin', 'manager'), controller.removeSkill);

  // Tags
  router.post('/:id/tags/:tagId', rbac('admin', 'manager'), controller.addTag);
  router.delete('/:id/tags/:tagId', rbac('admin', 'manager'), controller.removeTag);

  // Notes
  router.get('/:id/notes', controller.listNotes);
  router.post('/:id/notes', validate(CreatePersonNoteSchema), controller.createNote);
  router.delete('/:id/notes/:noteId', controller.deleteNote);

  return router;
}
