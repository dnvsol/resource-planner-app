import { DataSource } from 'typeorm';
import {
  ProjectEntity,
  ProjectPhaseEntity,
  ProjectMilestoneEntity,
  ProjectNoteEntity,
  BudgetRoleEntity,
  ProjectRateEntity,
  OtherExpenseEntity,
} from './projects.entity.js';
import { BusinessException } from '../../common/business-exception.js';
import {
  applyCursorPagination,
  buildPaginatedResult,
  PaginationOptions,
  PaginatedResult,
} from '../../common/pagination.js';
import type {
  CreateProjectInput,
  UpdateProjectInput,
  ProjectFilter,
  CreatePhaseInput,
  UpdatePhaseInput,
  CreateMilestoneInput,
  UpdateMilestoneInput,
  CreateProjectNoteInput,
  BudgetRoleInput,
  CreateOtherExpenseInput,
  UpdateOtherExpenseInput,
  ProjectRateInput,
} from '@dnvsol/shared';

export class ProjectsService {
  constructor(private readonly dataSource: DataSource) {}

  // ============================================================
  // List Projects (with filters + cursor pagination)
  // ============================================================

  async listProjects(accountId: string, filter: ProjectFilter): Promise<PaginatedResult<ProjectEntity>> {
    const repo = this.dataSource.getRepository(ProjectEntity);
    const limit = Math.min(filter.limit ?? 50, 200);

    const qb = repo
      .createQueryBuilder('project')
      .where('project.account_id = :accountId', { accountId });

    // Left join client for client name
    qb.leftJoinAndMapOne(
      'project.client',
      'clients',
      'client',
      'client.id = project.client_id',
    );

    // Filters
    if (filter.state) {
      qb.andWhere('project.state = :state', { state: filter.state });
    }

    if (filter.clientId) {
      qb.andWhere('project.client_id = :clientId', { clientId: filter.clientId });
    }

    if (filter.pricingModel) {
      qb.andWhere('project.pricing_model = :pricingModel', { pricingModel: filter.pricingModel });
    }

    if (filter.search) {
      qb.andWhere(
        `(project.name ILIKE :search)`,
        { search: `%${filter.search}%` },
      );
    }

    if (filter.tags && filter.tags.length > 0) {
      qb.andWhere(
        `project.id IN (SELECT pt.project_id FROM project_tags pt WHERE pt.tag_id IN (:...tagIds))`,
        { tagIds: filter.tags },
      );
    }

    const paginationOptions: PaginationOptions = {
      cursor: filter.cursor,
      limit,
      sortBy: filter.sortBy,
      sortOrder: filter.sortDirection === 'desc' ? 'DESC' : 'ASC',
    };

    applyCursorPagination(qb, paginationOptions, 'project');

    const rows = await qb.getMany();
    return buildPaginatedResult(rows, limit, paginationOptions.sortBy ?? 'createdAt');
  }

  // ============================================================
  // Create Project
  // ============================================================

  async createProject(accountId: string, dto: CreateProjectInput): Promise<ProjectEntity> {
    const repo = this.dataSource.getRepository(ProjectEntity);

    const project = repo.create({
      accountId,
      name: dto.name,
      clientId: dto.clientId ?? null,
      state: dto.state ?? 'active',
      pricingModel: dto.pricingModel ?? 'time_and_materials',
      budgetTotal: dto.budget ?? 0,
      budgetMethod: dto.budgetMethod ?? 'total',
      expensesBudget: dto.expensesBudget ?? 0,
      emoji: dto.emoji ?? null,
      customFields: dto.customFields ?? {},
    });

    const saved = await repo.save(project);

    // Insert tags if provided
    if (dto.tags && dto.tags.length > 0) {
      const values = dto.tags.map((_, i) => `($1, $${i + 2})`).join(', ');
      const params = [saved.id, ...dto.tags];
      await this.dataSource.query(
        `INSERT INTO project_tags (project_id, tag_id) VALUES ${values} ON CONFLICT DO NOTHING`,
        params,
      );
    }

    return saved;
  }

