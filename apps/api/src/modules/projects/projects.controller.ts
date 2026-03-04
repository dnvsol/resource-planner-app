import { Request, Response, NextFunction } from 'express';
import { ProjectsService } from './projects.service.js';
import { success, created, noContent, successPaginated } from '../../common/response.js';

export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  // ============================================================
  // List Projects
  // ============================================================

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const filter = req.query as Record<string, unknown>;

      const result = await this.service.listProjects(accountId, filter as never);
      successPaginated(res, result.data, result.meta);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Create Project
  // ============================================================

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const project = await this.service.createProject(accountId, req.body);
      created(res, project);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Get Project By ID
  // ============================================================

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const project = await this.service.getProject(accountId, req.params.id);
      success(res, project);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Update Project
  // ============================================================

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const project = await this.service.updateProject(accountId, req.params.id, req.body);
      success(res, project);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Delete Project
  // ============================================================

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      await this.service.deleteProject(accountId, req.params.id);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Archive Project
  // ============================================================

  archive = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const project = await this.service.archiveProject(accountId, req.params.id);
      success(res, project);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Phases
  // ============================================================

  createPhase = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const phase = await this.service.createPhase(accountId, req.params.id, req.body);
      created(res, phase);
    } catch (err) {
      next(err);
    }
  };

  updatePhase = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const phase = await this.service.updatePhase(accountId, req.params.phaseId, req.body);
      success(res, phase);
    } catch (err) {
      next(err);
    }
  };

  deletePhase = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      await this.service.deletePhase(accountId, req.params.phaseId);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Milestones
  // ============================================================

  createMilestone = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const milestone = await this.service.createMilestone(accountId, req.params.id, req.body);
      created(res, milestone);
    } catch (err) {
      next(err);
    }
  };

  updateMilestone = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const milestone = await this.service.updateMilestone(accountId, req.params.milestoneId, req.body);
      success(res, milestone);
    } catch (err) {
      next(err);
    }
  };

  deleteMilestone = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      await this.service.deleteMilestone(accountId, req.params.milestoneId);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Notes
  // ============================================================

  listNotes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const notes = await this.service.listNotes(accountId, req.params.id);
      success(res, notes);
    } catch (err) {
      next(err);
    }
  };

  createNote = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const userId = (req as any).user.userId;
      const note = await this.service.createNote(accountId, req.params.id, userId, req.body);
      created(res, note);
    } catch (err) {
      next(err);
    }
  };

  deleteNote = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      await this.service.deleteNote(accountId, req.params.noteId);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Tags
  // ============================================================

  addTag = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      await this.service.addTag(accountId, req.params.id, req.params.tagId);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  removeTag = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      await this.service.removeTag(accountId, req.params.id, req.params.tagId);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Managers
  // ============================================================

  addManager = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      await this.service.addManager(accountId, req.params.id, req.params.userId);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  removeManager = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      await this.service.removeManager(accountId, req.params.id, req.params.userId);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Budget Roles
  // ============================================================

  setBudgetRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      await this.service.setBudgetRoles(accountId, req.params.id, req.body.roles ?? req.body);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Other Expenses
  // ============================================================

  listOtherExpenses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const expenses = await this.service.listOtherExpenses(accountId, req.params.id);
      success(res, expenses);
    } catch (err) {
      next(err);
    }
  };

  createOtherExpense = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const expense = await this.service.createOtherExpense(accountId, req.params.id, req.body);
      created(res, expense);
    } catch (err) {
      next(err);
    }
  };

  updateOtherExpense = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const expense = await this.service.updateOtherExpense(accountId, req.params.eid, req.body);
      success(res, expense);
    } catch (err) {
      next(err);
    }
  };

  deleteOtherExpense = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      await this.service.deleteOtherExpense(accountId, req.params.eid);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Project Rates
  // ============================================================

  listProjectRates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const rates = await this.service.listProjectRates(accountId, req.params.id);
      success(res, rates);
    } catch (err) {
      next(err);
    }
  };

  setProjectRates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      await this.service.setProjectRates(accountId, req.params.id, req.body.rates ?? req.body);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  updateProjectRate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const rate = await this.service.updateProjectRate(accountId, req.params.id, req.params.rid, req.body);
      success(res, rate);
    } catch (err) {
      next(err);
    }
  };

  deleteProjectRate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      await this.service.deleteProjectRate(accountId, req.params.id, req.params.rid);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };
}
