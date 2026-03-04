import { Router } from 'express';
import { DataSource } from 'typeorm';
import { OrganizationsController } from './organizations.controller.js';
import { OrganizationsService } from './organizations.service.js';
import { validate } from '../../middleware/validate.middleware.js';
import { rbac } from '../../middleware/rbac.middleware.js';
import {
  CreateTeamSchema,
  UpdateTeamSchema,
  CreateRoleSchema,
  UpdateRoleSchema,
  CreateSkillSchema,
  UpdateSkillSchema,
  CreateTagSchema,
  UpdateTagSchema,
  CreateClientSchema,
  UpdateClientSchema,
  BulkCreateClientsSchema,
} from '@dnvsol/shared';

export interface OrganizationRouters {
  teams: Router;
  roles: Router;
  skills: Router;
  tags: Router;
  clients: Router;
}

export function createOrganizationRoutes(dataSource: DataSource): OrganizationRouters {
  const service = new OrganizationsService(dataSource);
  const controller = new OrganizationsController(service);

  // ============================================================
  // Teams
  // ============================================================

  const teams = Router();
  teams.get('/', controller.listTeams);
  teams.post('/', rbac('admin', 'manager'), validate(CreateTeamSchema), controller.createTeam);
  teams.put('/:id', rbac('admin', 'manager'), validate(UpdateTeamSchema), controller.updateTeam);
  teams.delete('/:id', rbac('admin', 'manager'), controller.deleteTeam);

  // ============================================================
  // Roles
  // ============================================================

  const roles = Router();
  roles.get('/', controller.listRoles);
  roles.post('/', rbac('admin', 'manager'), validate(CreateRoleSchema), controller.createRole);
  roles.put('/:id', rbac('admin', 'manager'), validate(UpdateRoleSchema), controller.updateRole);
  roles.delete('/:id', rbac('admin', 'manager'), controller.deleteRole);

  // ============================================================
  // Skills
  // ============================================================

  const skills = Router();
  skills.get('/', controller.listSkills);
  skills.post('/', rbac('admin', 'manager'), validate(CreateSkillSchema), controller.createSkill);
  skills.put('/:id', rbac('admin', 'manager'), validate(UpdateSkillSchema), controller.updateSkill);
  skills.delete('/:id', rbac('admin', 'manager'), controller.deleteSkill);

  // ============================================================
  // Tags
  // ============================================================

  const tags = Router();
  tags.get('/', controller.listTags);
  tags.post('/', rbac('admin', 'manager'), validate(CreateTagSchema), controller.createTag);
  tags.put('/:id', rbac('admin', 'manager'), validate(UpdateTagSchema), controller.updateTag);
  tags.delete('/:id', rbac('admin', 'manager'), controller.deleteTag);

  // ============================================================
  // Clients
  // ============================================================

  const clients = Router();
  clients.get('/', controller.listClients);
  clients.post('/', rbac('admin', 'manager'), validate(CreateClientSchema), controller.createClient);
  clients.post('/bulk', rbac('admin', 'manager'), validate(BulkCreateClientsSchema), controller.bulkCreateClients);
  clients.put('/:id', rbac('admin', 'manager'), validate(UpdateClientSchema), controller.updateClient);
  clients.delete('/:id', rbac('admin', 'manager'), controller.deleteClient);

  return { teams, roles, skills, tags, clients };
}
