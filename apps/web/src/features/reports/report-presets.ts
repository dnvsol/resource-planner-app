export interface ReportPreset {
  id: string;
  name: string;
  description: string;
  category: 'people' | 'projects';
  subCategory: 'capacity' | 'financials' | 'performance' | 'utilization' | 'all';
  route: string;
}

export const REPORT_PRESETS: ReportPreset[] = [
  {
    id: 'project-overview',
    name: 'Project Overview',
    description: 'Revenue, cost, profit, margin, and budget remaining for all active projects.',
    category: 'projects',
    subCategory: 'financials',
    route: 'projects',
  },
  {
    id: 'profitability-by-client',
    name: 'Profitability by Client',
    description: 'Total revenue, cost, and profit grouped by client.',
    category: 'projects',
    subCategory: 'financials',
    route: 'profitability',
  },
  {
    id: 'utilization-report',
    name: 'Utilization Report',
    description: 'Utilization percentage and breakdown for all people.',
    category: 'people',
    subCategory: 'utilization',
    route: 'utilization',
  },
  {
    id: 'capacity-planning',
    name: 'Capacity Planning',
    description: 'Capacity vs demand over time, identifying surpluses and shortfalls.',
    category: 'people',
    subCategory: 'capacity',
    route: 'capacity',
  },
  {
    id: 'project-performance',
    name: 'Project Performance',
    description: 'Scheduled vs actual hours and budget tracking per project.',
    category: 'projects',
    subCategory: 'performance',
    route: 'performance',
  },
];

export const REPORT_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'capacity', label: 'Capacity' },
  { key: 'financials', label: 'Financials' },
  { key: 'performance', label: 'Performance' },
  { key: 'utilization', label: 'Utilization' },
] as const;
