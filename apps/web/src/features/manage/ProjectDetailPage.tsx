import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  ExternalLink,
} from 'lucide-react';
import {
  useProject,
  useProjectFinancials,
  useOtherExpenses,
  useCreateOtherExpense,
  useDeleteOtherExpense,
} from '@/shared/api/hooks';
import type { ProjectDetail, ProjectPhase } from '@/shared/api/hooks';
import { Button } from '@/shared/components/ui/Button';
import { ThreeDotMenu } from '@/shared/components/ui/ThreeDotMenu';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '\u2014';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const PRICING_MODEL_LABELS: Record<string, string> = {
  time_and_materials: 'Time and Materials',
  fixed_price: 'Fixed Price',
  non_billable: 'Non-Billable',
};

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

type Tab = 'snapshot' | 'performance' | 'team' | 'milestones' | 'phases' | 'details';

const TAB_OPTIONS: { key: Tab; label: string }[] = [
  { key: 'snapshot', label: 'Snapshot' },
  { key: 'performance', label: 'Performance' },
  { key: 'team', label: 'Project Team' },
  { key: 'milestones', label: 'Milestones' },
  { key: 'phases', label: 'Phases' },
  { key: 'details', label: 'Details' },
];

// ---------------------------------------------------------------------------
// Color icon for project
// ---------------------------------------------------------------------------

function ProjectColorIcon({ project }: { project: ProjectDetail }) {
  if (project.emoji) return <span className="text-2xl">{project.emoji}</span>;
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];
  const hash = project.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const color = colors[hash % colors.length];
  return <span className="inline-block h-5 w-5 rounded" style={{ backgroundColor: color }} />;
}

// ---------------------------------------------------------------------------
// Tab: Snapshot
// ---------------------------------------------------------------------------

