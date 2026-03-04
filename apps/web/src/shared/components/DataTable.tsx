import { type ReactNode } from 'react';
import { Inbox, ChevronUp, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  sortKey?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
}

// ---------------------------------------------------------------------------
// Skeleton row
// ---------------------------------------------------------------------------

function SkeletonRow({ colCount }: { colCount: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: colCount }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-gray-200" />
        </td>
      ))}
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Sort indicator
// ---------------------------------------------------------------------------

function SortIcon({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) {
  if (!active) {
    return <ChevronUp className="ml-1 inline h-3.5 w-3.5 text-gray-300" />;
  }
  return direction === 'asc'
    ? <ChevronUp className="ml-1 inline h-3.5 w-3.5 text-indigo-600" />
    : <ChevronDown className="ml-1 inline h-3.5 w-3.5 text-indigo-600" />;
}

// ---------------------------------------------------------------------------
// DataTable
// ---------------------------------------------------------------------------

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  onRowClick,
  loading = false,
  emptyMessage = 'No data found',
  sortColumn,
  sortDirection = 'asc',
  onSort,
}: DataTableProps<T>) {
  const handleHeaderClick = (col: Column<T>) => {
    if (!col.sortable || !onSort) return;
    const key = col.sortKey ?? col.key;
    const newDir = sortColumn === key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(key, newDir);
  };

  const headerRow = (
    <thead className="bg-gray-50">
      <tr>
        {columns.map((col) => (
          <th
            key={col.key}
            onClick={() => handleHeaderClick(col)}
            className={clsx(
              'px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500',
              col.sortable && onSort && 'cursor-pointer select-none hover:text-gray-700',
            )}
          >
            {col.header}
            {col.sortable && onSort && (
              <SortIcon
                active={sortColumn === (col.sortKey ?? col.key)}
                direction={sortColumn === (col.sortKey ?? col.key) ? sortDirection : 'asc'}
              />
            )}
          </th>
        ))}
      </tr>
    </thead>
  );

  // Loading state
  if (loading) {
    return (
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          {headerRow}
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} colCount={columns.length} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full">
          {headerRow}
        </table>
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Inbox className="mb-3 h-10 w-10" />
          <p className="text-sm">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  // Data rows
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        {headerRow}
        <tbody className="divide-y divide-gray-100">
          {data.map((row, rowIdx) => (
            <tr
              key={row.id ?? rowIdx}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={clsx(
                'transition-colors',
                onRowClick &&
                  'cursor-pointer hover:bg-gray-50 active:bg-gray-100',
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="whitespace-nowrap px-4 py-3 text-sm text-gray-700"
                >
                  {col.render
                    ? col.render(row)
                    : String(
                        (row as Record<string, unknown>)[col.key] ?? '\u2014',
                      )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
