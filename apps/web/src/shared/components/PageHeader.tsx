import type { ReactNode } from 'react';

interface PageHeaderProps {
  icon?: ReactNode;
  title: string;
  count?: number;
  actions?: ReactNode;
}

export function PageHeader({ icon, title, count, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {icon && <span className="text-gray-500">{icon}</span>}
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {count !== undefined && (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            {count}
          </span>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
