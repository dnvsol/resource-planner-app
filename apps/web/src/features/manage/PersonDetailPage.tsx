import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star,
  Plus,
  ExternalLink,
} from 'lucide-react';
import {
  usePerson,
  useContracts,
  useTeams,
  useRoles,
  useLeaves,
  useAssignments,
} from '@/shared/api/hooks';
import type {
  PersonDetail,
  Contract,
  Team,
  Role,
  ScheduledLeave,
} from '@/shared/api/hooks';
import { Button } from '@/shared/components/ui/Button';
import { WorkDayBadges } from '@/shared/components/ui/WorkDayBadges';
import { ThreeDotMenu } from '@/shared/components/ui/ThreeDotMenu';
import { NotesPanel } from '@/shared/components/NotesPanel';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(person: PersonDetail): string {
  return `${person.firstName.charAt(0)}${person.lastName.charAt(0)}`.toUpperCase();
}

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
    maximumFractionDigits: 2,
  }).format(value);
}

// ---------------------------------------------------------------------------
// Tab types
// ---------------------------------------------------------------------------

type Tab = 'snapshot' | 'skills' | 'contracts' | 'timeoff';

const TAB_OPTIONS: { key: Tab; label: string }[] = [
  { key: 'snapshot', label: 'Snapshot' },
  { key: 'skills', label: 'Skills' },
  { key: 'contracts', label: 'Contracts' },
  { key: 'timeoff', label: 'Time Off' },
];

// ---------------------------------------------------------------------------
// Tab: Snapshot
// ---------------------------------------------------------------------------

