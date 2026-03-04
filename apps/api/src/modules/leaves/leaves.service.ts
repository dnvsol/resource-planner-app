import { DataSource } from 'typeorm';
import { ScheduledLeaveEntity } from './leaves.entity.js';
import { PersonEntity } from '../people/people.entity.js';
import { BusinessException } from '../../common/business-exception.js';
import {
  applyCursorPagination,
  buildPaginatedResult,
  PaginationOptions,
  PaginatedResult,
} from '../../common/pagination.js';
import type {
  CreateLeaveInput,
  UpdateLeaveInput,
  BulkCreateLeaveInput,
  BulkDeleteLeaveInput,
  LeaveFilter,
} from '@dnvsol/shared';

// ============================================================
// Leave-type mapping: shared schema <-> DB enum
// ============================================================

const LEAVE_TYPE_TO_DB: Record<string, 'scheduled_leave' | 'public_holiday' | 'rostered_day_off'> = {
  leave: 'scheduled_leave',
  holiday: 'public_holiday',
  rostered_off: 'rostered_day_off',
};

const LEAVE_TYPE_FROM_DB: Record<string, string> = {
  scheduled_leave: 'leave',
  public_holiday: 'holiday',
  rostered_day_off: 'rostered_off',
};

function mapLeaveTypeToDb(type: string): 'scheduled_leave' | 'public_holiday' | 'rostered_day_off' {
  return LEAVE_TYPE_TO_DB[type] ?? 'scheduled_leave';
}

