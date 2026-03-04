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

const DAY_WIDTH = 40;
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
// Column / Availability types
// ---------------------------------------------------------------------------

interface ColumnInfo {
  date: Date;
  label: string;
  isWeekend: boolean;
  isToday: boolean;
  monthLabel: string | null;
  spanDays: number; // 1 for day columns, 7 for week columns
}

interface AvailGroup {
  startIdx: number;
  span: number;
}

interface WeekInfo {
  start: Date;
  end: Date;
  label: string;
  month: string;
  year: number;
}

interface AvailData {
  capacity: number;
  allocated: number;
  diff: number;
}

type AvailStatus = 'full' | 'over' | 'free' | 'empty';

function isWeekend(d: Date): boolean {
  const dow = d.getDay();
  return dow === 0 || dow === 6;
}

// ---------------------------------------------------------------------------
// Column generation helpers
// ---------------------------------------------------------------------------

function generateDayColumns(from: Date, numDays: number): ColumnInfo[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cols: ColumnInfo[] = [];
  let lastMonth = -1;

  for (let i = 0; i < numDays; i++) {
    const d = addDays(from, i);
    const month = d.getMonth();
    const isFirst = month !== lastMonth;
    lastMonth = month;

    cols.push({
      date: d,
      label: String(d.getDate()),
      isWeekend: isWeekend(d),
      isToday: d.getTime() === today.getTime(),
      monthLabel: isFirst ? `${MONTHS[month]} '${String(d.getFullYear()).slice(2)}` : null,
      spanDays: 1,
    });
  }
  return cols;
}

function generateWeekColumns(from: Date, numDays: number): ColumnInfo[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cols: ColumnInfo[] = [];
  let lastMonth = -1;
  let d = new Date(from);

  while (daysBetween(from, d) < numDays) {
    const monday = getMonday(d);
    const month = monday.getMonth();
    const isFirst = month !== lastMonth;
    lastMonth = month;

    const weekEnd = addDays(monday, 6);
    const todayInWeek = today >= monday && today <= weekEnd;

    cols.push({
      date: monday,
      label: String(monday.getDate()),
      isWeekend: false,
      isToday: todayInWeek,
      monthLabel: isFirst ? `${MONTHS[month]} '${String(monday.getFullYear()).slice(2)}` : null,
      spanDays: 7,
    });

    d = addDays(monday, 7);
  }
  return cols;
}

/** Build month header spans from columns */
function buildMonthSpans(columns: ColumnInfo[]): { label: string; startIdx: number; count: number }[] {
  const spans: { label: string; startIdx: number; count: number }[] = [];
  for (let i = 0; i < columns.length; i++) {
    if (columns[i].monthLabel) {
      spans.push({ label: columns[i].monthLabel!, startIdx: i, count: 1 });
    } else if (spans.length > 0) {
      spans[spans.length - 1].count++;
    }
  }
  return spans;
}

/** Build availability bar groups: per-week for day granularity, per-month for week granularity */
function buildAvailGroups(columns: ColumnInfo[], granularity: 'day' | 'week'): AvailGroup[] {
  if (granularity === 'week') {
    // Group by month
    const groups: AvailGroup[] = [];
    let currentLabel = '';
    for (let i = 0; i < columns.length; i++) {
      const mKey = `${columns[i].date.getFullYear()}-${columns[i].date.getMonth()}`;
      if (mKey !== currentLabel) {
        groups.push({ startIdx: i, span: 1 });
        currentLabel = mKey;
      } else {
        groups[groups.length - 1].span++;
      }
    }
    return groups;
  }
  // Day granularity: group by ISO week (Mon-Sun)
  const groups: AvailGroup[] = [];
  let currentWeekKey = '';
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    const monday = getMonday(col.date);
    const weekKey = formatISO(monday);
    if (weekKey !== currentWeekKey) {
      groups.push({ startIdx: i, span: 1 });
      currentWeekKey = weekKey;
    } else {
      groups[groups.length - 1].span++;
    }
  }
  return groups;
}

