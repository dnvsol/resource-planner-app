import { useState, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ProjectsPlannerView } from './ProjectsPlannerView';
import {
  useAssignments,
  usePeople,
  useProjects,
  useTeams,
  useRoles,
  useClients,
  useLeaves,
  type Assignment,
  type Person,
  type Project,
  type Role,
  type Client,
  type ScheduledLeave,
} from '@/shared/api/hooks';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Users,
  Settings2,
  Star,
  MoreVertical,
  ChevronDown,
  BarChart3,
  ArrowUpDown,
  Clock,
} from 'lucide-react';
import clsx from 'clsx';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WEEK_WIDTH = 48;
const LEFT_PANEL_WIDTH = 300;
const ROW_HEIGHT = 64;
const TEAM_ROW_HEIGHT = 36;
const BAR_HEIGHT = 36;
const TEAM_BAR_HEIGHT = 26;
const DEFAULT_MINUTES_PER_WEEK = 2400; // 8h × 5d × 60min
const HEADER_HEIGHT = 56; // month + week header
const SUB_ROW_HEIGHT = 48; // expanded sub-rows (Time Off, project assignments)
const ASSIGN_ROW_HEIGHT = 40; // Assign Project + Show all row

// Colors (matching Runn.io)
const COLOR_FULL = '#3b4694';
const COLOR_OVER_RED = '#c0392b';
const COLOR_FREE = '#94a8c4';
const COLOR_TEAM_BG = '#2d3561';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function getMonday(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function formatISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Week / Month types
// ---------------------------------------------------------------------------

interface WeekInfo {
  start: Date;
  end: Date;
  label: string; // day of month
  month: string;
  year: number;
}

interface MonthHeader {
  label: string;
  startIdx: number;
  span: number;
}

interface WeekAvail {
  capacity: number;
  allocated: number;
  diff: number;
}

interface MonthAvail {
  capacity: number;
  allocated: number;
  diff: number;
}

type AvailStatus = 'full' | 'over' | 'free' | 'empty';

// ---------------------------------------------------------------------------
// Generation helpers
// ---------------------------------------------------------------------------

function generateWeeks(from: Date, to: Date): WeekInfo[] {
  const weeks: WeekInfo[] = [];
  let current = getMonday(from);
  while (current < to) {
    const end = addDays(current, 6);
    weeks.push({
      start: new Date(current),
      end,
      label: String(current.getDate()),
      month: MONTHS[current.getMonth()],
      year: current.getFullYear(),
    });
    current = addDays(current, 7);
  }
  return weeks;
}

function buildMonthHeaders(weeks: WeekInfo[]): MonthHeader[] {
  const headers: MonthHeader[] = [];
  for (let i = 0; i < weeks.length; i++) {
    const key = `${weeks[i].month} '${String(weeks[i].year).slice(2)}`;
    const last = headers[headers.length - 1];
    if (last && last.label === key) {
      last.span++;
    } else {
      headers.push({ label: key, startIdx: i, span: 1 });
    }
  }
  return headers;
}

// ---------------------------------------------------------------------------
// Weekly availability calculation
// ---------------------------------------------------------------------------

function calcPersonWeekAvail(
  personId: string,
  weeks: WeekInfo[],
  assignments: Assignment[],
): WeekAvail[] {
  const pa = assignments.filter((a) => a.personId === personId);
  return weeks.map((week) => {
    let allocated = 0;
    for (const a of pa) {
      const aStart = new Date(a.startDate);
      const aEnd = new Date(a.endDate);
      for (let d = 0; d < 7; d++) {
        const day = addDays(week.start, d);
        const dow = day.getDay();
        if (dow === 0 || dow === 6) continue;
        if (day >= aStart && day <= aEnd) {
          allocated += a.minutesPerDay;
        }
      }
    }
    return {
      capacity: DEFAULT_MINUTES_PER_WEEK,
      allocated,
      diff: DEFAULT_MINUTES_PER_WEEK - allocated,
    };
  });
}

// ---------------------------------------------------------------------------
// Monthly aggregation
// ---------------------------------------------------------------------------

function aggregateMonthly(
  weekAvails: WeekAvail[],
  mHeaders: MonthHeader[],
): MonthAvail[] {
  return mHeaders.map((mh) => {
    let capacity = 0;
    let allocated = 0;
    for (let wi = mh.startIdx; wi < mh.startIdx + mh.span; wi++) {
      if (weekAvails[wi]) {
        capacity += weekAvails[wi].capacity;
        allocated += weekAvails[wi].allocated;
      }
    }
    return { capacity, allocated, diff: capacity - allocated };
  });
}

// ---------------------------------------------------------------------------
// Team monthly aggregation
// ---------------------------------------------------------------------------

function calcTeamMonthlyAvail(
  personIds: string[],
  mHeaders: MonthHeader[],
  allPersonMonthly: Map<string, MonthAvail[]>,
): MonthAvail[] {
  return mHeaders.map((_, mi) => {
    let capacity = 0;
    let allocated = 0;
    for (const pid of personIds) {
      const pm = allPersonMonthly.get(pid);
      if (pm && pm[mi]) {
        capacity += pm[mi].capacity;
        allocated += pm[mi].allocated;
      }
    }
    return { capacity, allocated, diff: capacity - allocated };
  });
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatMinutes(totalMin: number): string {
  const absMin = Math.abs(totalMin);
  const h = Math.floor(absMin / 60);
  const m = absMin % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatMinutesPerDay(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h/day`;
  return `${h}h ${m}m/day`;
}

function getAvailStatus(ma: MonthAvail): AvailStatus {
  if (ma.allocated === 0 && ma.capacity === 0) return 'empty';
  if (Math.abs(ma.diff) < 30 && ma.allocated > 0) return 'full';
  if (ma.diff < 0) return 'over';
  return 'free';
}

function getAvailLabel(ma: MonthAvail): string {
  const status = getAvailStatus(ma);
  if (status === 'empty') return '';
  if (status === 'full') return 'Full';
  if (status === 'over') return `${formatMinutes(-ma.diff)} over`;
  return `${formatMinutes(ma.diff)} free`;
}

// ---------------------------------------------------------------------------
// Avatar helper
// ---------------------------------------------------------------------------

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// ---------------------------------------------------------------------------
// Period / Sort options
// ---------------------------------------------------------------------------

type PeriodKey = 'month' | 'quarter' | 'half' | 'year';

const PERIODS: { key: PeriodKey; label: string; weeks: number }[] = [
  { key: 'month', label: 'Month', weeks: 5 },
  { key: 'quarter', label: 'Quarter', weeks: 13 },
  { key: 'half', label: 'Half Year', weeks: 26 },
  { key: 'year', label: 'Year', weeks: 52 },
];

type SortKey = 'firstName' | 'lastName';

const SORT_LABELS: Record<SortKey, string> = {
  firstName: 'First Name',
  lastName: 'Last Name',
};

// ---------------------------------------------------------------------------
// Toggle sub-component
// ---------------------------------------------------------------------------

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange?.(!enabled)}
      className={clsx(
        'relative h-[18px] w-[32px] rounded-full transition-colors',
        enabled ? 'bg-indigo-500' : 'bg-gray-300',
      )}
    >
      <div
        className={clsx(
          'absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-transform',
          enabled ? 'left-[16px]' : 'left-[2px]',
        )}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Monthly availability bar
// ---------------------------------------------------------------------------

function AvailBar({
  avail,
  barWidth,
  barHeight,
  isTeam,
}: {
  avail: MonthAvail;
  barWidth: number;
  barHeight: number;
  isTeam?: boolean;
}) {
  const status = getAvailStatus(avail);
  const label = getAvailLabel(avail);
  if (status === 'empty') return null;

  const bg = isTeam ? COLOR_TEAM_BG : COLOR_FULL;

  if (status === 'full') {
    return (
      <div
        className="flex items-center justify-center rounded-[3px]"
        style={{ width: barWidth, height: barHeight, backgroundColor: bg }}
      >
        <span className="text-[11px] font-medium text-white">{label}</span>
      </div>
    );
  }

  if (status === 'over') {
    if (isTeam) {
      // Team summary: solid dark background
      return (
        <div
          className="flex items-center justify-center rounded-[3px]"
          style={{ width: barWidth, height: barHeight, backgroundColor: COLOR_TEAM_BG }}
        >
          <span className="text-[11px] font-medium text-white">{label}</span>
        </div>
      );
    }
    // Person over: blue base + red top portion (proportional)
    const overAmt = -avail.diff;
    const total = avail.capacity + overAmt;
    const redPct = Math.min((overAmt / total) * 100, 70);
    return (
      <div
        className="relative flex items-center justify-center overflow-hidden rounded-[3px]"
        style={{ width: barWidth, height: barHeight }}
      >
        <div className="absolute inset-0" style={{ backgroundColor: COLOR_FULL }} />
        <div
          className="absolute inset-x-0 top-0"
          style={{ height: `${redPct}%`, backgroundColor: COLOR_OVER_RED }}
        />
        <span className="relative text-[11px] font-medium text-white">{label}</span>
      </div>
    );
  }

  // Free
  if (isTeam) {
    return (
      <div
        className="flex items-center justify-center rounded-[3px]"
        style={{ width: barWidth, height: barHeight, backgroundColor: COLOR_TEAM_BG }}
      >
        <span className="text-[11px] font-medium text-white">{label}</span>
      </div>
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-[3px]"
      style={{ width: barWidth, height: barHeight, backgroundColor: COLOR_FREE }}
    >
      <span className="text-[11px] font-medium text-white">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Project colors (for project view)
// ---------------------------------------------------------------------------

const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

function projectColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return PROJECT_COLORS[Math.abs(hash) % PROJECT_COLORS.length];
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function PlannerPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const viewMode = pathname.includes('/planner/projects') ? 'projects' : 'people';

  // State
  const [period, setPeriod] = useState<PeriodKey>('half');
  const [sortBy, setSortBy] = useState<SortKey>('firstName');
  const [collapsedTeams, setCollapsedTeams] = useState<Set<string>>(new Set());
  const [showTentative, setShowTentative] = useState(false);
  const [startDate, setStartDate] = useState(() => getMonday(new Date()));
  const [search] = useState('');
  const [expandedPersons, setExpandedPersons] = useState<Set<string>>(new Set());

  const periodCfg = PERIODS.find((p) => p.key === period)!;
  const totalWeeks = periodCfg.weeks;
  const endDate = addDays(startDate, totalWeeks * 7);

  // Data
  const { data: peopleData } = usePeople();
  const { data: projectsData } = useProjects();
  const { data: teamsData } = useTeams();
  const { data: rolesData } = useRoles();
  const { data: assignmentsData } = useAssignments({
    startDate: formatISO(startDate),
    endDate: formatISO(endDate),
  });

  const { data: clientsData } = useClients();
  const { data: leavesData } = useLeaves({
    startDate: formatISO(startDate),
    endDate: formatISO(endDate),
  });

  const people: Person[] = peopleData?.data ?? [];
  const projects: Project[] = projectsData?.data ?? [];
  const teams = teamsData?.data ?? [];
  const roles: Role[] = rolesData?.data ?? [];
  const assignments: Assignment[] = assignmentsData?.data ?? [];
  const clients: Client[] = clientsData?.data ?? [];
  const leaves: ScheduledLeave[] = leavesData?.data ?? [];

  const roleMap = useMemo(() => new Map(roles.map((r) => [r.id, r.name])), [roles]);
  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c.name])), [clients]);
  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  // Group assignments by personId → projectId
  const personProjectAssignments = useMemo(() => {
    const map = new Map<string, Map<string, Assignment[]>>();
    for (const a of assignments) {
      if (!map.has(a.personId)) map.set(a.personId, new Map());
      const byProject = map.get(a.personId)!;
      if (!byProject.has(a.projectId)) byProject.set(a.projectId, []);
      byProject.get(a.projectId)!.push(a);
    }
    return map;
  }, [assignments]);

  // Group leaves by personId
  const personLeavesMap = useMemo(() => {
    const map = new Map<string, ScheduledLeave[]>();
    for (const l of leaves) {
      if (!map.has(l.personId)) map.set(l.personId, []);
      map.get(l.personId)!.push(l);
    }
    return map;
  }, [leaves]);

  const getPersonProjectIds = (personId: string): string[] => {
    const pa = personProjectAssignments.get(personId);
    if (!pa) return [];
    return Array.from(pa.keys());
  };

  // Infer person role from assignments
  const personRoleMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of assignments) {
      if (!map.has(a.personId) && a.roleId) {
        map.set(a.personId, roleMap.get(a.roleId) ?? '');
      }
    }
    return map;
  }, [assignments, roleMap]);

  // Filter + sort
  const filteredPeople = useMemo(() => {
    let list = [...people];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
          (personRoleMap.get(p.id) ?? '').toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      const aVal = sortBy === 'firstName' ? a.firstName : a.lastName;
      const bVal = sortBy === 'firstName' ? b.firstName : b.lastName;
      return aVal.localeCompare(bVal);
    });
    return list;
  }, [people, search, sortBy, personRoleMap]);

  // Group by team
  const groupedPeople = useMemo(() => {
    const groups: { teamId: string; teamName: string; people: Person[] }[] = [];
    const byTeam = new Map<string, Person[]>();
    for (const p of filteredPeople) {
      const tid = p.teamId ?? '__none__';
      if (!byTeam.has(tid)) byTeam.set(tid, []);
      byTeam.get(tid)!.push(p);
    }
    for (const team of teams) {
      const tp = byTeam.get(team.id);
      if (tp && tp.length > 0) {
        groups.push({ teamId: team.id, teamName: team.name, people: tp });
      }
    }
    const noTeam = byTeam.get('__none__');
    if (noTeam && noTeam.length > 0) {
      groups.push({ teamId: '__none__', teamName: 'No Team', people: noTeam });
    }
    return groups;
  }, [filteredPeople, teams]);

  // Weeks & months
  const weeks = useMemo(() => generateWeeks(startDate, endDate), [startDate, endDate]);
  const mHeaders = useMemo(() => buildMonthHeaders(weeks), [weeks]);
  const timelineWidth = weeks.length * WEEK_WIDTH;

  // Per-person weekly availability
  const personWeekAvailMap = useMemo(() => {
    const map = new Map<string, WeekAvail[]>();
    for (const p of filteredPeople) {
      map.set(p.id, calcPersonWeekAvail(p.id, weeks, assignments));
    }
    return map;
  }, [filteredPeople, weeks, assignments]);

  // Per-person monthly availability
  const personMonthAvailMap = useMemo(() => {
    const map = new Map<string, MonthAvail[]>();
    for (const p of filteredPeople) {
      const weekAvails = personWeekAvailMap.get(p.id) ?? [];
      map.set(p.id, aggregateMonthly(weekAvails, mHeaders));
    }
    return map;
  }, [filteredPeople, personWeekAvailMap, mHeaders]);

  // Navigation
  const navigateWeeks = (n: number) => setStartDate((prev) => addDays(prev, n * 7));
  const goToToday = () => setStartDate(getMonday(new Date()));

  const toggleTeam = (teamId: string) => {
    setCollapsedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  };

  const togglePerson = (personId: string) => {
    setExpandedPersons((prev) => {
      const next = new Set(prev);
      if (next.has(personId)) next.delete(personId);
      else next.add(personId);
      return next;
    });
  };

  // Helper: pixel position for a date-range bar on the timeline
  const getBarPx = (aStart: string, aEnd: string) => {
    const dayWidth = WEEK_WIDTH / 7;
    const left = daysBetween(startDate, new Date(aStart)) * dayWidth;
    const width = (daysBetween(new Date(aStart), new Date(aEnd)) + 1) * dayWidth;
    return { left: Math.max(left, 0), width: Math.max(width, 4) };
  };

  // Today marker
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOffset = daysBetween(startDate, today);
  const todayPx = todayOffset * (WEEK_WIDTH / 7);
  const showTodayLine = todayPx >= 0 && todayPx <= timelineWidth;

  // Which week index is "today"
  const todayWeekIdx = weeks.findIndex((w) => {
    const wEnd = addDays(w.start, 6);
    return today >= w.start && today <= wEnd;
  });

  // Scroll sync refs
  const timelineHeaderRef = useRef<HTMLDivElement>(null);
  const timelineBodyRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  const handleTimelineScroll = () => {
    if (timelineBodyRef.current && timelineHeaderRef.current) {
      timelineHeaderRef.current.scrollLeft = timelineBodyRef.current.scrollLeft;
    }
  };
  const handleBodyScroll = () => {
    if (timelineBodyRef.current && leftPanelRef.current) {
      leftPanelRef.current.scrollTop = timelineBodyRef.current.scrollTop;
    }
  };

  // =========================================================================
  // PEOPLE VIEW
  // =========================================================================

  if (viewMode === 'people') {
    return (
      <div className="flex h-full flex-col bg-white">
        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
          {/* Left controls */}
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
              Availability (h)
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
              by{' '}
              <span className="font-medium text-gray-800">Team</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <BarChart3 className="h-4 w-4" />
              <span>Chart</span>
              <Toggle enabled={false} />
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <span>Tentative</span>
              <Toggle enabled={showTentative} onChange={setShowTentative} />
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
            <button
              onClick={() =>
                setSortBy((s) =>
                  s === 'firstName' ? 'lastName' : 'firstName',
                )
              }
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowUpDown className="h-4 w-4" />
              <span className="font-medium text-gray-800">
                {SORT_LABELS[sortBy]}
              </span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <button className="p-1 text-gray-400 hover:text-gray-600">
              <Settings2 className="h-4 w-4" />
            </button>
          </div>

          {/* Right navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateWeeks(-totalWeeks)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigateWeeks(-4)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goToToday}
              className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Today
            </button>
            <button
              onClick={() => navigateWeeks(4)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigateWeeks(totalWeeks)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodKey)}
              className="ml-2 cursor-pointer rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 focus:outline-none"
            >
              {PERIODS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Main grid area ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* ─── Left Panel ─── */}
          <div
            className="flex flex-col border-r border-gray-200 bg-white"
            style={{ width: LEFT_PANEL_WIDTH, minWidth: LEFT_PANEL_WIDTH }}
          >
            {/* Left header: + New + count */}
            <div
              className="flex items-center gap-3 border-b border-gray-200 px-3"
              style={{ height: HEADER_HEIGHT }}
            >
              <button
                onClick={() => navigate('/manage/people')}
                className="flex items-center gap-1.5 text-sm font-medium text-emerald-500 hover:text-emerald-600"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                  <Plus className="h-3 w-3 text-white" />
                </div>
                New
              </button>
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <Users className="h-3.5 w-3.5" />
                {filteredPeople.length} People
              </span>
            </div>

            {/* Left body (scroll-synced) */}
            <div ref={leftPanelRef} className="flex-1 overflow-hidden">
              {groupedPeople.map((group) => {
                const collapsed = collapsedTeams.has(group.teamId);
                return (
                  <div key={group.teamId}>
                    {/* Team header row */}
                    <div
                      className="flex items-center border-b border-gray-200 bg-white"
                      style={{ height: TEAM_ROW_HEIGHT }}
                    >
                      <button
                        onClick={() => toggleTeam(group.teamId)}
                        className="flex items-center gap-2 px-3 text-left"
                      >
                        <ChevronDown
                          className={clsx(
                            'h-3.5 w-3.5 text-gray-400 transition-transform',
                            collapsed && '-rotate-90',
                          )}
                        />
                        <span className="text-xs font-semibold text-gray-700">
                          {group.teamName}
                        </span>
                        <span className="flex items-center gap-0.5 text-xs text-gray-400">
                          <Users className="h-3 w-3" />
                          {group.people.length}
                        </span>
                      </button>
                    </div>

                    {/* Person rows */}
                    {!collapsed &&
                      group.people.map((person) => {
                        const isExpanded = expandedPersons.has(person.id);
                        const personProjectIds = getPersonProjectIds(person.id);
                        return (
                          <div key={person.id}>
                            {/* Main person row */}
                            <div
                              className="flex items-center gap-3 border-b border-gray-100 px-3 hover:bg-gray-50/50"
                              style={{ height: ROW_HEIGHT }}
                            >
                              {/* Avatar */}
                              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-400 text-[11px] font-bold text-white">
                                {getInitials(person.firstName, person.lastName)}
                              </div>

                              {/* Name + role (click navigates to detail) */}
                              <div
                                className="min-w-0 flex-1 cursor-pointer"
                                onClick={() => navigate(`/manage/people/${person.id}`)}
                              >
                                <div className="truncate text-sm font-semibold text-gray-900 hover:text-indigo-600">
                                  {person.firstName} {person.lastName}
                                </div>
                                <div className="truncate text-xs text-gray-500">
                                  {personRoleMap.get(person.id) || '\u2014'}
                                </div>
                              </div>

                              {/* Action icons */}
                              <div className="flex items-center gap-1">
                                <button className="rounded p-0.5 text-gray-300 hover:text-gray-500">
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </button>
                                <button className="rounded p-0.5 text-gray-300 hover:text-yellow-500">
                                  <Star className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => togglePerson(person.id)}
                                  className="rounded p-0.5 text-gray-400 hover:text-gray-600"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  ) : (
                                    <ChevronRight className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Expanded sub-rows */}
                            {isExpanded && (
                              <>
                                {/* Time Off row */}
                                <div
                                  className="flex items-center gap-3 border-b border-gray-100 pl-14 pr-3"
                                  style={{ height: SUB_ROW_HEIGHT }}
                                >
                                  <Clock className="h-5 w-5 text-gray-400" />
                                  <span className="text-sm font-medium text-gray-700">Time Off</span>
                                </div>

                                {/* Project sub-rows */}
                                {personProjectIds.map((projectId) => {
                                  const project = projectMap.get(projectId);
                                  if (!project) return null;
                                  const clientName = project.clientId
                                    ? clientMap.get(project.clientId)
                                    : null;
                                  const color = projectColor(projectId);
                                  return (
                                    <div
                                      key={projectId}
                                      className="flex items-center gap-3 border-b border-gray-100 pl-14 pr-3"
                                      style={{ height: SUB_ROW_HEIGHT }}
                                    >
                                      <span
                                        className="inline-block h-5 w-5 flex-shrink-0 rounded-[4px]"
                                        style={{ backgroundColor: color }}
                                      />
                                      <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-semibold text-gray-900">
                                          {project.name}
                                        </div>
                                        {clientName && (
                                          <div className="truncate text-xs text-gray-400">
                                            {clientName}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}

                                {/* Assign Project + Show all row */}
                                <div
                                  className="flex items-center justify-between border-b border-gray-100 pl-14 pr-3"
                                  style={{ height: ASSIGN_ROW_HEIGHT }}
                                >
                                  <button className="flex items-center gap-1.5 text-sm font-medium text-emerald-500 hover:text-emerald-600">
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                                      <Plus className="h-3 w-3 text-white" />
                                    </div>
                                    Assign Project
                                  </button>
                                  {personProjectIds.length > 0 && (
                                    <span className="flex items-center gap-1 text-xs text-gray-400">
                                      Show all ({personProjectIds.length})
                                      <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-gray-300 text-[9px] text-gray-400">?</span>
                                    </span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── Right: Timeline ─── */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Timeline header (months + weeks) */}
            <div
              ref={timelineHeaderRef}
              className="overflow-hidden border-b border-gray-200"
              style={{ height: HEADER_HEIGHT }}
            >
              <div style={{ width: timelineWidth }} className="relative h-full">
                {/* Month row */}
                <div className="flex h-7 border-b border-gray-200">
                  {mHeaders.map((mh, i) => (
                    <div
                      key={i}
                      className="flex items-center border-r border-gray-200 px-2 text-xs font-medium text-gray-500"
                      style={{ width: mh.span * WEEK_WIDTH }}
                    >
                      {mh.label}
                    </div>
                  ))}
                </div>
                {/* Week numbers row */}
                <div className="flex h-7">
                  {weeks.map((w, i) => {
                    // Is this the first week of a month?
                    const isMonthStart = mHeaders.some(
                      (mh) => mh.startIdx === i,
                    );
                    return (
                      <div
                        key={i}
                        className={clsx(
                          'flex items-center justify-center text-[11px]',
                          isMonthStart && i > 0
                            ? 'border-l border-gray-200'
                            : 'border-l border-gray-100',
                          todayWeekIdx === i
                            ? 'font-bold text-red-500'
                            : 'text-gray-400',
                        )}
                        style={{ width: WEEK_WIDTH }}
                      >
                        {w.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Timeline body */}
            <div
              ref={timelineBodyRef}
              className="flex-1 overflow-auto"
              onScroll={() => {
                handleTimelineScroll();
                handleBodyScroll();
              }}
            >
              <div style={{ width: timelineWidth }} className="relative">
                {/* Week column grid lines */}
                <div className="pointer-events-none absolute inset-0">
                  {weeks.map((_, wi) => {
                    const isMonthStart = mHeaders.some(
                      (mh) => mh.startIdx === wi,
                    );
                    return (
                      <div
                        key={wi}
                        className={clsx(
                          'absolute top-0 bottom-0',
                          isMonthStart && wi > 0
                            ? 'border-l border-gray-200'
                            : 'border-l border-gray-100/60',
                        )}
                        style={{ left: wi * WEEK_WIDTH }}
                      />
                    );
                  })}
                </div>

                {/* Today line */}
                {showTodayLine && (
                  <div
                    className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-red-400/60"
                    style={{ left: todayPx }}
                  />
                )}

                {/* Groups */}
                {groupedPeople.map((group) => {
                  const collapsed = collapsedTeams.has(group.teamId);
                  const teamMonthly = calcTeamMonthlyAvail(
                    group.people.map((p) => p.id),
                    mHeaders,
                    personMonthAvailMap,
                  );

                  return (
                    <div key={group.teamId}>
                      {/* Team summary row */}
                      <div
                        className="relative border-b border-gray-200"
                        style={{ height: TEAM_ROW_HEIGHT }}
                      >
                        {mHeaders.map((mh, mi) => {
                          const barLeft = mh.startIdx * WEEK_WIDTH + 1;
                          const barWidth = mh.span * WEEK_WIDTH - 2;
                          const barTop =
                            (TEAM_ROW_HEIGHT - TEAM_BAR_HEIGHT) / 2;
                          return (
                            <div
                              key={mi}
                              className="absolute"
                              style={{
                                left: barLeft,
                                top: barTop,
                              }}
                            >
                              <AvailBar
                                avail={teamMonthly[mi]}
                                barWidth={barWidth}
                                barHeight={TEAM_BAR_HEIGHT}
                                isTeam
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Person rows */}
                      {!collapsed &&
                        group.people.map((person) => {
                          const monthlyAvails =
                            personMonthAvailMap.get(person.id) ?? [];
                          const isExpanded = expandedPersons.has(person.id);
                          const personProjectIds = getPersonProjectIds(person.id);
                          const personLeaves = personLeavesMap.get(person.id) ?? [];

                          return (
                            <div key={person.id}>
                              {/* Main person availability row */}
                              <div
                                className="relative border-b border-gray-100"
                                style={{ height: ROW_HEIGHT }}
                              >
                                {mHeaders.map((mh, mi) => {
                                  const ma = monthlyAvails[mi];
                                  if (!ma) return null;
                                  const barLeft =
                                    mh.startIdx * WEEK_WIDTH + 1;
                                  const barWidth =
                                    mh.span * WEEK_WIDTH - 2;
                                  const barTop =
                                    (ROW_HEIGHT - BAR_HEIGHT) / 2;
                                  return (
                                    <div
                                      key={mi}
                                      className="absolute"
                                      style={{
                                        left: barLeft,
                                        top: barTop,
                                      }}
                                    >
                                      <AvailBar
                                        avail={ma}
                                        barWidth={barWidth}
                                        barHeight={BAR_HEIGHT}
                                      />
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Expanded sub-rows on timeline */}
                              {isExpanded && (
                                <>
                                  {/* Time Off timeline row */}
                                  <div
                                    className="relative border-b border-gray-100"
                                    style={{ height: SUB_ROW_HEIGHT }}
                                  >
                                    {personLeaves.map((leave) => {
                                      const { left, width } = getBarPx(
                                        leave.startDate,
                                        leave.endDate,
                                      );
                                      return (
                                        <div
                                          key={leave.id}
                                          className="absolute flex items-center rounded-[3px] px-1.5"
                                          style={{
                                            left,
                                            width,
                                            top: (SUB_ROW_HEIGHT - 24) / 2,
                                            height: 24,
                                            backgroundColor: '#fbbf2440',
                                            border: '1px solid #f59e0b60',
                                          }}
                                        >
                                          <span className="truncate text-[10px] font-medium text-amber-700">
                                            {leave.leaveType === 'leave'
                                              ? 'Leave'
                                              : leave.leaveType === 'holiday'
                                                ? 'Holiday'
                                                : 'RDO'}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Project assignment timeline rows */}
                                  {personProjectIds.map((projectId) => {
                                    const projectAssignments =
                                      personProjectAssignments
                                        .get(person.id)
                                        ?.get(projectId) ?? [];
                                    const color = projectColor(projectId);
                                    return (
                                      <div
                                        key={projectId}
                                        className="relative border-b border-gray-100"
                                        style={{ height: SUB_ROW_HEIGHT }}
                                      >
                                        {projectAssignments.map((a) => {
                                          const { left, width } = getBarPx(
                                            a.startDate,
                                            a.endDate,
                                          );
                                          return (
                                            <div
                                              key={a.id}
                                              className="absolute flex items-center overflow-hidden rounded-[3px] px-2"
                                              style={{
                                                left,
                                                width,
                                                top: (SUB_ROW_HEIGHT - 26) / 2,
                                                height: 26,
                                                backgroundColor: color + '30',
                                                border: `1.5px solid ${color}60`,
                                              }}
                                            >
                                              <span
                                                className="truncate text-[11px] font-semibold"
                                                style={{ color }}
                                              >
                                                {formatMinutesPerDay(a.minutesPerDay)}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    );
                                  })}

                                  {/* Assign Project empty timeline row */}
                                  <div
                                    className="relative border-b border-gray-100"
                                    style={{ height: ASSIGN_ROW_HEIGHT }}
                                  />
                                </>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // PROJECTS VIEW — delegated to dedicated component
  // =========================================================================

  return <ProjectsPlannerView />;
}