function SnapshotTab({ project }: { project: ProjectDetail }) {
  const { data: financials } = useProjectFinancials(project.id);
  const pricingLabel = project.pricingModel
    ? (PRICING_MODEL_LABELS[project.pricingModel] ?? project.pricingModel)
    : '\u2014';

  return (
    <div className="space-y-6">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Snapshot &mdash; {pricingLabel} Project Totals
      </h2>

      {/* Financial KPI cards */}
      {financials ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <FinCard label="Project Budget" value={formatCurrency((project as any).budgetTotal ?? project.budget)} color="text-gray-900" />
          <FinCard label="Project Revenue" value={formatCurrency(financials.scheduledRevenue)} color="text-green-600" />
          <FinCard label="Budget Remaining" value={formatCurrency(financials.budgetRemaining)} color={financials.budgetRemaining >= 0 ? 'text-blue-600' : 'text-red-600'} warning={financials.budgetRemaining < 0} />
          <FinCard label="Project Costs" value={formatCurrency(financials.scheduledCost)} color="text-red-600" />
          <FinCard label="Gross Profit" value={formatCurrency(financials.scheduledProfit)} color={financials.scheduledProfit >= 0 ? 'text-green-600' : 'text-red-600'} />
          <FinCard label="Margin" value={`${financials.scheduledMargin.toFixed(1)}%`} color={financials.scheduledMargin >= 20 ? 'text-green-600' : 'text-orange-600'} />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      )}

      {/* Budget summary */}
      {financials && (
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Budget Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500">Scheduled Hours</p>
              <p className="font-medium text-gray-900">{Math.round(financials.scheduledHours)}h</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Budget Method</p>
              <p className="font-medium capitalize text-gray-900">{project.budgetMethod?.replace(/_/g, ' ')}</p>
            </div>
            {financials.tmBenchmark > 0 && (
              <div>
                <p className="text-xs text-gray-500">T&M Benchmark</p>
                <p className="font-medium text-gray-700">{formatCurrency(financials.tmBenchmark)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      {project.tags && project.tags.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-gray-900">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span key={tag.id} className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Managers */}
      {project.managers && project.managers.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-gray-900">Managers</h3>
          <div className="flex flex-wrap gap-2">
            {project.managers.map((m) => (
              <span key={m.id} className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                {m.firstName} {m.lastName}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FinCard({
  label,
  value,
  color,
  warning,
}: {
  label: string;
  value: string;
  color: string;
  warning?: boolean;
}) {
  return (
    <div className={`rounded-lg border bg-white p-4 shadow-sm ${warning ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
      <p className="mb-1 text-xs font-medium uppercase text-gray-500">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      {warning && <p className="mt-1 text-xs text-red-600">Over budget</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Performance (placeholder with description)
// ---------------------------------------------------------------------------

function PerformanceTab({ project: _project }: { project: ProjectDetail }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">Revenue Over Time</h3>
      <p className="py-12 text-center text-sm text-gray-400">
        Revenue performance chart will be displayed here when timesheet data is available.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Project Team
// ---------------------------------------------------------------------------

function ProjectTeamTab({ project }: { project: ProjectDetail }) {
  useProjectFinancials(project.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Project Team Members</h3>
      </div>

      {/* Budget by role breakdown */}
      {project.budgetRoles && project.budgetRoles.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Role</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Estimated Hours</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Budget</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {project.budgetRoles.map((br: any) => (
                <tr key={br.id}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{br.role_name ?? `Role ${br.roleId}`}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">{Math.round((br.budget_minutes ?? br.estimatedMinutes ?? 0) / 60)}h</td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{formatCurrency(br.estimated_budget ?? br.estimatedBudget ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-gray-400">No team budget allocations defined.</p>
      )}

      {/* Rate overrides */}
      {project.projectRates && project.projectRates.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Rate Overrides</h3>
          <div className="space-y-2">
            {project.projectRates.map((pr: any) => (
              <div key={pr.id} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
                <span className="text-sm text-gray-700">{pr.role_name ?? `Role ${pr.roleId}`}</span>
                <div className="flex gap-4 text-sm">
                  <span className="text-gray-500">{formatCurrency(pr.rate_hourly ?? pr.rateHourly ?? 0)}/hr</span>
                  <span className="text-gray-500">{formatCurrency(pr.rate_daily ?? pr.rateDaily ?? 0)}/day</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Milestones
// ---------------------------------------------------------------------------

function MilestonesTab({ project }: { project: ProjectDetail }) {
  const milestones = project.milestones ?? [];
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Milestones</h3>
        <Button size="sm"><Plus className="h-3.5 w-3.5" /> New Milestone</Button>
      </div>

      {milestones.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">
          No milestones defined. Add a milestone to track key project dates.
        </p>
      ) : (
        <div className="space-y-2">
          {milestones.map((ms) => (
            <div key={ms.id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <span className="text-xs font-medium text-gray-500">{formatDate(ms.date)}</span>
              <span className="text-sm text-gray-900">{ms.name}</span>
              {ms.description && (
                <span className="text-xs text-gray-400">&mdash; {ms.description}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Phases
// ---------------------------------------------------------------------------

function PhasesTab({ phases }: { phases: ProjectPhase[] }) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Phases</h3>
        <Button size="sm"><Plus className="h-3.5 w-3.5" /> New Phase</Button>
      </div>

      {phases.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">
          No phases defined. Add phases to organize project work.
        </p>
      ) : (
        <div className="space-y-2">
          {phases.map((phase) => (
            <div key={phase.id} className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <span className="inline-block h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: phase.color }} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{phase.name}</p>
                <p className="text-xs text-gray-500">
                  {formatDate(phase.startDate)} &mdash; {formatDate(phase.endDate)}
                </p>
              </div>
              {phase.budget !== null && (
                <span className="text-sm font-medium text-gray-700">{formatCurrency(phase.budget)}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Details
// ---------------------------------------------------------------------------

function DetailsTab({ project }: { project: ProjectDetail }) {
  const pricingLabel = project.pricingModel
    ? (PRICING_MODEL_LABELS[project.pricingModel] ?? project.pricingModel)
    : '\u2014';

  const statusLabel = project.state === 'archived' ? 'Archived'
    : project.status === 'tentative' ? 'Tentative'
    : 'Confirmed';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Project Details</h3>
        <Button variant="secondary" size="sm">Edit Details</Button>
      </div>

      <div className="space-y-4 text-sm">
        <InfoRow label="Project ID" value={project.id.slice(0, 8)} />
        <InfoRow
          label="Project Dates"
          value={
            project.phases && project.phases.length > 0
              ? `${formatDate(project.phases[0].startDate)} - ${formatDate(project.phases[project.phases.length - 1].endDate)}`
              : '\u2014'
          }
        />
        <InfoRow label="Pricing Model" value={pricingLabel} />
        <InfoRow label="Budget Method" value={project.budgetMethod?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} />
        <InfoRow label="Status" value={statusLabel} />
        <InfoRow label="Client" value={project.client?.name ?? '\u2014'} />
        <InfoRow label="Budget" value={formatCurrency((project as any).budgetTotal ?? project.budget)} />
        <InfoRow label="Expenses Budget" value={formatCurrency(project.expensesBudget)} />
      </div>

      {/* Other Expenses */}
      <OtherExpensesSection projectId={project.id} />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-2">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Other Expenses (reused from old budget tab)
// ---------------------------------------------------------------------------

function OtherExpensesSection({ projectId }: { projectId: string }) {
  const { data: expenses } = useOtherExpenses(projectId);
  const createExpense = useCreateOtherExpense();
  const deleteExpense = useDeleteOtherExpense();

  const [showForm, setShowForm] = useState(false);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isCharge, setIsCharge] = useState(true);

  const handleAdd = () => {
    if (!desc || !amount) return;
    createExpense.mutate({ projectId, description: desc, amount: parseFloat(amount), date, isCharge });
    setDesc('');
    setAmount('');
    setShowForm(false);
  };

  return (
    <div className="mt-6 border-t pt-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Other Expenses</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          {showForm ? 'Cancel' : '+ Add Expense'}
        </button>
      </div>

      {showForm && (
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-md border bg-gray-50 p-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-500">Description</label>
            <input value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm" placeholder="Expense description" />
          </div>
          <div className="w-28">
            <label className="mb-1 block text-xs font-medium text-gray-500">Amount</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm" />
          </div>
          <div className="w-36">
            <label className="mb-1 block text-xs font-medium text-gray-500">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm" />
          </div>
          <label className="flex items-center gap-1.5 text-xs">
            <input type="checkbox" checked={isCharge} onChange={(e) => setIsCharge(e.target.checked)} className="rounded border-gray-300" />
            Charge to client
          </label>
          <Button size="sm" onClick={handleAdd}>Add</Button>
        </div>
      )}

      {(!expenses || expenses.length === 0) ? (
        <p className="py-4 text-center text-sm text-gray-400">No expenses recorded.</p>
      ) : (
        <div className="space-y-2">
          {expenses.map((exp: any) => (
            <div key={exp.id} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
              <div>
                <span className="text-sm text-gray-900">{exp.description}</span>
                <span className="ml-2 text-xs text-gray-500">{formatDate(exp.date)}</span>
                {exp.is_charge && (
                  <span className="ml-2 inline-flex rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">charged</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-900">{formatCurrency(parseFloat(exp.amount))}</span>
                <button
                  onClick={() => deleteExpense.mutate({ projectId, expenseId: exp.id })}
                  className="text-gray-400 hover:text-red-500"
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="h-5 w-5 rounded bg-gray-200" />
        <div className="h-7 w-56 rounded bg-gray-200" />
      </div>
      <div className="mb-6 h-10 w-full rounded bg-gray-100" />
      <div className="grid grid-cols-3 gap-4 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-gray-100" />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProjectDetailPage
// ---------------------------------------------------------------------------

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(id!);
  const [activeTab, setActiveTab] = useState<Tab>('snapshot');

  if (isLoading || !project) {
    return <DetailSkeleton />;
  }

  const statusLabel = project.state === 'archived' ? 'Archived'
    : project.status === 'tentative' ? 'Tentative'
    : 'Confirmed';

  const statusColor = project.state === 'archived' ? 'text-gray-500'
    : project.status === 'tentative' ? 'text-amber-600'
    : 'text-green-600';

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ProjectColorIcon project={project} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            {project.client && (
              <p className="text-sm text-gray-500">{project.client.name}</p>
            )}
          </div>
          <span className={`ml-2 text-sm font-medium ${statusColor}`}>{statusLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/planner/projects')}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open in Planner
          </Button>
          <ThreeDotMenu
            items={[
              { label: 'Edit', onClick: () => {} },
              { label: 'Archive', onClick: () => {} },
              { label: 'Delete', onClick: () => {}, danger: true },
            ]}
          />
        </div>
      </div>

      {/* Tab navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {TAB_OPTIONS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'snapshot' && <SnapshotTab project={project} />}
      {activeTab === 'performance' && <PerformanceTab project={project} />}
      {activeTab === 'team' && <ProjectTeamTab project={project} />}
      {activeTab === 'milestones' && <MilestonesTab project={project} />}
      {activeTab === 'phases' && <PhasesTab phases={project.phases ?? []} />}
      {activeTab === 'details' && <DetailsTab project={project} />}
    </div>
  );
}