function SnapshotTab({
  person,
  contracts,
  teamName,
  roleName,
}: {
  person: PersonDetail;
  contracts: Contract[];
  teamName: string;
  roleName: string;
}) {
  const now = new Date();
  const threeWeeksLater = new Date(now);
  threeWeeksLater.setDate(threeWeeksLater.getDate() + 21);
  const rangeLabel = `${now.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })} - ${threeWeeksLater.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  const startISO = now.toISOString().slice(0, 10);
  const endISO = threeWeeksLater.toISOString().slice(0, 10);

  const skills = person.skills ?? [];
  const activeContract = (person as any).activeContract as Contract | undefined;

  // Fetch assignments and leaves for KPI calculations
  const { data: assignmentsRes } = useAssignments({ personId: person.id });
  const { data: leavesRes } = useLeaves({ personId: person.id });

  const assignments = assignmentsRes?.data ?? [];
  const leaves = leavesRes?.data ?? [];

  // Compute KPIs for the 4-week window
  const kpis = useMemo(() => {
    // Filter assignments in range
    const rangeAssignments = assignments.filter(
      (a) => a.startDate <= endISO && a.endDate >= startISO,
    );
    // Filter leaves in range
    const rangeLeaves = leaves.filter(
      (l) => l.startDate <= endISO && l.endDate >= startISO,
    );

    // Work assigned (total hours in window)
    let totalWorkHours = 0;
    for (const a of rangeAssignments) {
      const aStart = a.startDate > startISO ? a.startDate : startISO;
      const aEnd = a.endDate < endISO ? a.endDate : endISO;
      const days = Math.max(1, Math.ceil((new Date(aEnd).getTime() - new Date(aStart).getTime()) / (1000 * 60 * 60 * 24)) + 1);
      // Approximate weekdays: 5/7 of days
      const weekdays = Math.round(days * 5 / 7);
      totalWorkHours += weekdays * (a.minutesPerDay / 60);
    }

    // Time off (days in window)
    let timeOffDays = 0;
    for (const l of rangeLeaves) {
      const lStart = l.startDate > startISO ? l.startDate : startISO;
      const lEnd = l.endDate < endISO ? l.endDate : endISO;
      const days = Math.max(1, Math.ceil((new Date(lEnd).getTime() - new Date(lStart).getTime()) / (1000 * 60 * 60 * 24)) + 1);
      timeOffDays += Math.round(days * 5 / 7);
    }

    // Capacity (weekdays in window * hours/day from contract)
    const totalDays = Math.ceil((threeWeeksLater.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const weekdays = Math.round(totalDays * 5 / 7);
    const hoursPerDay = activeContract?.minutesPerDay ? activeContract.minutesPerDay / 60 : 8;
    const capacityHours = (weekdays - timeOffDays) * hoursPerDay;

    // Utilization
    const utilization = capacityHours > 0 ? Math.round((totalWorkHours / capacityHours) * 100) : 0;

    // Billings (hourly rate * work hours)
    const hourlyRate = activeContract?.costRateHourly ?? 0;
    const billings = totalWorkHours * hourlyRate;

    return { utilization, timeOffDays, totalWorkHours, billings };
  }, [assignments, leaves, startISO, endISO, activeContract]);

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Snapshot &mdash; This Week &amp; Next 3 Weeks
        </h2>
        <span className="text-xs text-gray-400">{rangeLabel}</span>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Utilization" value={`${kpis.utilization}%`} />
        <KpiCard label="Time Off" value={kpis.timeOffDays > 0 ? `${kpis.timeOffDays} day${kpis.timeOffDays !== 1 ? 's' : ''}` : 'None'} />
        <KpiCard label="Work Assigned" value={`${Math.round(kpis.totalWorkHours)}h`} />
        <KpiCard label="Billings" value={formatCurrency(kpis.billings)} />
      </div>

      {/* Secondary info */}
      <div className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-white p-4 text-sm sm:grid-cols-4">
        <div>
          <p className="text-xs text-gray-500">Team</p>
          <p className="font-medium text-gray-900">{teamName}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Role</p>
          <p className="font-medium text-gray-900">{roleName}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Status</p>
          <p className="font-medium text-gray-900">{person.archived ? 'Archived' : 'Active'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Email</p>
          <p className="font-medium text-gray-900">{person.email ?? '\u2014'}</p>
        </div>
      </div>

      {/* Skills summary */}
      {skills.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Skills</h3>
            <Button variant="ghost" size="sm"><Plus className="h-3.5 w-3.5" /> Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((ps) => (
              <span
                key={ps.id}
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
              >
                {ps.name}
                <span className="text-yellow-500">{'★'.repeat(ps.level)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Contracts summary */}
      {contracts.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Current Contract</h3>
          {activeContract ? (
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs text-gray-500">Job Title</p>
                <p className="font-medium text-gray-900">{activeContract.jobTitle ?? '\u2014'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Employment</p>
                <p className="font-medium capitalize text-gray-900">{activeContract.employmentType?.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Start Date</p>
                <p className="font-medium text-gray-900">{formatDate(activeContract.startDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Cost/hr</p>
                <p className="font-medium text-gray-900">{formatCurrency(activeContract.costRateHourly)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No active contract.</p>
          )}
        </div>
      )}

      {/* Managers */}
      {person.managers && person.managers.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-gray-900">Managers</h3>
          <div className="flex flex-wrap gap-2">
            {person.managers.map((m) => (
              <span key={m.id} className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                {m.firstName} {m.lastName}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {person.tags && person.tags.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-gray-900">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {person.tags.map((tag) => (
              <span key={tag.id} className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="mb-1 text-xs font-medium uppercase text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Skills
// ---------------------------------------------------------------------------

function StarRating({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < level ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

function SkillsTab({ person }: { person: PersonDetail }) {
  const skills = person.skills ?? [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Skills</h3>
        <Button size="sm"><Plus className="h-3.5 w-3.5" /> Add Skill</Button>
      </div>

      {skills.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">No skills recorded.</p>
      ) : (
        <div className="space-y-2">
          {skills.map((ps) => (
            <div key={ps.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <span className="text-sm font-medium text-gray-900">{ps.name}</span>
              <StarRating level={ps.level} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Contracts
// ---------------------------------------------------------------------------

function ContractsTab({
  contracts,
  isLoading,
  roles,
}: {
  contracts: Contract[];
  isLoading: boolean;
  roles: Role[];
}) {
  const [subTab, setSubTab] = useState<'current' | 'previous'>('current');

  const roleMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of roles) m.set(r.id, r.name);
    return m;
  }, [roles]);

  const now = new Date().toISOString().slice(0, 10);
  const current = contracts.filter((c) => !c.endDate || c.endDate >= now);
  const previous = contracts.filter((c) => c.endDate && c.endDate < now);
  const display = subTab === 'current' ? current : previous;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-md bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-4">
          <button
            onClick={() => setSubTab('current')}
            className={`text-xs font-semibold uppercase tracking-wider ${
              subTab === 'current' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Current &amp; Future Contracts
          </button>
          <button
            onClick={() => setSubTab('previous')}
            className={`text-xs font-semibold uppercase tracking-wider ${
              subTab === 'previous' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Previous
          </button>
        </div>
        <Button size="sm"><Plus className="h-3.5 w-3.5" /> New Contract</Button>
      </div>

      {display.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">No contracts found.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Job Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Default Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Start Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">End Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Employment Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Work Days</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Hours/Day</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Cost/hr</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {display.map((c) => (
                <tr key={c.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{c.jobTitle ?? '\u2014'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{roleMap.get(c.roleId) ?? '\u2014'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{formatDate(c.startDate)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{formatDate(c.endDate)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium capitalize text-purple-700 ring-1 ring-inset ring-purple-700/10">
                      {c.employmentType?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {c.workDays ? <WorkDayBadges workDays={c.workDays} /> : '\u2014'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {c.minutesPerDay ? `${(c.minutesPerDay / 60).toFixed(1)}h` : '\u2014'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{formatCurrency(c.costRateHourly)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Time Off
// ---------------------------------------------------------------------------

function TimeOffTab({ personId }: { personId: string }) {
  const { data: leavesRes, isLoading } = useLeaves({ personId });
  const [subTab, setSubTab] = useState<'upcoming' | 'previous'>('upcoming');

  const leaves: ScheduledLeave[] = leavesRes?.data ?? [];
  const now = new Date().toISOString().slice(0, 10);
  const upcoming = leaves.filter((l) => l.endDate >= now);
  const previous = leaves.filter((l) => l.endDate < now);
  const display = subTab === 'upcoming' ? upcoming : previous;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-md bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-4">
          <button
            onClick={() => setSubTab('upcoming')}
            className={`text-xs font-semibold uppercase tracking-wider ${
              subTab === 'upcoming' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Time Off Coming Up
          </button>
          <button
            onClick={() => setSubTab('previous')}
            className={`text-xs font-semibold uppercase tracking-wider ${
              subTab === 'previous' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Previous Time Off
          </button>
        </div>
        <Button size="sm"><Plus className="h-3.5 w-3.5" /> New Scheduled Leave</Button>
      </div>

      {display.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">No time off {subTab === 'upcoming' ? 'scheduled' : 'recorded'}.</p>
      ) : (
        <div className="space-y-2">
          {display.map((leave) => (
            <div key={leave.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {leave.leaveType?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(leave.startDate)} &mdash; {formatDate(leave.endDate)}
                </p>
              </div>
              {leave.minutesPerDay && (
                <span className="text-sm text-gray-500">{(leave.minutesPerDay / 60).toFixed(1)}h/day</span>
              )}
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
      <div className="mb-8 flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-gray-200" />
        <div className="space-y-2">
          <div className="h-6 w-48 rounded bg-gray-200" />
          <div className="h-4 w-32 rounded bg-gray-200" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-10 w-full rounded bg-gray-100" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PersonDetailPage
// ---------------------------------------------------------------------------

export function PersonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: person, isLoading: personLoading } = usePerson(id!);
  const { data: contractsRes, isLoading: contractsLoading } = useContracts(id!);
  const { data: teamsRes } = useTeams();
  const { data: rolesRes } = useRoles();
  const [activeTab, setActiveTab] = useState<Tab>('snapshot');
  const [notesOpen, setNotesOpen] = useState(false);

  const contracts: Contract[] = contractsRes?.data ?? [];
  const teams: Team[] = teamsRes?.data ?? [];
  const roles: Role[] = rolesRes?.data ?? [];

  const teamName = person?.teamId
    ? teams.find((t) => t.id === person.teamId)?.name ?? '\u2014'
    : '\u2014';

  const activeContract = (person as any)?.activeContract as Contract | undefined;
  const roleName = activeContract?.roleId
    ? roles.find((r) => r.id === activeContract.roleId)?.name ?? '\u2014'
    : '\u2014';

  if (personLoading || !person) {
    return <DetailSkeleton />;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600">
            {getInitials(person)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {person.firstName} {person.lastName}
            </h1>
            <p className="text-sm text-gray-500">{roleName !== '\u2014' ? roleName : 'No role assigned'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/planner/people')}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open in Planner
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setNotesOpen(true)}
          >
            Notes
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
      {activeTab === 'snapshot' && (
        <SnapshotTab person={person} contracts={contracts} teamName={teamName} roleName={roleName} />
      )}
      {activeTab === 'skills' && <SkillsTab person={person} />}
      {activeTab === 'contracts' && (
        <ContractsTab contracts={contracts} isLoading={contractsLoading} roles={roles} />
      )}
      {activeTab === 'timeoff' && <TimeOffTab personId={id!} />}

      <NotesPanel
        entityType="person"
        entityId={id!}
        entityName={`${person.firstName} ${person.lastName}`}
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
      />
    </div>
  );
}
