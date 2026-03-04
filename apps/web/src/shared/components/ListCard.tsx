import type { ReactNode } from 'react';
import { Search } from 'lucide-react';

interface ListCardProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filterNode?: ReactNode;
  children: ReactNode;
}

export function ListCard({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filterNode,
  children,
}: ListCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Search + filter bar */}
      {(onSearchChange || filterNode) && (
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
          {onSearchChange && (
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search ?? ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-md border border-gray-300 py-1.5 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}
          {filterNode}
        </div>
      )}

      {/* Content */}
      {children}
    </div>
  );
}
