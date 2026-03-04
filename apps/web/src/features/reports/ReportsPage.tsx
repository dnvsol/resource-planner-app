import { useState } from 'react';
import { Download, FileText, Users, FolderKanban } from 'lucide-react';
import { useProjectsReport, useProfitabilityReport } from '@/shared/api/hooks';
import { Button } from '@/shared/components/ui/Button';
import { PageHeader } from '@/shared/components/PageHeader';
import { REPORT_PRESETS, REPORT_CATEGORIES } from './report-presets';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(v: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

function formatPct(v: number): string {
  return `${v.toFixed(1)}%`;
}

function marginColor(margin: number): string {
  if (margin >= 30) return 'text-green-600';
  if (margin >= 15) return 'text-yellow-600';
  if (margin >= 0) return 'text-orange-600';
  return 'text-red-600';
}

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const PRICING_LABELS: Record<string, string> = {
  time_and_materials: 'T&M',
  tm: 'T&M',
  fixed_price: 'Fixed',
  non_billable: 'Non-Bill',
};

// ---------------------------------------------------------------------------
// Projects Report Table
// ---------------------------------------------------------------------------

function ProjectsReportTable() {
  const { data, isLoading } = useProjectsReport();

  const handleExport = () => {
    if (!data) return;
    const headers = ['Project', 'Client', 'Model', 'Revenue', 'Cost', 'Profit', 'Margin', 'Hours', 'Budget Remaining'];
    const rows = data.map((r) => [
      `"${r.projectName}"`, `"${r.clientName ?? ''}"`, r.pricingModel,
      String(r.financials.scheduledRevenue), String(r.financials.scheduledCost),
      String(r.financials.scheduledProfit), `${r.financials.scheduledMargin}%`,
      String(r.financials.scheduledHours), String(r.financials.budgetRemaining),
    ]);
    downloadCSV('projects-report.csv', headers, rows);
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-10 rounded bg-gray-100" />)}</div>;
  }

  if (!data || data.length === 0) {
    return <p className="py-12 text-center text-sm text-gray-400">No active projects found.</p>;
  }

  const totals = data.reduce(
    (acc, r) => ({
      revenue: acc.revenue + r.financials.scheduledRevenue,
      cost: acc.cost + r.financials.scheduledCost,
      profit: acc.profit + r.financials.scheduledProfit,
      hours: acc.hours + r.financials.scheduledHours,
    }),
    { revenue: 0, cost: 0, profit: 0, hours: 0 },
  );
  const totalMargin = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">{data.length} projects</p>
        <Button variant="secondary" size="sm" onClick={handleExport}>
          <Download className="mr-1 h-4 w-4" /> Export CSV
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs font-medium uppercase text-gray-500">
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Model</th>
              <th className="px-4 py-3 text-right">Revenue</th>
              <th className="px-4 py-3 text-right">Cost</th>
              <th className="px-4 py-3 text-right">Profit</th>
              <th className="px-4 py-3 text-right">Margin</th>
              <th className="px-4 py-3 text-right">Hours</th>
              <th className="px-4 py-3 text-right">Budget Rem.</th>
            </tr>
          </thead>
          <tbody className="divide-y bg-white">
            {data.map((row) => (
              <tr key={row.projectId} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{row.projectName}</td>
                <td className="px-4 py-3 text-gray-500">{row.clientName ?? '\u2014'}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {PRICING_LABELS[row.pricingModel] ?? row.pricingModel}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(row.financials.scheduledRevenue)}</td>
                <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(row.financials.scheduledCost)}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(row.financials.scheduledProfit)}</td>
                <td className={`px-4 py-3 text-right font-medium ${marginColor(row.financials.scheduledMargin)}`}>{formatPct(row.financials.scheduledMargin)}</td>
                <td className="px-4 py-3 text-right text-gray-600">{Math.round(row.financials.scheduledHours)}</td>
                <td className={`px-4 py-3 text-right font-medium ${row.financials.budgetRemaining < 0 ? 'text-red-600' : 'text-gray-900'}`}>{formatCurrency(row.financials.budgetRemaining)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-medium">
            <tr>
              <td className="px-4 py-3" colSpan={3}>Totals</td>
              <td className="px-4 py-3 text-right">{formatCurrency(totals.revenue)}</td>
              <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(totals.cost)}</td>
              <td className="px-4 py-3 text-right">{formatCurrency(totals.profit)}</td>
              <td className={`px-4 py-3 text-right ${marginColor(totalMargin)}`}>{formatPct(totalMargin)}</td>
              <td className="px-4 py-3 text-right text-gray-600">{Math.round(totals.hours)}</td>
              <td className="px-4 py-3 text-right">{'\u2014'}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Profitability Report Table
// ---------------------------------------------------------------------------

function ProfitabilityTable() {
  const { data, isLoading } = useProfitabilityReport();

  const handleExport = () => {
    if (!data) return;
    const headers = ['Client', 'Projects', 'Revenue', 'Cost', 'Profit', 'Margin'];
    const rows = data.map((r) => [
      `"${r.clientName}"`, String(r.projectCount),
      String(r.totalRevenue), String(r.totalCost), String(r.totalProfit), `${r.margin}%`,
    ]);
    downloadCSV('profitability-report.csv', headers, rows);
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-10 rounded bg-gray-100" />)}</div>;
  }

  if (!data || data.length === 0) {
    return <p className="py-12 text-center text-sm text-gray-400">No data available.</p>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">{data.length} clients</p>
        <Button variant="secondary" size="sm" onClick={handleExport}>
          <Download className="mr-1 h-4 w-4" /> Export CSV
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs font-medium uppercase text-gray-500">
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3 text-right">Projects</th>
              <th className="px-4 py-3 text-right">Revenue</th>
              <th className="px-4 py-3 text-right">Cost</th>
              <th className="px-4 py-3 text-right">Profit</th>
              <th className="px-4 py-3 text-right">Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y bg-white">
            {data.map((row) => (
              <tr key={row.clientId ?? 'no-client'} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{row.clientName}</td>
                <td className="px-4 py-3 text-right text-gray-600">{row.projectCount}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(row.totalRevenue)}</td>
                <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(row.totalCost)}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(row.totalProfit)}</td>
                <td className={`px-4 py-3 text-right font-medium ${marginColor(row.margin)}`}>{formatPct(row.margin)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ReportsPage
// ---------------------------------------------------------------------------

type ReportView = 'center' | 'projects' | 'profitability';

export function ReportsPage() {
  const [view, setView] = useState<ReportView>('center');
  const [subFilter, setSubFilter] = useState<string>('all');

  const filteredPresets = REPORT_PRESETS.filter(
    (p) => subFilter === 'all' || p.subCategory === subFilter,
  );

  if (view === 'projects') {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <button onClick={() => setView('center')} className="text-sm text-indigo-600 hover:underline">&larr; Reports Center</button>
          <h1 className="text-2xl font-bold text-gray-900">Project Overview</h1>
        </div>
        <ProjectsReportTable />
      </div>
    );
  }

  if (view === 'profitability') {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <button onClick={() => setView('center')} className="text-sm text-indigo-600 hover:underline">&larr; Reports Center</button>
          <h1 className="text-2xl font-bold text-gray-900">Profitability by Client</h1>
        </div>
        <ProfitabilityTable />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        icon={<FileText className="h-6 w-6" />}
        title="Reports Center"
      />

      {/* Category cards */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-500" />
            <h3 className="text-sm font-semibold text-gray-900">People</h3>
          </div>
          <p className="text-xs text-gray-500">Utilization, capacity, and availability reports for your team.</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-indigo-500" />
            <h3 className="text-sm font-semibold text-gray-900">Projects</h3>
          </div>
          <p className="text-xs text-gray-500">Financial performance, budgets, and profitability across projects.</p>
        </div>
      </div>

      {/* Sub-filter pills */}
      <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-0.5 w-fit">
        {REPORT_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSubFilter(cat.key)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              subFilter === cat.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Report preset list */}
      <div className="space-y-2">
        {filteredPresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => {
              if (preset.route === 'projects') setView('projects');
              else if (preset.route === 'profitability') setView('profitability');
            }}
            className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-5 py-4 text-left shadow-sm transition-colors hover:bg-gray-50"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{preset.name}</span>
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 capitalize">
                  {preset.category}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-gray-500">{preset.description}</p>
            </div>
            <span className="text-xs font-medium text-indigo-600">View &rarr;</span>
          </button>
        ))}

        {filteredPresets.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">No reports match this filter.</p>
        )}
      </div>
    </div>
  );
}