/** Convert old-style generateWeeks for availability calculation */
function generateWeeksForAvail(from: Date, to: Date): WeekInfo[] {
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

// ---------------------------------------------------------------------------
// Weekly availability calculation
// ---------------------------------------------------------------------------

function calcPersonWeekAvail(
  personId: string,
  weeks: WeekInfo[],
  assignments: Assignment[],
): AvailData[] {
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
// Availability aggregation (group-based: per-week or per-month)
// ---------------------------------------------------------------------------

/**
 * Map each AvailGroup to an AvailData by looking up the corresponding week
 * from the weekAvails array. For week-granularity groups (per-month),
 * multiple weeks are summed. For day-granularity groups (per-week),
 * each group maps to exactly one week.
 */
function aggregateGroupAvail(
  weekAvails: AvailData[],
  groups: AvailGroup[],
  columns: ColumnInfo[],
  allWeeks: WeekInfo[],
): AvailData[] {
  return groups.map((g) => {
    // Determine which weeks this group spans
    const groupStart = columns[g.startIdx]?.date;
    const lastColIdx = Math.min(g.startIdx + g.span - 1, columns.length - 1);
    const groupEnd = columns[lastColIdx]?.date;
    if (!groupStart || !groupEnd) return { capacity: 0, allocated: 0, diff: 0 };

    let capacity = 0;
    let allocated = 0;
    for (let wi = 0; wi < allWeeks.length; wi++) {
      const weekStart = allWeeks[wi].start;
      const weekEnd = allWeeks[wi].end;
      // Check if this week overlaps with the group date range
      if (weekEnd >= groupStart && weekStart <= groupEnd) {
        if (weekAvails[wi]) {
          capacity += weekAvails[wi].capacity;
          allocated += weekAvails[wi].allocated;
        }
      }
    }
    return { capacity, allocated, diff: capacity - allocated };
  });
}

function calcTeamGroupAvail(
  personIds: string[],
  groups: AvailGroup[],
  allPersonGroupAvails: Map<string, AvailData[]>,
): AvailData[] {
  return groups.map((_, gi) => {
    let capacity = 0;
    let allocated = 0;
    for (const pid of personIds) {
      const pm = allPersonGroupAvails.get(pid);
      if (pm && pm[gi]) {
        capacity += pm[gi].capacity;
        allocated += pm[gi].allocated;
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

function getAvailStatus(ma: AvailData): AvailStatus {
  if (ma.allocated === 0 && ma.capacity === 0) return 'empty';
  if (Math.abs(ma.diff) < 30 && ma.allocated > 0) return 'full';
  if (ma.diff < 0) return 'over';
  return 'free';
}

function getAvailLabel(ma: AvailData): string {
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

type PeriodKey = 'week' | 'month' | 'quarter' | 'half' | 'year';

const PERIODS: { key: PeriodKey; label: string; days: number; granularity: 'day' | 'week' }[] = [
  { key: 'week',    label: 'Week',      days: 7,   granularity: 'day' },
  { key: 'month',   label: 'Month',     days: 35,  granularity: 'day' },
  { key: 'quarter', label: 'Quarter',   days: 91,  granularity: 'day' },
  { key: 'half',    label: 'Half Year', days: 182, granularity: 'week' },
  { key: 'year',    label: 'Year',      days: 365, granularity: 'week' },
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
  avail: AvailData;
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
  const [showWeekends, setShowWeekends] = useState(true);
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);

  const periodCfg = PERIODS.find((p) => p.key === period)!;
  const numDays = periodCfg.days;
  const endDate = addDays(startDate, numDays);

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

  // Columns & layout
  const columns = useMemo(() => {
    let cols: ColumnInfo[];
    if (periodCfg.granularity === 'week') {
      cols = generateWeekColumns(startDate, numDays);
    } else {
      cols = generateDayColumns(startDate, numDays);
    }
    if (!showWeekends && periodCfg.granularity === 'day') {
      cols = cols.filter((c) => !c.isWeekend);
    }
    return cols;
  }, [startDate, numDays, periodCfg.granularity, showWeekends]);

  const colWidth = periodCfg.granularity === 'week' ? WEEK_WIDTH : DAY_WIDTH;
  const timelineWidth = columns.length * colWidth;

  const monthSpans = useMemo(() => buildMonthSpans(columns), [columns]);
  const availGroups = useMemo(() => buildAvailGroups(columns, periodCfg.granularity), [columns, periodCfg.granularity]);

  // Weeks for availability calculation (always full weeks covering the period)
  const availWeeks = useMemo(() => generateWeeksForAvail(startDate, endDate), [startDate, endDate]);

  // Per-person weekly availability
  const personWeekAvailMap = useMemo(() => {
    const map = new Map<string, AvailData[]>();
    for (const p of filteredPeople) {
      map.set(p.id, calcPersonWeekAvail(p.id, availWeeks, assignments));
    }
    return map;
  }, [filteredPeople, availWeeks, assignments]);

  // Per-person group availability (per-week bars for day gran, per-month for week gran)
  const personGroupAvailMap = useMemo(() => {
    const map = new Map<string, AvailData[]>();
    for (const p of filteredPeople) {
      const weekAvails = personWeekAvailMap.get(p.id) ?? [];
      map.set(p.id, aggregateGroupAvail(weekAvails, availGroups, columns, availWeeks));
    }
    return map;
  }, [filteredPeople, personWeekAvailMap, availGroups, columns, availWeeks]);

  // Navigation
  const navigateDays = (n: number) => setStartDate((prev) => addDays(prev, n));
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
    if (periodCfg.granularity === 'week') {
      const dayOffset = daysBetween(startDate, new Date(aStart));
      const daySpan = daysBetween(new Date(aStart), new Date(aEnd)) + 1;
      const left = (dayOffset / 7) * colWidth;
      const width = (daySpan / 7) * colWidth;
      return { left: Math.max(left, 0), width: Math.max(width, 4) };
    }
    if (!showWeekends) {
      // Count only weekday columns
      let leftCols = 0;
      let cur = new Date(startDate);
      const barStart = new Date(aStart);
      while (cur < barStart) {
        if (!isWeekend(cur)) leftCols++;
        cur = addDays(cur, 1);
      }
      let widthCols = 0;
      const barEnd = new Date(aEnd);
      cur = new Date(barStart);
      while (cur <= barEnd) {
        if (!isWeekend(cur)) widthCols++;
        cur = addDays(cur, 1);
      }
      return { left: Math.max(leftCols * colWidth, 0), width: Math.max(widthCols * colWidth, 4) };
    }
    // Day view with weekends
    const left = daysBetween(startDate, new Date(aStart)) * colWidth;
    const width = (daysBetween(new Date(aStart), new Date(aEnd)) + 1) * colWidth;
    return { left: Math.max(left, 0), width: Math.max(width, 4) };
  };

  // Today marker — find the column containing today
  const todayColIdx = columns.findIndex((c) => c.isToday);

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
              onClick={() => navigateDays(-numDays)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigateDays(-7)}
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
              onClick={() => navigateDays(7)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigateDays(numDays)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
            {/* Period selector dropdown */}
            <div className="relative ml-2">
              <button
                onClick={() => setShowPeriodMenu(!showPeriodMenu)}
                className="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                {periodCfg.label}
                <ChevronDown className="h-3 w-3" />
              </button>
              {showPeriodMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowPeriodMenu(false)} />
                  <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    {PERIODS.map((p) => (
                      <button
                        key={p.key}
                        onClick={() => { setPeriod(p.key); setShowPeriodMenu(false); }}
                        className={clsx(
                          'block w-full px-3 py-1.5 text-left text-sm',
                          period === p.key ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-gray-700 hover:bg-gray-50',
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                    <div className="my-1 border-t border-gray-100" />
                    <label className="flex cursor-pointer items-center gap-2 px-3 py-1.5">
                      <input
                        type="checkbox"
                        checked={showWeekends}
                        onChange={(e) => setShowWeekends(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600"
                        disabled={periodCfg.granularity === 'week'}
                      />
                      <span className={clsx('text-sm', periodCfg.granularity === 'week' ? 'text-gray-400' : 'text-gray-700')}>
                        Show Weekends
                      </span>
                    </label>
                  </div>
                </>
              )}
            </div>
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
            {/* Timeline header (months + column labels) */}
            <div
              ref={timelineHeaderRef}
              className="overflow-hidden border-b border-gray-200"
              style={{ height: HEADER_HEIGHT }}
            >
              <div style={{ width: timelineWidth }} className="relative h-full">
                {/* Month row */}
                <div className="relative h-7 border-b border-gray-200">
                  {monthSpans.map((ms, i) => (
                    <div
                      key={i}
                      className="absolute flex items-center px-2 text-xs font-medium text-gray-500"
                      style={{
                        left: ms.startIdx * colWidth,
                        width: ms.count * colWidth,
                        height: 28,
                        borderRight: '1px solid #e5e7eb',
                      }}
                    >
                      {ms.label}
                    </div>
                  ))}
                </div>
                {/* Column labels row */}
                <div className="flex h-7">
                  {columns.map((col, i) => {
                    const isMonday = col.date.getDay() === 1;
                    return (
                      <div
                        key={i}
                        className={clsx(
                          'flex items-center justify-center text-[11px]',
                          periodCfg.granularity === 'day'
                            ? (isMonday && i > 0 ? 'border-l border-gray-200' : 'border-l border-gray-100/60')
                            : (col.monthLabel && i > 0 ? 'border-l border-gray-200' : 'border-l border-gray-100'),
                          col.isToday
                            ? 'font-bold text-red-500'
                            : col.isWeekend
                              ? 'text-gray-300'
                              : 'text-gray-400',
                        )}
                        style={{ width: colWidth }}
                      >
                        {col.label}
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
                {/* Column grid lines + weekend shading */}
                <div className="pointer-events-none absolute inset-0">
                  {/* Weekend shading (day granularity only) */}
                  {periodCfg.granularity === 'day' && columns.map((col, i) =>
                    col.isWeekend ? (
                      <div
                        key={`we-${i}`}
                        className="absolute bottom-0 top-0 bg-gray-50/80"
                        style={{ left: i * colWidth, width: colWidth }}
                      />
                    ) : null,
                  )}
                  {/* Grid lines */}
                  {columns.map((col, i) => {
                    if (i === 0) return null;
                    const isMonday = col.date.getDay() === 1;
                    const strong = periodCfg.granularity === 'day'
                      ? isMonday
                      : !!col.monthLabel;
                    return (
                      <div
                        key={i}
                        className={clsx(
                          'absolute top-0 bottom-0',
                          strong ? 'border-l border-gray-200' : 'border-l border-gray-100/60',
                        )}
                        style={{ left: i * colWidth }}
                      />
                    );
                  })}
                </div>

                {/* Today line */}
                {todayColIdx >= 0 && (
                  <div
                    className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-red-400/60"
                    style={{ left: todayColIdx * colWidth + colWidth / 2 }}
                  />
                )}

                {/* Groups */}
                {groupedPeople.map((group) => {
                  const collapsed = collapsedTeams.has(group.teamId);
                  const teamGroupAvails = calcTeamGroupAvail(
                    group.people.map((p) => p.id),
                    availGroups,
                    personGroupAvailMap,
                  );

                  return (
                    <div key={group.teamId}>
                      {/* Team summary row */}
                      <div
                        className="relative border-b border-gray-200"
                        style={{ height: TEAM_ROW_HEIGHT }}
                      >
                        {availGroups.map((ag, gi) => {
                          const barLeft = ag.startIdx * colWidth + 1;
                          const barWidth = ag.span * colWidth - 2;
                          const barTop =
                            (TEAM_ROW_HEIGHT - TEAM_BAR_HEIGHT) / 2;
                          return (
                            <div
                              key={gi}
                              className="absolute"
                              style={{
                                left: barLeft,
                                top: barTop,
                              }}
                            >
                              <AvailBar
                                avail={teamGroupAvails[gi]}
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
                          const groupAvails =
                            personGroupAvailMap.get(person.id) ?? [];
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
                                {availGroups.map((ag, gi) => {
                                  const ma = groupAvails[gi];
                                  if (!ma) return null;
                                  const barLeft =
                                    ag.startIdx * colWidth + 1;
                                  const barWidth =
                                    ag.span * colWidth - 2;
                                  const barTop =
                                    (ROW_HEIGHT - BAR_HEIGHT) / 2;
                                  return (
                                    <div
                                      key={gi}
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