/** Convert a DB entity to API-facing shape (leaveType + note mapping) */
function toApiShape(entity: ScheduledLeaveEntity): Record<string, unknown> {
  return {
    id: entity.id,
    accountId: entity.accountId,
    personId: entity.personId,
    startDate: entity.startDate,
    endDate: entity.endDate,
    minutesPerDay: entity.minutesPerDay,
    leaveType: LEAVE_TYPE_FROM_DB[entity.leaveType] ?? entity.leaveType,
    note: entity.description,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

export class LeavesService {
  constructor(private readonly dataSource: DataSource) {}

  // ============================================================
  // List Leaves (with filters + cursor pagination)
  // ============================================================

  async listLeaves(accountId: string, filter: LeaveFilter): Promise<PaginatedResult<Record<string, unknown>>> {
    const repo = this.dataSource.getRepository(ScheduledLeaveEntity);
    const limit = Math.min(filter.limit ?? 50, 200);

    const qb = repo
      .createQueryBuilder('leave')
      .where('leave.account_id = :accountId', { accountId });

    // Filters
    if (filter.personId) {
      qb.andWhere('leave.person_id = :personId', { personId: filter.personId });
    }

    if (filter.leaveType) {
      const dbType = mapLeaveTypeToDb(filter.leaveType);
      qb.andWhere('leave.leave_type = :leaveType', { leaveType: dbType });
    }

    // Date range overlap: leave overlaps [filterStart, filterEnd]
    if (filter.startDate) {
      qb.andWhere('leave.end_date >= :filterStart', { filterStart: filter.startDate });
    }
    if (filter.endDate) {
      qb.andWhere('leave.start_date <= :filterEnd', { filterEnd: filter.endDate });
    }

    const paginationOptions: PaginationOptions = {
      cursor: filter.cursor,
      limit,
      sortBy: filter.sortBy,
      sortOrder: filter.sortDirection === 'desc' ? 'DESC' : 'ASC',
    };

    applyCursorPagination(qb, paginationOptions, 'leave');

    const rows = await qb.getMany();
    const mapped = rows.map(toApiShape) as (Record<string, unknown> & { id: string })[];
    return buildPaginatedResult(mapped, limit, paginationOptions.sortBy ?? 'createdAt');
  }

  // ============================================================
  // Create Leave
  // ============================================================

  async createLeave(accountId: string, dto: CreateLeaveInput): Promise<Record<string, unknown>> {
    // Validate person exists in this account
    const person = await this.dataSource.getRepository(PersonEntity).findOne({
      where: { id: dto.personId, accountId },
    });
    if (!person) throw BusinessException.notFound('Person', dto.personId);

    // Check for overlapping leaves for the same person
    await this.checkOverlap(dto.personId, dto.startDate, dto.endDate);

    const repo = this.dataSource.getRepository(ScheduledLeaveEntity);
    const leave = repo.create({
      accountId,
      personId: dto.personId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      minutesPerDay: dto.minutesPerDay ?? 480,
      leaveType: mapLeaveTypeToDb(dto.leaveType ?? 'leave'),
      description: dto.note ?? null,
    });

    const saved = await repo.save(leave);
    return toApiShape(saved);
  }

  // ============================================================
  // Get Leave
  // ============================================================

  async getLeave(accountId: string, leaveId: string): Promise<Record<string, unknown>> {
    const repo = this.dataSource.getRepository(ScheduledLeaveEntity);

    const leave = await repo.findOne({ where: { id: leaveId, accountId } });
    if (!leave) throw BusinessException.notFound('ScheduledLeave', leaveId);

    return toApiShape(leave);
  }

  // ============================================================
  // Update Leave
  // ============================================================

  async updateLeave(accountId: string, leaveId: string, dto: UpdateLeaveInput): Promise<Record<string, unknown>> {
    const repo = this.dataSource.getRepository(ScheduledLeaveEntity);

    const leave = await repo.findOne({ where: { id: leaveId, accountId } });
    if (!leave) throw BusinessException.notFound('ScheduledLeave', leaveId);

    if (dto.startDate !== undefined) leave.startDate = dto.startDate;
    if (dto.endDate !== undefined) leave.endDate = dto.endDate;
    if (dto.minutesPerDay !== undefined) leave.minutesPerDay = dto.minutesPerDay ?? 480;
    if (dto.leaveType !== undefined) leave.leaveType = mapLeaveTypeToDb(dto.leaveType);
    if (dto.note !== undefined) leave.description = dto.note ?? null;

    // Re-check overlap if dates changed
    if (dto.startDate !== undefined || dto.endDate !== undefined) {
      await this.checkOverlap(leave.personId, leave.startDate, leave.endDate, leaveId);
    }

    const saved = await repo.save(leave);
    return toApiShape(saved);
  }

  // ============================================================
  // Delete Leave
  // ============================================================

  async deleteLeave(accountId: string, leaveId: string): Promise<void> {
    const repo = this.dataSource.getRepository(ScheduledLeaveEntity);

    const leave = await repo.findOne({ where: { id: leaveId, accountId } });
    if (!leave) throw BusinessException.notFound('ScheduledLeave', leaveId);

    await repo.remove(leave);
  }

  // ============================================================
  // Bulk Create Leaves
  // ============================================================

  async bulkCreateLeaves(accountId: string, dto: BulkCreateLeaveInput): Promise<Record<string, unknown>[]> {
    const results: Record<string, unknown>[] = [];

    for (const entry of dto.leaves) {
      const created = await this.createLeave(accountId, entry);
      results.push(created);
    }

    return results;
  }

  // ============================================================
  // Bulk Delete Leaves
  // ============================================================

  async bulkDeleteLeaves(accountId: string, dto: BulkDeleteLeaveInput): Promise<void> {
    const repo = this.dataSource.getRepository(ScheduledLeaveEntity);

    // Validate all IDs belong to this account
    const leaves = await repo
      .createQueryBuilder('leave')
      .where('leave.account_id = :accountId', { accountId })
      .andWhere('leave.id IN (:...ids)', { ids: dto.ids })
      .getMany();

    if (leaves.length !== dto.ids.length) {
      const foundIds = new Set(leaves.map((l) => l.id));
      const missingIds = dto.ids.filter((id: string) => !foundIds.has(id));
      throw BusinessException.notFound('ScheduledLeave', missingIds.join(', '));
    }

    await repo.remove(leaves);
  }

  // ============================================================
  // Overlap Check (private)
  // ============================================================

  private async checkOverlap(
    personId: string,
    startDate: string,
    endDate: string,
    excludeId?: string,
  ): Promise<void> {
    const params: (string | undefined)[] = [personId, startDate, endDate];
    let excludeClause = '';

    if (excludeId) {
      excludeClause = ' AND id != ?';
      params.push(excludeId);
    }

    const result = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM scheduled_leaves
       WHERE person_id = ?
         AND start_date <= ?
         AND end_date >= ?${excludeClause}`,
      params,
    );

    if (result[0] && parseInt(result[0].count, 10) > 0) {
      throw BusinessException.businessRule(
        'Leave period overlaps with an existing leave for this person',
        { personId, startDate, endDate },
      );
    }
  }
}
