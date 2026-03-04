import { Request, Response, NextFunction } from 'express';
import { PeopleService } from './people.service.js';
import { success, created, noContent, successPaginated } from '../../common/response.js';

export class PeopleController {
  constructor(private readonly service: PeopleService) {}

  // ============================================================
  // List People
  // ============================================================

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const filter = req.query as Record<string, unknown>;

      const result = await this.service.listPeople(accountId, filter as never);
      successPaginated(res, result.data, result.meta);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Create Person
  // ============================================================

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const person = await this.service.createPerson(accountId, req.body);
      created(res, person);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Get Person By ID
  // ============================================================

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const person = await this.service.getPerson(accountId, req.params.id);
      success(res, person);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Update Person
  // ============================================================

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const person = await this.service.updatePerson(accountId, req.params.id, req.body);
      success(res, person);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Delete Person
  // ============================================================

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      await this.service.deletePerson(accountId, req.params.id);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Archive / Unarchive
  // ============================================================

  archive = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const person = await this.service.archivePerson(accountId, req.params.id);
      success(res, person);
    } catch (err) {
      next(err);
    }
  };

  unarchive = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const person = await this.service.unarchivePerson(accountId, req.params.id);
      success(res, person);
    } catch (err) {
      next(err);
    }
  };

  // ============================================================
  // Bulk Update
  // ============================================================

  bulkUpdate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      const people = await this.service.bulkUpdatePeople(accountId, req.body);
      success(res, people);
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
  // Skills
  // ============================================================

  setSkills = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      await this.service.setSkills(accountId, req.params.id, req.body.skills ?? req.body);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  addSkill = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      await this.service.addSkill(accountId, req.params.id, req.body);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  removeSkill = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = (req as any).user.accountId;
      await this.service.removeSkill(accountId, req.params.id, req.params.skillId);
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
}