  // ============================================================
  // Get Project (with phases, milestones, notes, tags, managers, budget roles)
  // ============================================================

  async getProject(accountId: string, projectId: string): Promise<Record<string, unknown>> {
    const repo = this.dataSource.getRepository(ProjectEntity);

    const project = await repo.findOne({ where: { id: projectId, accountId } });
    if (!project) throw BusinessException.notFound('Project', projectId);

    // Client info
    const clients: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT c.id, c.name
       FROM clients c
       WHERE c.id = $1`,
      [project.clientId],
    );

    // Phases
    const phases: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT pp.id, pp.name, pp.start_date, pp.end_date, pp.color, pp.sort_order,
              pp.created_at, pp.updated_at
       FROM project_phases pp
       WHERE pp.project_id = $1 AND pp.account_id = $2
       ORDER BY pp.sort_order ASC, pp.created_at ASC`,
      [projectId, accountId],
    );

    // Milestones
    const milestones: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT pm.id, pm.name, pm.date, pm.icon, pm.created_at, pm.updated_at
       FROM project_milestones pm
       WHERE pm.project_id = $1 AND pm.account_id = $2
       ORDER BY pm.date ASC`,
      [projectId, accountId],
    );

    // Recent notes (last 10)
    const notes: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT pn.id, pn.content, pn.user_id, pn.created_at, pn.updated_at,
              u.first_name as author_first_name, u.last_name as author_last_name
       FROM project_notes pn
       LEFT JOIN users u ON u.id = pn.user_id
       WHERE pn.project_id = $1 AND pn.account_id = $2
       ORDER BY pn.created_at DESC
       LIMIT 10`,
      [projectId, accountId],
    );

    // Tags
    const tags: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT pt.tag_id, t.name as tag_name
       FROM project_tags pt
       JOIN tags t ON t.id = pt.tag_id
       WHERE pt.project_id = $1`,
      [projectId],
    );

    // Managers
    const managers: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT pm.user_id, u.first_name, u.last_name, u.email
       FROM project_managers pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1`,
      [projectId],
    );

    // Budget roles
    const budgetRoles: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT br.id, br.role_id, br.budget_minutes, br.estimated_budget,
              r.name as role_name, br.created_at, br.updated_at
       FROM budget_roles br
       JOIN roles r ON r.id = br.role_id
       WHERE br.project_id = $1 AND br.account_id = $2`,
      [projectId, accountId],
    );

    // Project rate overrides
    const projectRates: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT pr.id, pr.role_id, pr.rate_hourly, pr.rate_daily,
              r.name as role_name, pr.created_at, pr.updated_at
       FROM project_rates pr
       JOIN roles r ON r.id = pr.role_id
       WHERE pr.project_id = $1
       ORDER BY r.name ASC`,
      [projectId],
    );

    // Other expenses
    const otherExpenses: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT id, description, amount, date, is_charge, created_at, updated_at
       FROM project_other_expenses
       WHERE project_id = $1 AND account_id = $2
       ORDER BY date ASC`,
      [projectId, accountId],
    );

    return {
      ...project,
      client: clients[0] ?? null,
      phases,
      milestones,
      recentNotes: notes,
      tags,
      managers,
      budgetRoles,
      projectRates,
      otherExpenses,
    };
  }

  // ============================================================
  // Update Project
  // ============================================================

  async updateProject(accountId: string, projectId: string, dto: UpdateProjectInput): Promise<ProjectEntity> {
    const repo = this.dataSource.getRepository(ProjectEntity);

    const project = await repo.findOne({ where: { id: projectId, accountId } });
    if (!project) throw BusinessException.notFound('Project', projectId);

    if (dto.name !== undefined) project.name = dto.name;
    if (dto.clientId !== undefined) project.clientId = dto.clientId ?? null;
    if (dto.state !== undefined) project.state = dto.state;
    if (dto.pricingModel !== undefined) project.pricingModel = dto.pricingModel;
    if (dto.budget !== undefined) project.budgetTotal = dto.budget ?? 0;
    if (dto.budgetMethod !== undefined) project.budgetMethod = dto.budgetMethod;
    if (dto.expensesBudget !== undefined) project.expensesBudget = dto.expensesBudget ?? 0;
    if (dto.emoji !== undefined) project.emoji = dto.emoji ?? null;
    if (dto.customFields !== undefined) project.customFields = dto.customFields;

    const saved = await repo.save(project);

    // Replace tags if provided
    if (dto.tags !== undefined) {
      await this.dataSource.query(`DELETE FROM project_tags WHERE project_id = $1`, [projectId]);
      if (dto.tags.length > 0) {
        const values = dto.tags.map((_, i) => `($1, $${i + 2})`).join(', ');
        const params = [projectId, ...dto.tags];
        await this.dataSource.query(
          `INSERT INTO project_tags (project_id, tag_id) VALUES ${values} ON CONFLICT DO NOTHING`,
          params,
        );
      }
    }

    return saved;
  }

  // ============================================================
  // Delete Project (BIZ-004: check no assignments)
  // ============================================================

  async deleteProject(accountId: string, projectId: string): Promise<void> {
    const repo = this.dataSource.getRepository(ProjectEntity);

    const project = await repo.findOne({ where: { id: projectId, accountId } });
    if (!project) throw BusinessException.notFound('Project', projectId);

    // Check no active assignments
    const result = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM assignments
       WHERE project_id = $1
         AND start_date <= CURRENT_DATE
         AND end_date >= CURRENT_DATE`,
      [projectId],
    );

    if (result[0] && parseInt(result[0].count, 10) > 0) {
      throw BusinessException.deleteBlocked(
        `Cannot delete project: ${result[0].count} active assignments exist`,
        { projectId, assignmentCount: parseInt(result[0].count, 10) },
      );
    }

    await repo.remove(project);
  }

  // ============================================================
  // Archive Project
  // ============================================================

  async archiveProject(accountId: string, projectId: string): Promise<ProjectEntity> {
    const repo = this.dataSource.getRepository(ProjectEntity);

    const project = await repo.findOne({ where: { id: projectId, accountId } });
    if (!project) throw BusinessException.notFound('Project', projectId);

    project.state = 'archived';
    return repo.save(project);
  }

  // ============================================================
  // Phases
  // ============================================================

  async createPhase(accountId: string, projectId: string, dto: CreatePhaseInput): Promise<ProjectPhaseEntity> {
    // Verify project exists in this account
    const project = await this.dataSource.getRepository(ProjectEntity).findOne({
      where: { id: projectId, accountId },
    });
    if (!project) throw BusinessException.notFound('Project', projectId);

    const repo = this.dataSource.getRepository(ProjectPhaseEntity);
    const phase = repo.create({
      accountId,
      projectId,
      name: dto.name,
      startDate: dto.startDate ?? null,
      endDate: dto.endDate ?? null,
      color: dto.color ?? '#67D0D5',
      sortOrder: dto.sortOrder ?? 0,
    });
    return repo.save(phase);
  }

  async updatePhase(accountId: string, phaseId: string, dto: UpdatePhaseInput): Promise<ProjectPhaseEntity> {
    const repo = this.dataSource.getRepository(ProjectPhaseEntity);

    const phase = await repo.findOne({ where: { id: phaseId, accountId } });
    if (!phase) throw BusinessException.notFound('ProjectPhase', phaseId);

    if (dto.name !== undefined) phase.name = dto.name;
    if (dto.startDate !== undefined) phase.startDate = dto.startDate ?? null;
    if (dto.endDate !== undefined) phase.endDate = dto.endDate ?? null;
    if (dto.color !== undefined) phase.color = dto.color;
    if (dto.sortOrder !== undefined) phase.sortOrder = dto.sortOrder;

    return repo.save(phase);
  }

  async deletePhase(accountId: string, phaseId: string): Promise<void> {
    const repo = this.dataSource.getRepository(ProjectPhaseEntity);

    const phase = await repo.findOne({ where: { id: phaseId, accountId } });
    if (!phase) throw BusinessException.notFound('ProjectPhase', phaseId);

    await repo.remove(phase);
  }

  // ============================================================
  // Milestones
  // ============================================================

  async createMilestone(accountId: string, projectId: string, dto: CreateMilestoneInput): Promise<ProjectMilestoneEntity> {
    // Verify project exists in this account
    const project = await this.dataSource.getRepository(ProjectEntity).findOne({
      where: { id: projectId, accountId },
    });
    if (!project) throw BusinessException.notFound('Project', projectId);

    const repo = this.dataSource.getRepository(ProjectMilestoneEntity);
    const milestone = repo.create({
      accountId,
      projectId,
      name: dto.name,
      date: dto.date,
      icon: dto.icon ?? null,
    });
    return repo.save(milestone);
  }

  async updateMilestone(accountId: string, milestoneId: string, dto: UpdateMilestoneInput): Promise<ProjectMilestoneEntity> {
    const repo = this.dataSource.getRepository(ProjectMilestoneEntity);

    const milestone = await repo.findOne({ where: { id: milestoneId, accountId } });
    if (!milestone) throw BusinessException.notFound('ProjectMilestone', milestoneId);

    if (dto.name !== undefined) milestone.name = dto.name;
    if (dto.date !== undefined) milestone.date = dto.date;
    if (dto.icon !== undefined) milestone.icon = dto.icon ?? null;

    return repo.save(milestone);
  }

  async deleteMilestone(accountId: string, milestoneId: string): Promise<void> {
    const repo = this.dataSource.getRepository(ProjectMilestoneEntity);

    const milestone = await repo.findOne({ where: { id: milestoneId, accountId } });
    if (!milestone) throw BusinessException.notFound('ProjectMilestone', milestoneId);

    await repo.remove(milestone);
  }

  // ============================================================
  // Notes
  // ============================================================

  async listNotes(accountId: string, projectId: string): Promise<ProjectNoteEntity[]> {
    // Verify project exists in this account
    const project = await this.dataSource.getRepository(ProjectEntity).findOne({
      where: { id: projectId, accountId },
    });
    if (!project) throw BusinessException.notFound('Project', projectId);

    const repo = this.dataSource.getRepository(ProjectNoteEntity);
    return repo.find({
      where: { projectId, accountId },
      order: { createdAt: 'DESC' },
    });
  }

  async createNote(
    accountId: string,
    projectId: string,
    userId: string | null,
    dto: CreateProjectNoteInput,
  ): Promise<ProjectNoteEntity> {
    // Verify project exists in this account
    const project = await this.dataSource.getRepository(ProjectEntity).findOne({
      where: { id: projectId, accountId },
    });
    if (!project) throw BusinessException.notFound('Project', projectId);

    const repo = this.dataSource.getRepository(ProjectNoteEntity);
    const note = repo.create({
      accountId,
      projectId,
      userId,
      content: dto.content,
    });
    return repo.save(note);
  }

  async deleteNote(accountId: string, noteId: string): Promise<void> {
    const repo = this.dataSource.getRepository(ProjectNoteEntity);

    const note = await repo.findOne({ where: { id: noteId, accountId } });
    if (!note) throw BusinessException.notFound('ProjectNote', noteId);

    await repo.remove(note);
  }

  // ============================================================
  // Tags
  // ============================================================

  async addTag(accountId: string, projectId: string, tagId: string): Promise<void> {
    // Verify project exists in this account
    const project = await this.dataSource.getRepository(ProjectEntity).findOne({
      where: { id: projectId, accountId },
    });
    if (!project) throw BusinessException.notFound('Project', projectId);

    await this.dataSource.query(
      `INSERT INTO project_tags (project_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [projectId, tagId],
    );
  }

  async removeTag(accountId: string, projectId: string, tagId: string): Promise<void> {
    // Verify project exists in this account
    const project = await this.dataSource.getRepository(ProjectEntity).findOne({
      where: { id: projectId, accountId },
    });
    if (!project) throw BusinessException.notFound('Project', projectId);

    await this.dataSource.query(
      `DELETE FROM project_tags WHERE project_id = $1 AND tag_id = $2`,
      [projectId, tagId],
    );
  }

  // ============================================================
  // Managers
  // ============================================================

  async addManager(accountId: string, projectId: string, userId: string): Promise<void> {
    // Verify project exists in this account
    const project = await this.dataSource.getRepository(ProjectEntity).findOne({
      where: { id: projectId, accountId },
    });
    if (!project) throw BusinessException.notFound('Project', projectId);

    // Verify user exists in this account
    const user = await this.dataSource.query(
      `SELECT id FROM users WHERE id = $1 AND account_id = $2`,
      [userId, accountId],
    );
    if (!user || user.length === 0) throw BusinessException.notFound('User', userId);

    await this.dataSource.query(
      `INSERT INTO project_managers (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [projectId, userId],
    );
  }

  async removeManager(accountId: string, projectId: string, userId: string): Promise<void> {
    // Verify project exists in this account
    const project = await this.dataSource.getRepository(ProjectEntity).findOne({
      where: { id: projectId, accountId },
    });
    if (!project) throw BusinessException.notFound('Project', projectId);

    await this.dataSource.query(
      `DELETE FROM project_managers WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId],
    );
  }

  // ============================================================
  // Budget Roles
  // ============================================================

  async setBudgetRoles(accountId: string, projectId: string, roles: BudgetRoleInput[]): Promise<void> {
    // Verify project exists in this account
    const project = await this.dataSource.getRepository(ProjectEntity).findOne({
      where: { id: projectId, accountId },
    });
    if (!project) throw BusinessException.notFound('Project', projectId);

    // Replace all budget roles for this project
    await this.dataSource.query(
      `DELETE FROM budget_roles WHERE project_id = $1 AND account_id = $2`,
      [projectId, accountId],
    );

    if (roles.length > 0) {
      const values = roles
        .map((_, i) => `($1, $2, $${i * 3 + 3}, $${i * 3 + 4}, $${i * 3 + 5})`)
        .join(', ');
      const params: (string | number)[] = [accountId, projectId];
      for (const role of roles) {
        params.push(role.roleId, role.estimatedMinutes ?? 0, role.estimatedBudget ?? 0);
      }
      await this.dataSource.query(
        `INSERT INTO budget_roles (account_id, project_id, role_id, budget_minutes, estimated_budget) VALUES ${values}`,
        params,
      );
    }
  }

  // ============================================================
  // Other Expenses
  // ============================================================

  async listOtherExpenses(accountId: string, projectId: string): Promise<OtherExpenseEntity[]> {
    const project = await this.dataSource.getRepository(ProjectEntity).findOne({
      where: { id: projectId, accountId },
    });
    if (!project) throw BusinessException.notFound('Project', projectId);

    const repo = this.dataSource.getRepository(OtherExpenseEntity);
    return repo.find({
      where: { projectId, accountId },
      order: { date: 'ASC' },
    });
  }

  async createOtherExpense(
    accountId: string,
    projectId: string,
    dto: CreateOtherExpenseInput,
  ): Promise<OtherExpenseEntity> {
    const project = await this.dataSource.getRepository(ProjectEntity).findOne({
      where: { id: projectId, accountId },
    });
    if (!project) throw BusinessException.notFound('Project', projectId);

    const repo = this.dataSource.getRepository(OtherExpenseEntity);
    const expense = repo.create({
      accountId,
      projectId,
      description: dto.description,
      amount: dto.amount,
      date: dto.date,
      isCharge: dto.isCharge ?? true,
    });

    return repo.save(expense);
  }

  async updateOtherExpense(
    accountId: string,
    expenseId: string,
    dto: UpdateOtherExpenseInput,
  ): Promise<OtherExpenseEntity> {
    const repo = this.dataSource.getRepository(OtherExpenseEntity);
    const expense = await repo.findOne({ where: { id: expenseId, accountId } });
    if (!expense) throw BusinessException.notFound('OtherExpense', expenseId);

    if (dto.description !== undefined) expense.description = dto.description;
    if (dto.amount !== undefined) expense.amount = dto.amount;
    if (dto.date !== undefined) expense.date = dto.date;
    if (dto.isCharge !== undefined) expense.isCharge = dto.isCharge;

    return repo.save(expense);
  }

  async deleteOtherExpense(accountId: string, expenseId: string): Promise<void> {
    const repo = this.dataSource.getRepository(OtherExpenseEntity);
    const expense = await repo.findOne({ where: { id: expenseId, accountId } });
    if (!expense) throw BusinessException.notFound('OtherExpense', expenseId);

    await repo.remove(expense);
  }

  // ============================================================
  // Project Rates
  // ============================================================

  async listProjectRates(accountId: string, projectId: string): Promise<ProjectRateEntity[]> {
    const project = await this.dataSource.getRepository(ProjectEntity).findOne({
      where: { id: projectId, accountId },
    });
    if (!project) throw BusinessException.notFound('Project', projectId);

    return this.dataSource.getRepository(ProjectRateEntity).find({
      where: { projectId },
      order: { createdAt: 'ASC' },
    });
  }

  async setProjectRates(
    accountId: string,
    projectId: string,
    rates: ProjectRateInput[],
  ): Promise<void> {
    const project = await this.dataSource.getRepository(ProjectEntity).findOne({
      where: { id: projectId, accountId },
    });
    if (!project) throw BusinessException.notFound('Project', projectId);

    // Replace all project rates (bulk upsert via delete + insert)
    await this.dataSource.query(
      `DELETE FROM project_rates WHERE project_id = $1`,
      [projectId],
    );

    if (rates.length > 0) {
      const values = rates
        .map((_, i) => `($1, $${i * 3 + 2}, $${i * 3 + 3}, $${i * 3 + 4})`)
        .join(', ');
      const params: (string | number)[] = [projectId];
      for (const rate of rates) {
        params.push(rate.roleId, rate.rateHourly ?? 0, rate.rateDaily ?? 0);
      }
      await this.dataSource.query(
        `INSERT INTO project_rates (project_id, role_id, rate_hourly, rate_daily) VALUES ${values}`,
        params,
      );
    }
  }

  async updateProjectRate(
    accountId: string,
    projectId: string,
    rateId: string,
    dto: { rateHourly?: number; rateDaily?: number },
  ): Promise<ProjectRateEntity> {
    const project = await this.dataSource.getRepository(ProjectEntity).findOne({
      where: { id: projectId, accountId },
    });
    if (!project) throw BusinessException.notFound('Project', projectId);

    const repo = this.dataSource.getRepository(ProjectRateEntity);
    const rate = await repo.findOne({ where: { id: rateId, projectId } });
    if (!rate) throw BusinessException.notFound('ProjectRate', rateId);

    if (dto.rateHourly !== undefined) rate.rateHourly = dto.rateHourly;
    if (dto.rateDaily !== undefined) rate.rateDaily = dto.rateDaily;

    return repo.save(rate);
  }

  async deleteProjectRate(accountId: string, projectId: string, rateId: string): Promise<void> {
    const project = await this.dataSource.getRepository(ProjectEntity).findOne({
      where: { id: projectId, accountId },
    });
    if (!project) throw BusinessException.notFound('Project', projectId);

    const repo = this.dataSource.getRepository(ProjectRateEntity);
    const rate = await repo.findOne({ where: { id: rateId, projectId } });
    if (!rate) throw BusinessException.notFound('ProjectRate', rateId);

    await repo.remove(rate);
  }
}
