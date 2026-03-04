import { DataSource } from 'typeorm';
import { AssignmentEntity } from './assignments.entity.js';
import { BusinessException } from '../../common/business-exception.js';
import {
  applyCursorPagination,
  buildPaginatedResult,
  PaginationOptions,
  PaginatedResult,
} from '../../common/pagination.js';
import type {
  CreateAssignmentInput,
  UpdateAssignmentInput,
  AssignmentFilter,
} from '@dnvsol/shared';

export class AssignmentsService {
  constructor(private readonly dataSource: DataSource) {}

  // ============================================================
  // List Assignments (with filters + cursor pagination)
  // ============================================================

  async listAssignments(
    accountId: string,
    filter: AssignmentFilter,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const repo = this.dataSource.getRepository(AssignmentEntity);
    const limit = Math.min(filter.limit ?? 50, 200);

    const qb = repo
      .createQueryBuilder('assignment')
      .where('assignment.account_id = :accountId', { accountId });

    // Left join person for name
    qb.leftJoin(
      'people',
      'person',
      'person.id = assignment.person_id',
    );
    qb.addSelect('person.first_name', 'person_first_name');
    qb.addSelect('person.last_name', 'person_last_name');

    // Left join project for name
    qb.leftJoin(
      'projects',
      'project',
      'project.id = assignment.project_id',
    );
    qb.addSelect('project.name', 'project_name');

    // Filters
    if (filter.personId) {
      qb.andWhere('assignment.person_id = :personId', { personId: filter.personId });
    }

    if (filter.projectId) {
      qb.andWhere('assignment.project_id = :projectId', { projectId: filter.projectId });
    }

    if (filter.roleId) {
      qb.andWhere('assignment.role_id = :roleId', { roleId: filter.roleId });
    }

    if (filter.phaseId) {
      qb.andWhere('assignment.phase_id = :phaseId', { phaseId: filter.phaseId });
    }

    if (filter.isBillable !== undefined) {
      qb.andWhere('assignment.is_billable = :isBillable', { isBillable: filter.isBillable });
    }

    // Date range overlap: assignment overlaps [startDate, endDate]
    if (filter.startDate) {
      qb.andWhere('assignment.end_date >= :filterStart', { filterStart: filter.startDate });
    }
    if (filter.endDate) {
      qb.andWhere('assignment.start_date <= :filterEnd', { filterEnd: filter.endDate });
    }

    const paginationOptions: PaginationOptions = {
      cursor: filter.cursor,
      limit,
      sortBy: filter.sortBy,
      sortOrder: filter.sortDirection === 'desc' ? 'DESC' : 'ASC',
    };

    applyCursorPagination(qb, paginationOptions, 'assignment');

    const rows = await qb.getRawAndEntities();

    // Merge raw join columns onto entities
    const data = rows.entities.map((entity, i) => {
      const raw = rows.raw[i];
      return {
        ...entity,
        personFirstName: raw?.person_first_name ?? null,
        personLastName: raw?.person_last_name ?? null,
        projectName: raw?.project_name ?? null,
      };
    });

    const hasMore = data.length > limit;
    const sliced = hasMore ? data.slice(0, limit) : data;
    const lastItem = sliced[sliced.length - 1] as (typeof sliced)[number] | undefined;
    const sortKey = paginationOptions.sortBy ?? 'createdAt';

    const cursor = lastItem
      ? Buffer.from(
          JSON.stringify({
            value: (lastItem as Record<string, unknown>)[sortKey],
            id: lastItem.id,
          }),
        ).toString('base64url')
      : null;

    return {
      data: sliced,
      meta: { cursor, hasMore },
    };
  }

  // ============================================================
  // Create Assignment (with optional repeat generation)
  // ============================================================

  async createAssignment(
    accountId: string,
    dto: CreateAssignmentInput,
  ): Promise<AssignmentEntity[]> {
    const repo = this.dataSource.getRepository(AssignmentEntity);

    // Validate person exists in account
    const personRows = await this.dataSource.query(
      `SELECT id FROM people WHERE id = ? AND account_id = ?`,
      [dto.personId, accountId],
    );
    if (!personRows || personRows.length === 0) {
      throw BusinessException.notFound('Person', dto.personId);
    }

    // Validate project exists in account
    const projectRows = await this.dataSource.query(
      `SELECT id FROM projects WHERE id = ? AND account_id = ?`,
      [dto.projectId, accountId],
    );
    if (!projectRows || projectRows.length === 0) {
      throw BusinessException.notFound('Project', dto.projectId);
    }

    // Create primary assignment
    const primary = repo.create({
      accountId,
      personId: dto.personId,
      projectId: dto.projectId,
      roleId: dto.roleId,
      phaseId: dto.phaseId ?? null,
      startDate: dto.startDate,
      endDate: dto.endDate,
      minutesPerDay: dto.minutesPerDay,
      isBillable: dto.isBillable ?? true,
      isNonWorkingDay: dto.isNonWorkingDay ?? false,
      note: dto.note ?? null,
      version: 1,
    });

    const saved = await repo.save(primary);

    // Generate repeats if requested
    const repeats = this.generateRepeats(dto, accountId);
    const savedRepeats: AssignmentEntity[] = [];
    if (repeats.length > 0) {
      for (const repeat of repeats) {
        const savedRepeat = await repo.save(repeat);
        savedRepeats.push(savedRepeat);
      }
    }

    return [saved, ...savedRepeats];
  }

