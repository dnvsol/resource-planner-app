import { Request, Response, NextFunction } from 'express';
import { OrganizationsService } from './organizations.service.js';
import { success, created, noContent, successPaginated } from '../../common/response.js';
import type { PaginationOptions } from '../../common/pagination.js';

export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  // ============================================================
  // Teams
  // ============================================================

  listTeams = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const options: PaginationOptions = {
        cursor: req.query.cursor as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        sortBy: (req.query.sortBy as string) || undefined,
        sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || undefined,
      };

      const result = await this.service.listTeams(accountId, options);
      successPaginated(res, result.data, result.meta);
    } catch (err) {
      next(err);
    }
  };

  createTeam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const team = await this.service.createTeam(accountId, req.body);
      created(res, team);
    } catch (err) {
      next(err);
    }
  };

  updateTeam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const team = await this.service.updateTeam(req.params.id, accountId, req.body);
      success(res, team);
    } catch (err) {
      next(err);
    }
  };

  deleteTeam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      await this.service.deleteTeam(req.params.id, accountId);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Roles
  // ============================================================

  listRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const options: PaginationOptions = {
        cursor: req.query.cursor as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        sortBy: (req.query.sortBy as string) || undefined,
        sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || undefined,
      };

      const result = await this.service.listRoles(accountId, options);
      successPaginated(res, result.data, result.meta);
    } catch (err) {
      next(err);
    }
  };

  createRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const role = await this.service.createRole(accountId, req.body);
      created(res, role);
    } catch (err) {
      next(err);
    }
  };

  updateRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const role = await this.service.updateRole(req.params.id, accountId, req.body);
      success(res, role);
    } catch (err) {
      next(err);
    }
  };

  deleteRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      await this.service.deleteRole(req.params.id, accountId);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Skills
  // ============================================================

  listSkills = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const options: PaginationOptions = {
        cursor: req.query.cursor as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        sortBy: (req.query.sortBy as string) || undefined,
        sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || undefined,
      };

      const result = await this.service.listSkills(accountId, options);
      successPaginated(res, result.data, result.meta);
    } catch (err) {
      next(err);
    }
  };

  createSkill = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const skill = await this.service.createSkill(accountId, req.body);
      created(res, skill);
    } catch (err) {
      next(err);
    }
  };

  updateSkill = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const skill = await this.service.updateSkill(req.params.id, accountId, req.body);
      success(res, skill);
    } catch (err) {
      next(err);
    }
  };

  deleteSkill = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      await this.service.deleteSkill(req.params.id, accountId);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Tags
  // ============================================================

  listTags = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const entityType = req.query.entityType as string | undefined;
      const options: PaginationOptions = {
        cursor: req.query.cursor as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        sortBy: (req.query.sortBy as string) || undefined,
        sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || undefined,
      };

      const result = await this.service.listTags(accountId, entityType, options);
      successPaginated(res, result.data, result.meta);
    } catch (err) {
      next(err);
    }
  };

  createTag = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const tag = await this.service.createTag(accountId, req.body);
      created(res, tag);
    } catch (err) {
      next(err);
    }
  };

  updateTag = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const tag = await this.service.updateTag(req.params.id, accountId, req.body);
      success(res, tag);
    } catch (err) {
      next(err);
    }
  };

  deleteTag = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      await this.service.deleteTag(req.params.id, accountId);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Clients
  // ============================================================

  listClients = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const options: PaginationOptions = {
        cursor: req.query.cursor as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        sortBy: (req.query.sortBy as string) || undefined,
        sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || undefined,
      };

      const result = await this.service.listClients(accountId, options);
      successPaginated(res, result.data, result.meta);
    } catch (err) {
      next(err);
    }
  };

  createClient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const client = await this.service.createClient(accountId, req.body);
      created(res, client);
    } catch (err) {
      next(err);
    }
  };

  bulkCreateClients = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const clients = await this.service.bulkCreateClients(accountId, req.body.clients);
      created(res, clients);
    } catch (err) {
      next(err);
    }
  };

  updateClient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const client = await this.service.updateClient(req.params.id, accountId, req.body);
      success(res, client);
    } catch (err) {
      next(err);
    }
  };

  deleteClient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      await this.service.deleteClient(req.params.id, accountId);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };
}
