import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  ExternalLink,
  AlertTriangle,
  FileText,
  Activity,
} from 'lucide-react';
import {
  useProject,
  useUpdateProject,
  useProjectFinancials,
  useAssignments,
  useRoles,
  useClients,
  useTeams,
  useOtherExpenses,
  useCreateOtherExpense,
  useDeleteOtherExpense,
} from '@/shared/api/hooks';
import type { ProjectDetail, ProjectPhase, Role, Assignment, Client, Team } from '@/shared/api/hooks';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { ThreeDotMenu } from '@/shared/components/ui/ThreeDotMenu';
import { NotesPanel } from '@/shared/components/NotesPanel';

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

function dateDiffDays(start: string | null, end: string | null): string {
  if (!start || !end) return '';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const days = Math.round(ms / (1000 * 60 * 60 * 24));
  const months = Math.floor(days / 30);
  const remDays = days % 30;
  if (months > 0) return `(${months} month${months > 1 ? 's' : ''}, ${remDays} day${remDays !== 1 ? 's' : ''})`;
  return `(${days} day${days !== 1 ? 's' : ''})`;
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
// View mode
// ---------------------------------------------------------------------------

type ViewMode = 'hours' | 'days' | 'revenue' | 'cost';

// ---------------------------------------------------------------------------
// Color icon for project
// ---------------------------------------------------------------------------

function ProjectColorIcon({ project }: { project: ProjectDetail }) {
  if (project.emoji) return <span className="text-2xl">{project.emoji}</span>;
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];
  const hash = project.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const color = colors[hash % colors.length];
  return (
    <span
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {project.name.charAt(0).toUpperCase()}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Financial KPI Card
// ---------------------------------------------------------------------------

function FinCard({
  label,
  value,
  color,
  warning,
  tooltip,
}: {
  label: string;
  value: string;
  color: string;
  warning?: boolean;
  tooltip?: string;
}) {
  return (
    <div className={`rounded-lg border bg-white px-5 py-4 ${warning ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
      <p className="mb-1 flex items-center gap-1 text-xs font-medium uppercase text-gray-500">
        {label}
        {tooltip && (
          <span className="cursor-help text-gray-400" title={tooltip}>&#9432;</span>
        )}
      </p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {warning && <p className="mt-1 text-xs text-red-600">Over budget</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Snapshot (shows all sections like Runn)
// ---------------------------------------------------------------------------

function SnapshotTab({ project, viewMode }: { project: ProjectDetail; viewMode: ViewMode }) {
  const { data: financials } = useProjectFinancials(project.id);
  const budgetVal = (project as any).budgetTotal ?? project.budget ?? 0;
  const pricingLabel = project.pricingModel
    ? (PRICING_MODEL_LABELS[project.pricingModel] ?? project.pricingModel)
    : '\u2014';

  return (
    <div className="space-y-8">
      {/* Section: Financial KPIs */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Snapshot &mdash; {pricingLabel} Project Totals
        </h2>

        {financials ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <FinCard label="Project Budget" value={formatCurrency(budgetVal)} color="text-indigo-600" tooltip="Total budget for this project" />
            <FinCard label="Project Revenue" value={financials.scheduledRevenue > 0 ? formatCurrency(financials.scheduledRevenue) : '?'} color="text-green-600" tooltip="Revenue from scheduled work" />
            <FinCard label="Budget Remaining" value={formatCurrency(financials.budgetRemaining)} color={financials.budgetRemaining >= 0 ? 'text-green-600' : 'text-red-600'} warning={financials.budgetRemaining < 0} tooltip="Budget minus scheduled revenue" />
            <FinCard label="Project Costs" value={formatCurrency(financials.scheduledCost)} color="text-gray-900" tooltip="Total scheduled costs" />
            <FinCard label="Project Gross Profit" value={financials.scheduledProfit !== 0 ? formatCurrency(financials.scheduledProfit) : '?'} color={financials.scheduledProfit >= 0 ? 'text-green-600' : 'text-red-600'} tooltip="Revenue minus costs" />
            <FinCard label="Margin" value={financials.scheduledMargin > 0 ? `${financials.scheduledMargin.toFixed(0)}%` : '?'} color={financials.scheduledMargin >= 20 ? 'text-green-600' : 'text-orange-600'} tooltip="Profit as percentage of revenue" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        )}
      </div>

      {/* Section: Performance (Revenue) */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Project Performance (Revenue)
          </h3>
          {project.phases && project.phases.length > 0 && (
            <span className="text-xs text-gray-400">
              {formatDate(project.phases[0].startDate)} - {formatDate(project.phases[project.phases.length - 1].endDate)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-gray-400">
            {financials && financials.scheduledRevenue > 0
              ? 'Revenue performance chart will be displayed here when timesheet data is available.'
              : 'Set up a budget & rates to view financial performance'}
          </p>
        </div>
      </div>

      {/* Section: Project Team Members and Revenue */}
      <ProjectTeamSection project={project} viewMode={viewMode} />

      {/* Section: Milestones */}
      <MilestonesSection project={project} />

      {/* Section: Phases */}
      <PhasesSection phases={project.phases ?? []} />

      {/* Section: Project Details */}
      <ProjectDetailsSection project={project} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Project Team Members Section (Runn style: role-grouped with person nesting)
// ---------------------------------------------------------------------------

interface TeamMemberRow {
  roleId: string;
  roleName: string;
  persons: {
    personId: string;
    personName: string;
    hourlyRate: number;
    pastRevenue: number;
    futureRevenue: number;
    totalRevenue: number;
    budget: number;
  }[];
  roleHourlyRate: number;
  rolePastRevenue: number;
  roleFutureRevenue: number;
  roleTotalRevenue: number;
  roleBudget: number;
}

function ProjectTeamSection({ project, viewMode: _viewMode }: { project: ProjectDetail; viewMode: ViewMode }) {
  const { data: assignmentsRes } = useAssignments({ projectId: project.id });
  const { data: rolesRes } = useRoles();

  const assignments: Assignment[] = assignmentsRes?.data ?? [];
  const roles: Role[] = rolesRes?.data ?? [];

  const roleMap = useMemo(() => {
    const m = new Map<string, Role>();
    for (const r of roles) m.set(r.id, r);
    return m;
  }, [roles]);

  // Group assignments by role, then by person
  const teamRows: TeamMemberRow[] = useMemo(() => {
    const byRole = new Map<string, Map<string, { personName: string; assignments: Assignment[] }>>();

    for (const a of assignments) {
      if (!byRole.has(a.roleId)) byRole.set(a.roleId, new Map());
      const personMap = byRole.get(a.roleId)!;
      if (!personMap.has(a.personId)) {
        personMap.set(a.personId, { personName: (a as any).person_name ?? (a as any).personName ?? `Person`, assignments: [] });
      }
      personMap.get(a.personId)!.assignments.push(a);
    }

    const rows: TeamMemberRow[] = [];
    const today = new Date().toISOString().slice(0, 10);

    for (const [roleId, personMap] of byRole) {
      const role = roleMap.get(roleId);
      const roleName = role?.name ?? 'Unknown Role';
      const hourlyRate = role?.defaultHourlyRate ?? 0;

      const persons: TeamMemberRow['persons'] = [];
      let rolePast = 0, roleFuture = 0, roleTotal = 0;

      for (const [personId, { personName, assignments: pAssignments }] of personMap) {
        let pastHours = 0, futureHours = 0;
        for (const a of pAssignments) {
          const days = Math.max(1, Math.ceil((new Date(a.endDate).getTime() - new Date(a.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1);
          const totalMins = days * a.minutesPerDay;
          if (a.endDate < today) pastHours += totalMins / 60;
          else if (a.startDate > today) futureHours += totalMins / 60;
          else {
            const pastDays = Math.max(0, Math.ceil((new Date(today).getTime() - new Date(a.startDate).getTime()) / (1000 * 60 * 60 * 24)));
            const totalDays = days;
            pastHours += (pastDays / totalDays) * totalMins / 60;
            futureHours += ((totalDays - pastDays) / totalDays) * totalMins / 60;
          }
        }
        const pastRev = pastHours * hourlyRate;
        const futureRev = futureHours * hourlyRate;
        const totalRev = pastRev + futureRev;
        rolePast += pastRev;
        roleFuture += futureRev;
        roleTotal += totalRev;

        persons.push({
          personId,
          personName,
          hourlyRate,
          pastRevenue: pastRev,
          futureRevenue: futureRev,
          totalRevenue: totalRev,
          budget: 0,
        });
      }

      // Find budget for this role
      const budgetRole = project.budgetRoles?.find((br) => br.roleId === roleId);
      const roleBudget = budgetRole?.estimatedBudget ?? 0;

      rows.push({
        roleId,
        roleName,
        persons,
        roleHourlyRate: hourlyRate,
        rolePastRevenue: rolePast,
        roleFutureRevenue: roleFuture,
        roleTotalRevenue: roleTotal,
        roleBudget: roleBudget,
      });
    }

    return rows;
  }, [assignments, roleMap, project.budgetRoles]);

  const totals = useMemo(() => {
    let past = 0, future = 0, total = 0, budget = 0;
    for (const r of teamRows) {
      past += r.rolePastRevenue;
      future += r.roleFutureRevenue;
      total += r.roleTotalRevenue;
      budget += r.roleBudget;
    }
    return { past, future, total, budget };
  }, [teamRows]);

  const underallocated = totals.budget > 0 ? totals.budget - totals.total : 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Project Team Members and Revenue
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-indigo-600">
                Project Role <span className="text-gray-400">&#9660;</span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Workstream</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Hourly Rate</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400" colSpan={3}>
                <span className="text-xs uppercase">Project Revenue</span>
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Budget</th>
            </tr>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th colSpan={3} />
              <th className="px-4 py-1 text-right text-[10px] font-medium text-gray-400">Past</th>
              <th className="px-4 py-1 text-right text-[10px] font-medium text-gray-400">Future</th>
              <th className="px-4 py-1 text-right text-[10px] font-medium text-gray-400">Total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {teamRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-400">
                  No team members assigned to this project.
                </td>
              </tr>
            ) : (
              <>
                {teamRows.map((row) => (
                  <RoleGroup key={row.roleId} row={row} />
                ))}

                {/* Underallocated row */}
                {underallocated > 0 && (
                  <tr className="border-t border-gray-200">
                    <td colSpan={6} className="px-6 py-3 text-sm text-gray-500">
                      Underallocated by
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-amber-600">
                      {formatCurrency(underallocated)}
                    </td>
                  </tr>
                )}

                {/* Totals row */}
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                  <td className="px-6 py-3 text-sm text-gray-900">Totals</td>
                  <td />
                  <td />
                  <td className="px-4 py-3 text-right text-sm text-gray-900">{formatCurrency(totals.past)}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">{formatCurrency(totals.future)}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">{formatCurrency(totals.total)}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">{formatCurrency(totals.budget)}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RoleGroup({ row }: { row: TeamMemberRow }) {
  return (
    <>
      {/* Role header row */}
      <tr className="border-t border-gray-200 bg-white">
        <td className="px-6 py-3 text-sm font-medium text-gray-900">{row.roleName}</td>
        <td />
        <td className="px-4 py-3 text-right text-sm text-gray-600">{formatCurrency(row.roleHourlyRate)}</td>
        <td className="px-4 py-3 text-right text-sm text-gray-600">{formatCurrency(row.rolePastRevenue)}</td>
        <td className="px-4 py-3 text-right text-sm text-gray-600">{formatCurrency(row.roleFutureRevenue)}</td>
        <td className="px-4 py-3 text-right text-sm text-gray-600">{formatCurrency(row.roleTotalRevenue)}</td>
        <td className="px-4 py-3 text-right text-sm text-gray-600">{row.roleBudget > 0 ? formatCurrency(row.roleBudget) : ''}</td>
      </tr>
      {/* Person rows nested under role */}
      {row.persons.map((p) => (
        <tr key={p.personId} className="bg-white">
          <td className="px-6 py-2 pl-12">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-medium text-gray-600">
                {p.personName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
              </span>
              <span className="text-sm text-gray-700">{p.personName}</span>
              {/* Warning icon if person has no revenue */}
              {p.totalRevenue === 0 && (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              )}
            </div>
          </td>
          <td />
          <td />
          <td className="px-4 py-2 text-right text-sm text-gray-500">{formatCurrency(p.pastRevenue)}</td>
          <td className="px-4 py-2 text-right text-sm text-gray-500">{formatCurrency(p.futureRevenue)}</td>
          <td className="px-4 py-2 text-right text-sm text-gray-500">{formatCurrency(p.totalRevenue)}</td>
          <td />
        </tr>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Milestones Section
// ---------------------------------------------------------------------------

function MilestonesSection({ project }: { project: ProjectDetail }) {
  const milestones = project.milestones ?? [];
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Milestones</h3>
        <button className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
          <Plus className="h-4 w-4" />
          New Milestone
        </button>
      </div>
      {milestones.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-gray-400">
          This project has no milestones
        </p>
      ) : (
        <div className="divide-y divide-gray-100 px-6">
          {milestones.map((ms) => (
            <div key={ms.id} className="flex items-center gap-4 py-3">
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
// Phases Section
// ---------------------------------------------------------------------------

function PhasesSection({ phases }: { phases: ProjectPhase[] }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Phases</h3>
        <button className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
          <Plus className="h-4 w-4" />
          New Phase
        </button>
      </div>
      {phases.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-gray-400">
          This project has no phases
        </p>
      ) : (
        <div className="divide-y divide-gray-100 px-6">
          {phases.map((phase) => (
            <div key={phase.id} className="flex items-center gap-4 py-3">
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
// Project Details Section
// ---------------------------------------------------------------------------

function ProjectDetailsSection({ project, onEditDetails }: { project: ProjectDetail; onEditDetails?: () => void }) {
  const pricingLabel = project.pricingModel
    ? (PRICING_MODEL_LABELS[project.pricingModel] ?? project.pricingModel)
    : '\u2014';

  const statusLabel = project.state === 'archived' ? 'Archived'
    : project.status === 'tentative' ? 'Tentative'
    : 'Confirmed';

  // Calculate project date range from phases
  const startDate = project.phases?.length ? project.phases[0].startDate : null;
  const endDate = project.phases?.length ? project.phases[project.phases.length - 1].endDate : null;
  const dateRange = startDate && endDate
    ? `${formatDate(startDate)} - ${formatDate(endDate)} ${dateDiffDays(startDate, endDate)}`
    : '\u2014';

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Project Details</h3>
        <button onClick={onEditDetails} className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
          <Plus className="h-4 w-4" />
          Edit Details
        </button>
      </div>
      <div className="space-y-0 px-6">
        <InfoRow label="Project ID" value={project.id.slice(0, 8)} copyable />
        <InfoRow label="Project Dates" value={dateRange} />
        <InfoRow label="Pricing Model" value={pricingLabel} />
        <InfoRow label="Primary Team" value={project.client?.name ?? '\u2014'} link />
        <InfoRow label="Status" value={statusLabel} />
      </div>
    </div>
  );
}

function InfoRow({ label, value, copyable, link }: { label: string; value: string; copyable?: boolean; link?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-3 last:border-b-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium ${link ? 'text-indigo-600' : 'text-gray-900'}`}>
        {value}
        {copyable && (
          <button
            onClick={() => navigator.clipboard.writeText(value)}
            className="ml-2 text-gray-400 hover:text-gray-600"
            title="Copy"
          >
            &#128203;
          </button>
        )}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Performance
// ---------------------------------------------------------------------------

function PerformanceTab({ project }: { project: ProjectDetail }) {
  const { data: financials } = useProjectFinancials(project.id);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Project Performance (Revenue)
        </h3>
        {project.phases && project.phases.length > 0 && (
          <span className="text-xs text-gray-400">
            {formatDate(project.phases[0].startDate)} - {formatDate(project.phases[project.phases.length - 1].endDate)}
          </span>
        )}
      </div>
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-gray-400">
          {financials && financials.scheduledRevenue > 0
            ? 'Revenue performance chart coming soon.'
            : 'Set up a budget & rates to view financial performance'}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Project Team (standalone view)
// ---------------------------------------------------------------------------

function ProjectTeamTab({ project, viewMode }: { project: ProjectDetail; viewMode: ViewMode }) {
  return <ProjectTeamSection project={project} viewMode={viewMode} />;
}

// ---------------------------------------------------------------------------
// Tab: Milestones (standalone view)
// ---------------------------------------------------------------------------

function MilestonesTab({ project }: { project: ProjectDetail }) {
  return <MilestonesSection project={project} />;
}

// ---------------------------------------------------------------------------
// Tab: Phases (standalone view)
// ---------------------------------------------------------------------------

function PhasesTab({ phases }: { phases: ProjectPhase[] }) {
  return <PhasesSection phases={phases} />;
}

// ---------------------------------------------------------------------------
// Tab: Details (standalone view with Other Expenses)
// ---------------------------------------------------------------------------

function DetailsTab({ project, onEditDetails }: { project: ProjectDetail; onEditDetails?: () => void }) {
  return (
    <div className="space-y-6">
      <ProjectDetailsSection project={project} onEditDetails={onEditDetails} />
      <OtherExpensesSection projectId={project.id} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Other Expenses Section
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
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Other Expenses</h3>
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
// Edit Project Modal
// ---------------------------------------------------------------------------

function EditProjectModal({
  project,
  open,
  onClose,
}: {
  project: ProjectDetail;
  open: boolean;
  onClose: () => void;
}) {
  const updateProject = useUpdateProject();
  const { data: clientsRes } = useClients();
  const { data: teamsRes } = useTeams();
  const clients: Client[] = clientsRes?.data ?? [];
  const teams: Team[] = teamsRes?.data ?? [];

  const [name, setName] = useState(project.name);
  const [pricingModel, setPricingModel] = useState(project.pricingModel ?? 'time_and_materials');
  const [clientId, setClientId] = useState(project.clientId ?? '');
  const [teamId, setTeamId] = useState(project.teamId ?? '');
  const [status, setStatus] = useState(project.status ?? 'confirmed');

  const handleSave = async () => {
    await updateProject.mutateAsync({
      id: project.id,
      name,
      pricingModel: pricingModel as any,
      clientId: clientId || null,
      teamId: teamId || null,
      status: status as any,
    });
    onClose();
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Edit Project Details">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Pricing Model</label>
          <select
            value={pricingModel}
            onChange={(e) => setPricingModel(e.target.value as 'time_and_materials' | 'fixed_price' | 'non_billable')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="time_and_materials">Time &amp; Materials</option>
            <option value="fixed_price">Fixed Price</option>
            <option value="non_billable">Non-Billable</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Client</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">No client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Team</label>
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">No team</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'confirmed' | 'tentative')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="confirmed">Confirmed</option>
            <option value="tentative">Tentative</option>
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={updateProject.isPending}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-gray-200" />
        <div className="h-7 w-56 rounded bg-gray-200" />
      </div>
      <div className="mb-6 h-10 w-full rounded bg-gray-100" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
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
  const { data: financials } = useProjectFinancials(id!);
  const [activeTab, setActiveTab] = useState<Tab>('snapshot');
  const [viewMode, setViewMode] = useState<ViewMode>('revenue');
  const [notesOpen, setNotesOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading || !project) {
    return <DetailSkeleton />;
  }

  const budgetWarning = financials && financials.budgetRemaining < 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header (matches Runn exactly) */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ProjectColorIcon project={project} />
          <div>
            <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
            {project.client && (
              <p className="text-sm text-gray-500">{project.client.name}</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/planner/projects')}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open in Planner
          </Button>

          {budgetWarning && (
            <Button variant="secondary" size="sm" className="text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              Budget
            </Button>
          )}

          <Button variant="secondary" size="sm" onClick={() => {}}>
            <Activity className="h-3.5 w-3.5" />
            Activity
          </Button>

          <Button variant="secondary" size="sm" onClick={() => setNotesOpen(true)}>
            <FileText className="h-3.5 w-3.5" />
            Notes
          </Button>

          {/* View mode toggles */}
          <div className="ml-2 flex overflow-hidden rounded-md border border-gray-300">
            {(['hours', 'days', 'revenue', 'cost'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  viewMode === mode
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {mode === 'revenue' ? 'Revenue' : mode === 'cost' ? 'Cost' : mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          <ThreeDotMenu
            items={[
              { label: 'Edit Project', onClick: () => setEditOpen(true) },
              { label: 'Duplicate', onClick: () => {} },
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
      {activeTab === 'snapshot' && <SnapshotTab project={project} viewMode={viewMode} />}
      {activeTab === 'performance' && <PerformanceTab project={project} />}
      {activeTab === 'team' && <ProjectTeamTab project={project} viewMode={viewMode} />}
      {activeTab === 'milestones' && <MilestonesTab project={project} />}
      {activeTab === 'phases' && <PhasesTab phases={project.phases ?? []} />}
      {activeTab === 'details' && <DetailsTab project={project} onEditDetails={() => setEditOpen(true)} />}

      <EditProjectModal
        project={project}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />

      <NotesPanel
        entityType="project"
        entityId={id!}
        entityName={project.name}
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
      />
    </div>
  );
}