  // ============================================================
  // Get Assignment
  // ============================================================

  async getAssignment(
    accountId: string,
    assignmentId: string,
  ): Promise<Record<string, unknown>> {
    const repo = this.dataSource.getRepository(AssignmentEntity);

    const assignment = await repo.findOne({
      where: { id: assignmentId, accountId },
    });
    if (!assignment) throw BusinessException.notFound('Assignment', assignmentId);

    // Fetch person info
    const personRows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT first_name, last_name FROM people WHERE id = ?`,
      [assignment.personId],
    );

    // Fetch project info
    const projectRows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT name FROM projects WHERE id = ?`,
      [assignment.projectId],
    );

    return {
      ...assignment,
      personFirstName: personRows[0]?.first_name ?? null,
      personLastName: personRows[0]?.last_name ?? null,
      projectName: projectRows[0]?.name ?? null,
    };
  }

  // ============================================================
  // Update Assignment (with optimistic locking)
  // ============================================================

  async updateAssignment(
    accountId: string,
    assignmentId: string,
    dto: UpdateAssignmentInput,
    expectedVersion?: number,
  ): Promise<AssignmentEntity> {
    const repo = this.dataSource.getRepository(AssignmentEntity);

    const assignment = await repo.findOne({
      where: { id: assignmentId, accountId },
    });
    if (!assignment) throw BusinessException.notFound('Assignment', assignmentId);

    // Optimistic locking check
    if (expectedVersion !== undefined && assignment.version !== expectedVersion) {
      throw BusinessException.versionConflict();
    }

    if (dto.roleId !== undefined) assignment.roleId = dto.roleId;
    if (dto.phaseId !== undefined) assignment.phaseId = dto.phaseId ?? null;
    if (dto.startDate !== undefined) assignment.startDate = dto.startDate;
    if (dto.endDate !== undefined) assignment.endDate = dto.endDate;
    if (dto.minutesPerDay !== undefined) assignment.minutesPerDay = dto.minutesPerDay;
    if (dto.isBillable !== undefined) assignment.isBillable = dto.isBillable;
    if (dto.isNonWorkingDay !== undefined) assignment.isNonWorkingDay = dto.isNonWorkingDay;
    if (dto.note !== undefined) assignment.note = dto.note ?? null;

    // Increment version
    assignment.version += 1;

    return repo.save(assignment);
  }

  // ============================================================
  // Delete Assignment
  // ============================================================

  async deleteAssignment(accountId: string, assignmentId: string): Promise<void> {
    const repo = this.dataSource.getRepository(AssignmentEntity);

    const assignment = await repo.findOne({
      where: { id: assignmentId, accountId },
    });
    if (!assignment) throw BusinessException.notFound('Assignment', assignmentId);

    await repo.remove(assignment);
  }

  // ============================================================
  // Split Assignment
  // ============================================================

  async splitAssignment(
    accountId: string,
    assignmentId: string,
    splitDate: string,
  ): Promise<{ original: AssignmentEntity; newAssignment: AssignmentEntity }> {
    const repo = this.dataSource.getRepository(AssignmentEntity);

    const assignment = await repo.findOne({
      where: { id: assignmentId, accountId },
    });
    if (!assignment) throw BusinessException.notFound('Assignment', assignmentId);

    // Validate splitDate is within the assignment range (exclusive of start and end)
    const split = new Date(splitDate);
    const start = new Date(assignment.startDate);
    const end = new Date(assignment.endDate);

    if (split <= start || split > end) {
      throw BusinessException.businessRule(
        'Split date must be after the assignment start date and on or before the end date',
        { splitDate, startDate: assignment.startDate, endDate: assignment.endDate },
      );
    }

    // Calculate day before splitDate for original end
    const dayBefore = new Date(split);
    dayBefore.setDate(dayBefore.getDate() - 1);
    const dayBeforeStr = dayBefore.toISOString().split('T')[0];

    // Update original: ends day before splitDate
    assignment.endDate = dayBeforeStr;
    assignment.version += 1;
    const updatedOriginal = await repo.save(assignment);

    // Create new: starts at splitDate with same properties
    const newAssignment = repo.create({
      accountId: assignment.accountId,
      personId: assignment.personId,
      projectId: assignment.projectId,
      roleId: assignment.roleId,
      phaseId: assignment.phaseId,
      startDate: splitDate,
      endDate: end.toISOString().split('T')[0],
      minutesPerDay: assignment.minutesPerDay,
      isBillable: assignment.isBillable,
      isNonWorkingDay: assignment.isNonWorkingDay,
      note: assignment.note,
      version: 1,
    });
    const savedNew = await repo.save(newAssignment);

    return { original: updatedOriginal, newAssignment: savedNew };
  }

  // ============================================================
  // Transfer Assignment
  // ============================================================

  async transferAssignment(
    accountId: string,
    assignmentId: string,
    newProjectId: string,
  ): Promise<AssignmentEntity> {
    const repo = this.dataSource.getRepository(AssignmentEntity);

    const assignment = await repo.findOne({
      where: { id: assignmentId, accountId },
    });
    if (!assignment) throw BusinessException.notFound('Assignment', assignmentId);

    // Validate new project exists in account
    const projectRows = await this.dataSource.query(
      `SELECT id FROM projects WHERE id = ? AND account_id = ?`,
      [newProjectId, accountId],
    );
    if (!projectRows || projectRows.length === 0) {
      throw BusinessException.notFound('Project', newProjectId);
    }

    assignment.projectId = newProjectId;
    assignment.version += 1;

    return repo.save(assignment);
  }

  // ============================================================
  // Clone Assignment
  // ============================================================

  async cloneAssignment(
    accountId: string,
    assignmentId: string,
    overrides?: Partial<CreateAssignmentInput>,
  ): Promise<AssignmentEntity> {
    const repo = this.dataSource.getRepository(AssignmentEntity);

    const assignment = await repo.findOne({
      where: { id: assignmentId, accountId },
    });
    if (!assignment) throw BusinessException.notFound('Assignment', assignmentId);

    const clone = repo.create({
      accountId,
      personId: overrides?.personId ?? assignment.personId,
      projectId: overrides?.projectId ?? assignment.projectId,
      roleId: overrides?.roleId ?? assignment.roleId,
      phaseId: overrides?.phaseId !== undefined ? (overrides.phaseId ?? null) : assignment.phaseId,
      startDate: overrides?.startDate ?? assignment.startDate,
      endDate: overrides?.endDate ?? assignment.endDate,
      minutesPerDay: overrides?.minutesPerDay ?? assignment.minutesPerDay,
      isBillable: overrides?.isBillable ?? assignment.isBillable,
      isNonWorkingDay: overrides?.isNonWorkingDay ?? assignment.isNonWorkingDay,
      note: overrides?.note !== undefined ? (overrides.note ?? null) : assignment.note,
      version: 1,
    });

    return repo.save(clone);
  }

  // ============================================================
  // Private: Generate Repeat Assignments
  // ============================================================

  private generateRepeats(dto: CreateAssignmentInput, accountId: string): AssignmentEntity[] {
    if (!dto.repeatFrequency) return [];

    const repo = this.dataSource.getRepository(AssignmentEntity);
    const repeats: AssignmentEntity[] = [];

    const originalStart = new Date(dto.startDate);
    const originalEnd = new Date(dto.endDate);
    const durationMs = originalEnd.getTime() - originalStart.getTime();

    const maxIterations = dto.repeatCount ?? 52; // safety cap at ~1 year of weekly
    const repeatEndDate = dto.repeatEndDate ? new Date(dto.repeatEndDate) : null;

    let currentStart = new Date(originalStart);
    let count = 0;

    while (count < maxIterations) {
      // Advance to next repeat start
      switch (dto.repeatFrequency) {
        case 'weekly':
          currentStart.setDate(currentStart.getDate() + 7);
          break;
        case 'biweekly':
          currentStart.setDate(currentStart.getDate() + 14);
          break;
        case 'monthly':
          currentStart.setMonth(currentStart.getMonth() + 1);
          break;
      }

      // Calculate end date preserving original duration
      const currentEnd = new Date(currentStart.getTime() + durationMs);

      // Stop if past repeatEndDate
      if (repeatEndDate && currentStart > repeatEndDate) break;

      const repeat = repo.create({
        accountId,
        personId: dto.personId,
        projectId: dto.projectId,
        roleId: dto.roleId,
        phaseId: dto.phaseId ?? null,
        startDate: currentStart.toISOString().split('T')[0],
        endDate: currentEnd.toISOString().split('T')[0],
        minutesPerDay: dto.minutesPerDay,
        isBillable: dto.isBillable ?? true,
        isNonWorkingDay: dto.isNonWorkingDay ?? false,
        note: dto.note ?? null,
        version: 1,
      });

      repeats.push(repeat);
      count++;

      // If using repeatCount, stop after that many repeats
      if (dto.repeatCount && count >= dto.repeatCount) break;
    }

    return repeats;
  }
}
