import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export type FilterOperator = 'eq' | 'neq' | 'in' | 'like' | 'gte' | 'lte' | 'between' | 'isNull';

export interface FilterDef {
  field: string;
  operator: FilterOperator;
  column?: string; // override SQL column name if different from field
}

/**
 * Apply a set of filters to a TypeORM query builder based on query params.
 */
export function applyFilters<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  alias: string,
  filters: FilterDef[],
  params: Record<string, unknown>,
): SelectQueryBuilder<T> {
  for (const filter of filters) {
    const value = params[filter.field];
    if (value === undefined || value === null || value === '') continue;

    const col = `${alias}.${filter.column ?? filter.field}`;
    const paramName = filter.field.replace(/\./g, '_');

    switch (filter.operator) {
      case 'eq':
        qb.andWhere(`${col} = :${paramName}`, { [paramName]: value });
        break;
      case 'neq':
        qb.andWhere(`${col} != :${paramName}`, { [paramName]: value });
        break;
      case 'in':
        qb.andWhere(`${col} IN (:...${paramName})`, {
          [paramName]: Array.isArray(value) ? value : [value],
        });
        break;
      case 'like':
        qb.andWhere(`${col} ILIKE :${paramName}`, { [paramName]: `%${value}%` });
        break;
      case 'gte':
        qb.andWhere(`${col} >= :${paramName}`, { [paramName]: value });
        break;
      case 'lte':
        qb.andWhere(`${col} <= :${paramName}`, { [paramName]: value });
        break;
      case 'between': {
        const arr = value as [unknown, unknown];
        qb.andWhere(`${col} BETWEEN :${paramName}Start AND :${paramName}End`, {
          [`${paramName}Start`]: arr[0],
          [`${paramName}End`]: arr[1],
        });
        break;
      }
      case 'isNull':
        if (value === true || value === 'true') {
          qb.andWhere(`${col} IS NULL`);
        } else {
          qb.andWhere(`${col} IS NOT NULL`);
        }
        break;
    }
  }

  return qb;
}

/**
 * Apply search across multiple columns using ILIKE.
 */
export function applySearch<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  alias: string,
  columns: string[],
  search: string | undefined,
): SelectQueryBuilder<T> {
  if (!search || search.trim() === '') return qb;

  const conditions = columns.map((col) => `${alias}.${col} ILIKE :search`).join(' OR ');
  qb.andWhere(`(${conditions})`, { search: `%${search.trim()}%` });

  return qb;
}
