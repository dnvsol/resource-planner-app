import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export interface PaginationOptions {
  cursor?: string;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    cursor: string | null;
    hasMore: boolean;
    total?: number;
  };
}

/**
 * Apply cursor-based pagination to a TypeORM query builder.
 * Cursor is a base64-encoded JSON of the last row's sort key.
 */
export function applyCursorPagination<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  options: PaginationOptions,
  alias: string,
): SelectQueryBuilder<T> {
  const limit = Math.min(options.limit ?? 50, 200);
  const sortBy = options.sortBy ?? 'createdAt';
  const sortOrder = options.sortOrder ?? 'DESC';

  if (options.cursor) {
    try {
      const decoded = JSON.parse(Buffer.from(options.cursor, 'base64url').toString('utf-8'));
      const op = sortOrder === 'ASC' ? '>' : '<';
      qb.andWhere(`${alias}.${sortBy} ${op} :cursorValue`, { cursorValue: decoded.value });
      if (decoded.id) {
        qb.andWhere(`${alias}.id != :cursorId`, { cursorId: decoded.id });
      }
    } catch {
      // Invalid cursor — ignore and start from beginning
    }
  }

  qb.orderBy(`${alias}.${sortBy}`, sortOrder);
  qb.addOrderBy(`${alias}.id`, sortOrder);
  qb.take(limit + 1); // fetch one extra to check hasMore

  return qb;
}

export function buildPaginatedResult<T extends { id: string }>(
  rows: T[],
  limit: number,
  sortBy: string,
  total?: number,
): PaginatedResult<T> {
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const lastItem = data[data.length - 1];

  const cursor = lastItem
    ? Buffer.from(
        JSON.stringify({
          value: (lastItem as Record<string, unknown>)[sortBy],
          id: lastItem.id,
        }),
      ).toString('base64url')
    : null;

  return {
    data,
    meta: {
      cursor,
      hasMore,
      ...(total !== undefined && { total }),
    },
  };
}
