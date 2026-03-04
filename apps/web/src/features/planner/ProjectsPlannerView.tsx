import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useAssignments,
  useProjects,
  useProject,
  usePeople,
  useRoles,
  useClients,
  useTeams,
  useTags,
  useCreateAssignment,
  useCreateProject,
  useDeleteProject,
  useUpdateProject,
  useUpdateAssignment,
  useDeleteAssignment,
  type Assignment,
  type Project,
  type Role,
  type Client,
  type Person,
  type Tag,
} from '@/shared/api/hooks';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Plus,
  MoreVertical,
  Star,
  Search,
  Filter,
  Settings2,
  BarChart3,
  Eye,
  X,
  Pencil,
  ExternalLink,
  StickyNote,
  Copy,
  Archive,
  Trash2,
  Clock,
  Calendar,
  User,
  UserMinus,
  FileText,
  MessageSquare,
} from 'lucide-react';
import clsx from 'clsx';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAY_WIDTH = 40;
const WEEK_COL_WIDTH = 40; // for weekly view in half/year
const LEFT_PANEL_WIDTH = 380;
const PROJECT_ROW_HEIGHT = 56;
const PHASE_ROW_HEIGHT = 32;
const ROLE_ROW_HEIGHT = 36;
const PERSON_ROW_HEIGHT = 44;
const ADD_ROW_HEIGHT = 36;

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

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
// Format helpers
// ---------------------------------------------------------------------------

/** Format minutes per day as "Xh Ym/day" like Runn — e.g. 96 min → "1h 36m/day" */
function formatMinutesPerDay(minutesPerDay: number): string {
  const h = Math.floor(minutesPerDay / 60);
  const m = Math.round(minutesPerDay % 60);
  if (h === 0) return `${m}m/day`;
  if (m === 0) return `${h}h/day`;
  return `${h}h ${m}m/day`;
}

/** Format total hours with comma separator, e.g. 7683.2 → "7,683.2h" */
function formatTotalHours(hours: number): string {
  const rounded = Math.round(hours * 10) / 10;
  return rounded.toLocaleString('en-US', { minimumFractionDigits: rounded % 1 ? 1 : 0, maximumFractionDigits: 1 }) + 'h';
}

/** Format assignment bar label based on display unit */
function formatBarLabel(minutesPerDay: number, unit: DisplayUnit): string {
  switch (unit) {
    case 'hours_day': return formatMinutesPerDay(minutesPerDay);
    case 'hours_wk': {
      const hPerWeek = (minutesPerDay * 5) / 60;
      return `${Math.round(hPerWeek * 10) / 10}h/wk`;
    }
    case 'fte': {
      const fte = minutesPerDay / 480; // 8h = 480min baseline
      return `${Math.round(fte * 100) / 100} FTE`;
    }
    case 'capacity_pct': {
      const pct = Math.round((minutesPerDay / 480) * 100);
      return `${pct}%`;
    }
  }
}

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

function isWeekend(d: Date): boolean {
  const dow = d.getDay();
  return dow === 0 || dow === 6;
}

// ---------------------------------------------------------------------------
// Column info — supports both daily and weekly granularity
// ---------------------------------------------------------------------------

interface ColumnInfo {
  date: Date;       // start date of column (day or week start)
  label: string;    // displayed number/text
  isWeekend: boolean;
  isToday: boolean;
  monthLabel: string | null;
  spanDays: number; // 1 for day columns, 5-7 for week columns
}

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

/** Generate weekly columns — each column represents one week (Mon date shown) */
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

    // Check if today falls within this week
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

// ---------------------------------------------------------------------------
// Period
// ---------------------------------------------------------------------------

type PeriodKey = 'week' | 'month' | 'quarter' | 'half' | 'year';

const PERIODS: { key: PeriodKey; label: string; days: number; granularity: 'day' | 'week' }[] = [
  { key: 'week', label: 'Week', days: 7, granularity: 'day' },
  { key: 'month', label: 'Month', days: 35, granularity: 'day' },
  { key: 'quarter', label: 'Quarter', days: 91, granularity: 'day' },
  { key: 'half', label: 'Half Year', days: 182, granularity: 'week' },
  { key: 'year', label: 'Year', days: 365, granularity: 'week' },
];

// ---------------------------------------------------------------------------
// Sort / Group
// ---------------------------------------------------------------------------

type SortKey = 'name' | 'client' | 'startDate' | 'endDate';
type GroupKey = 'all' | 'status' | 'client' | 'team' | 'pricingModel' | 'tags';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Project Name' },
  { key: 'client', label: 'Client Name' },
  { key: 'startDate', label: 'Start Date' },
  { key: 'endDate', label: 'End Date' },
];

const GROUP_OPTIONS: { key: GroupKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'status', label: 'Status' },
  { key: 'client', label: 'Client' },
  { key: 'team', label: 'Primary Team' },
  { key: 'pricingModel', label: 'Pricing Model' },
  { key: 'tags', label: 'Tags' },
];

// ---------------------------------------------------------------------------
// Display unit
// ---------------------------------------------------------------------------

type DisplayUnit = 'hours_day' | 'hours_wk' | 'fte' | 'capacity_pct';
type EffortView = 'hours' | 'days' | 'revenue';

// ---------------------------------------------------------------------------
// Filter types
// ---------------------------------------------------------------------------

type FilterKey = 'starred' | 'projectName' | 'client' | 'status' | 'pricingModel' | 'team' | 'tags' | 'people';

interface ActiveFilter {
  key: FilterKey;
  label: string;
  value: string; // serialized filter value
  values: string[]; // for multi-select filters
}

// ---------------------------------------------------------------------------
// Expand state types
// ---------------------------------------------------------------------------

interface ProjectRoleGroup {
  roleId: string;
  roleName: string;
  persons: {
    personId: string;
    personName: string;
    assignments: Assignment[];
  }[];
  totalHours: number;
  personCount: number;
  uniquePersonCount: number;
}

// ---------------------------------------------------------------------------
// Dropdown menu component
// ---------------------------------------------------------------------------

function DropdownMenu({
  items,
  onClose,
}: {
  items: { label: string; icon?: React.ReactNode; onClick?: () => void; danger?: boolean; divider?: boolean; disabled?: boolean; info?: string }[];
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
        {items.map((item, i) =>
          item.divider ? (
            <div key={i} className="my-1 border-t border-gray-100" />
          ) : item.info ? (
            <div key={i} className="flex items-center justify-between px-3 py-1.5 text-xs text-gray-400">
              <span>{item.label}</span>
              <span className="flex items-center gap-1 font-mono">{item.info}</span>
            </div>
          ) : (
            <button
              key={i}
              onClick={() => { item.onClick?.(); onClose(); }}
              disabled={item.disabled}
              className={clsx(
                'flex w-full items-center gap-2 px-3 py-1.5 text-sm',
                item.danger
                  ? 'text-red-600 hover:bg-red-50'
                  : item.disabled
                    ? 'cursor-not-allowed text-gray-300'
                    : 'text-gray-700 hover:bg-gray-50',
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ),
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Toggle
// ---------------------------------------------------------------------------

function Toggle({ enabled, onChange, disabled }: { enabled: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange?.(!enabled)}
      className={clsx(
        'relative h-[18px] w-[32px] rounded-full transition-colors',
        disabled ? 'cursor-not-allowed opacity-50' : '',
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
// Filter Sub-Menu (multi-select popover for filter options)
// ---------------------------------------------------------------------------

function FilterSelectMenu({
  title,
  options,
  selected,
  onToggle,
  onClose,
}: {
  title: string;
  options: { id: string; label: string }[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = search.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute left-0 top-full z-50 mt-1 w-[240px] rounded-lg border border-gray-200 bg-white shadow-lg">
        <div className="border-b border-gray-100 px-3 py-2">
          <span className="text-xs font-semibold text-gray-600">{title}</span>
        </div>
        <div className="px-3 py-1.5">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded border border-gray-200 px-2 py-1 text-xs placeholder-gray-400 focus:border-indigo-400 focus:outline-none"
          />
        </div>
        <div className="max-h-[200px] overflow-y-auto py-1">
          {filtered.map((opt) => (
            <label
              key={opt.id}
              className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selected.has(opt.id)}
                onChange={() => onToggle(opt.id)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600"
              />
              <span className="truncate">{opt.label}</span>
            </label>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-2 text-xs text-gray-400">No matches</p>
          )}
        </div>
      </div>
    </>
  );
}

function FilterTextMenu({
  title,
  value,
  onChange,
  onClose,
}: {
  title: string;
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute left-0 top-full z-50 mt-1 w-[240px] rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
        <span className="mb-2 block text-xs font-semibold text-gray-600">{title}</span>
        <input
          type="text"
          placeholder={`Type ${title.toLowerCase()}...`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
          className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm placeholder-gray-400 focus:border-indigo-400 focus:outline-none"
        />
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Add Person Dialog
// ---------------------------------------------------------------------------

function AddPersonDialog({
  project,
  roles,
  people,
  existingPersonIds,
  onAdd,
  onClose,
}: {
  project: Project;
  roles: Role[];
  people: Person[];
  existingPersonIds: Set<string>;
  onAdd: (entries: { personId: string; roleId: string }[]) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedMap, setSelectedMap] = useState<Map<string, string>>(new Map()); // personId → roleId
  const defaultRoleId = roles[0]?.id ?? '';

  const filteredPeople = search.trim()
    ? people.filter(
        (p) =>
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()),
      )
    : people;

  const togglePerson = (personId: string) => {
    setSelectedMap((prev) => {
      const next = new Map(prev);
      if (next.has(personId)) next.delete(personId);
      else next.set(personId, defaultRoleId);
      return next;
    });
  };

  const setPersonRole = (personId: string, roleId: string) => {
    setSelectedMap((prev) => {
      const next = new Map(prev);
      next.set(personId, roleId);
      return next;
    });
  };

  const handleSubmit = () => {
    const entries = Array.from(selectedMap.entries()).map(([personId, roleId]) => ({
      personId,
      roleId,
    }));
    if (entries.length > 0) onAdd(entries);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-[51] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <ProjectIcon project={project} />
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{project.name}</h3>
              <p className="text-xs text-gray-500">Add people to this project</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search people..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-gray-200 py-2 pl-9 pr-3 text-sm placeholder-gray-400 focus:border-indigo-400 focus:outline-none"
            />
          </div>
        </div>

        {/* People list */}
        <div className="max-h-[320px] overflow-y-auto py-2">
          {filteredPeople.map((person) => {
            const fullName = `${person.firstName} ${person.lastName}`;
            const initials = (person.firstName[0] + (person.lastName[0] ?? '')).toUpperCase();
            const isOnProject = existingPersonIds.has(person.id);
            const isSelected = selectedMap.has(person.id);

            return (
              <div
                key={person.id}
                className="flex items-center gap-3 px-5 py-2 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => togglePerson(person.id)}
                  disabled={isOnProject}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600"
                />
                <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-300 text-[10px] font-medium text-gray-700">
                  {initials}
                </span>
                <span className="flex-1 truncate text-sm text-gray-800">{fullName}</span>
                {isOnProject && (
                  <span className="rounded bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-600">
                    On project
                  </span>
                )}
                {isSelected && (
                  <select
                    value={selectedMap.get(person.id) ?? ''}
                    onChange={(e) => setPersonRole(person.id, e.target.value)}
                    className="rounded border border-gray-200 px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3">
          <span className="text-xs text-gray-500">
            {selectedMap.size} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedMap.size === 0}
              className="rounded-md bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Add Selected
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Project Icon
// ---------------------------------------------------------------------------

function ProjectIcon({ project }: { project: Project }) {
  if (project.emoji) return <span className="text-lg">{project.emoji}</span>;
  const color = projectColor(project.id);
  return (
    <span
      className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {project.name.charAt(0).toUpperCase()}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Display Settings Panel
// ---------------------------------------------------------------------------

function DisplaySettingsPanel({
  unit,
  onUnitChange,
  showTotalEffort,
  onShowTotalEffortChange,
  alwaysShowPhases,
  onAlwaysShowPhasesChange,
  onClose,
}: {
  unit: DisplayUnit;
  onUnitChange: (u: DisplayUnit) => void;
  showTotalEffort: boolean;
  onShowTotalEffortChange: (v: boolean) => void;
  alwaysShowPhases: boolean;
  onAlwaysShowPhasesChange: (v: boolean) => void;
  onClose: () => void;
}) {
  const units: { key: DisplayUnit; label: string }[] = [
    { key: 'hours_day', label: 'Hours/day' },
    { key: 'hours_wk', label: 'Hours/wk' },
    { key: 'fte', label: 'FTE' },
    { key: 'capacity_pct', label: 'Capacity %' },
  ];

  return (
    <div className="absolute right-0 top-0 z-30 h-full w-[320px] border-l border-gray-200 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-800">Project Settings</span>
        </div>
        <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-6 p-4">
        {/* Always Show Phases */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Always Show Phases</span>
          <Toggle enabled={alwaysShowPhases} onChange={onAlwaysShowPhasesChange} />
        </div>

        {/* Assignments Unit */}
        <div>
          <h4 className="text-sm font-semibold text-gray-800">Assignments</h4>
          <h5 className="mt-2 text-xs font-medium text-gray-600">Unit</h5>
          <p className="mt-0.5 text-xs text-gray-400">Choose how to display assignment units.</p>
          <div className="mt-2 flex gap-1">
            {units.map((u) => (
              <button
                key={u.key}
                onClick={() => onUnitChange(u.key)}
                className={clsx(
                  'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                  unit === u.key
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300',
                )}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        {/* Show Total Effort */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-xs font-medium text-gray-600">Show Total Effort</h5>
              <p className="mt-0.5 text-xs text-gray-400">Show total effort for each assignment (based on the selected unit).</p>
            </div>
            <Toggle enabled={showTotalEffort} onChange={onShowTotalEffortChange} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Assignment Edit Popover (Runn-style inline editor)
// ---------------------------------------------------------------------------

interface AssignmentEditState {
  assignment: Assignment;
  personName: string;
  projectColor: string;
  anchorRect: { top: number; left: number; width: number };
}

function AssignmentEditPopover({
  state,
  onClose,
  onSave,
  onDelete,
}: {
  state: AssignmentEditState;
  onClose: () => void;
  onSave: (id: string, changes: Partial<Assignment>) => void;
  onDelete: (id: string) => void;
}) {
  const a = state.assignment;
  const [minutesPerDay, setMinutesPerDay] = useState(a.minutesPerDay);
  const [isBillable, setIsBillable] = useState(a.isBillable);
  const [note, setNote] = useState(a.note ?? '');
  const [showNote, setShowNote] = useState(!!a.note);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Calculate work days (weekdays between start and end)
  const workDays = useMemo(() => {
    let count = 0;
    const s = new Date(a.startDate);
    const e = new Date(a.endDate);
    const cur = new Date(s);
    while (cur <= e) {
      if (cur.getDay() !== 0 && cur.getDay() !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }, [a.startDate, a.endDate]);

  const totalHoursVal = (workDays * minutesPerDay) / 60;

  // Position popover
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  useEffect(() => {
    const { top, left, width } = state.anchorRect;
    const popW = 320;
    let posLeft = left + width / 2 - popW / 2;
    if (posLeft < 8) posLeft = 8;
    if (posLeft + popW > window.innerWidth - 8) posLeft = window.innerWidth - popW - 8;
    let posTop = top + 36; // below the bar
    if (posTop + 360 > window.innerHeight) posTop = top - 360;
    setPosition({ top: posTop, left: posLeft });
  }, [state.anchorRect]);

  const handleSave = () => {
    onSave(a.id, {
      minutesPerDay,
      isBillable,
      note: note.trim() || null,
    });
    onClose();
  };

  const handleDelete = () => {
    if (confirm('Delete this assignment?')) {
      onDelete(a.id);
      onClose();
    }
  };

  const hoursPerDay = minutesPerDay / 60;
  const hStr = Math.floor(hoursPerDay);
  const mStr = Math.round((hoursPerDay - hStr) * 60);

  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <div
        ref={popoverRef}
        className="fixed z-[51] w-[320px] rounded-lg border border-gray-200 bg-white shadow-xl"
        style={{ top: position.top, left: position.left }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: state.projectColor }} />
            <span className="text-sm font-medium text-gray-800">{state.personName}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 px-4 py-3">
          {/* Effort (hours per day) */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Effort</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={1440}
                step={30}
                value={minutesPerDay}
                onChange={(e) => setMinutesPerDay(Math.max(0, Number(e.target.value)))}
                className="w-16 rounded border border-gray-200 px-2 py-1 text-right text-sm text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-200"
              />
              <span className="text-xs text-gray-400">min/d</span>
              <span className="ml-1 text-xs text-gray-500">({hStr}:{String(mStr).padStart(2, '0')} h/d)</span>
            </div>
          </div>

          {/* Work Days */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Work Days</span>
            <span className="text-sm font-medium text-gray-700">{workDays}</span>
          </div>

          {/* Total Effort */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Total Effort</span>
            <span className="text-sm font-medium text-gray-700">
              {formatTotalHours(totalHoursVal)}
            </span>
          </div>

          {/* Date range */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Dates</span>
            <span className="text-xs text-gray-600">{a.startDate} → {a.endDate}</span>
          </div>

          {/* Non-Billable checkbox */}
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={!isBillable}
              onChange={(e) => setIsBillable(!e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs text-gray-600">Non-Billable</span>
          </label>

          {/* Note toggle + field */}
          {!showNote ? (
            <button
              onClick={() => setShowNote(true)}
              className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700"
            >
              <MessageSquare className="h-3 w-3" />
              Add Note
            </button>
          ) : (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-200"
              rows={2}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2.5">
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
          <button
            onClick={handleSave}
            className="rounded-md bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Phase Bars Row (fetches project detail for phase data)
// ---------------------------------------------------------------------------

function PhaseBarRow({
  projectId,
  getBarPx,
  height,
}: {
  projectId: string;
  getBarPx: (start: string, end: string) => { left: number; width: number };
  height: number;
}) {
  const { data: projectDetail } = useProject(projectId, { staleTime: 60_000 });
  const phases = projectDetail?.phases ?? [];

  return (
    <div className="relative border-b border-gray-50" style={{ height }}>
      {phases.map((phase) => {
        if (!phase.startDate || !phase.endDate) return null;
        const { left, width } = getBarPx(phase.startDate, phase.endDate);
        return (
          <div
            key={phase.id}
            className="absolute flex items-center overflow-hidden rounded-sm px-1"
            style={{
              left,
              width,
              top: (height - 20) / 2,
              height: 20,
              backgroundColor: phase.color || '#94a3b8',
              opacity: 0.6,
            }}
            title={`${phase.name}: ${phase.startDate} → ${phase.endDate}`}
          >
            <span className="truncate text-[10px] font-medium text-white">{phase.name}</span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ProjectsPlannerView() {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const updateProject = useUpdateProject();
  const createAssignment = useCreateAssignment();
  const updateAssignment = useUpdateAssignment();
  const deleteAssignment = useDeleteAssignment();
  const [editingAssignment, setEditingAssignment] = useState<AssignmentEditState | null>(null);

  // State
  const [period, setPeriod] = useState<PeriodKey>('month');
  const [startDate, setStartDate] = useState(() => getMonday(new Date()));
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [showTentative, setShowTentative] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [groupBy, setGroupBy] = useState<GroupKey>('all');
  const [starredProjects, setStarredProjects] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [displayUnit, setDisplayUnit] = useState<DisplayUnit>('hours_day');
  const [showTotalEffort, setShowTotalEffort] = useState(false);
  const [alwaysShowPhases, setAlwaysShowPhases] = useState(false);
  const [showWeekends, setShowWeekends] = useState(true);
  const [effortView, setEffortView] = useState<EffortView>('hours');
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [projectMenu, setProjectMenu] = useState<string | null>(null);
  const [personMenu, setPersonMenu] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [addPersonProject, setAddPersonProject] = useState<Project | null>(null);

  // Filter state
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [filterSubMenu, setFilterSubMenu] = useState<FilterKey | null>(null);
  const [filterNameText, setFilterNameText] = useState('');
  const [filterSelectSet, setFilterSelectSet] = useState<Set<string>>(new Set());

  const applyFilter = (key: FilterKey, label: string, values: string[]) => {
    setActiveFilters((prev) => {
      const next = prev.filter((f) => f.key !== key);
      if (values.length > 0) next.push({ key, label, value: values.join(','), values });
      return next;
    });
    setFilterSubMenu(null);
    setFilterSelectSet(new Set());
  };

  const removeFilter = (key: FilterKey) => {
    setActiveFilters((prev) => prev.filter((f) => f.key !== key));
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setSearchQuery('');
    setFilterNameText('');
  };

  const periodCfg = PERIODS.find((p) => p.key === period)!;
  const numDays = periodCfg.days;
  const endDate = addDays(startDate, numDays);

  // Data
  const { data: projectsData } = useProjects();
  const { data: rolesData } = useRoles();
  const { data: clientsData } = useClients();
  const { data: teamsData } = useTeams();
  const { data: peopleData } = usePeople();
  const { data: tagsData } = useTags();
  const { data: assignmentsData } = useAssignments({
    startDate: formatISO(startDate),
    endDate: formatISO(endDate),
  });

  const allProjects: Project[] = projectsData?.data ?? [];
  const roles: Role[] = rolesData?.data ?? [];
  const clients: Client[] = clientsData?.data ?? [];
  const allPeople: Person[] = peopleData?.data ?? [];
  const allTags: Tag[] = tagsData?.data ?? [];
  const assignments: Assignment[] = assignmentsData?.data ?? [];

  const roleMap = useMemo(() => new Map(roles.map((r) => [r.id, r])), [roles]);
  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c.name])), [clients]);
  const teamMap = useMemo(() => new Map((teamsData?.data ?? []).map((t) => [t.id, t.name])), [teamsData]);

  // Build assignment person lookup (for People filter)
  const assignmentPersonsByProject = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const a of assignments) {
      if (!map.has(a.projectId)) map.set(a.projectId, new Set());
      map.get(a.projectId)!.add(a.personId);
    }
    return map;
  }, [assignments]);

  // Filter & sort projects
  const projects = useMemo(() => {
    let list = allProjects.filter((p) => p.state === 'active');
    if (!showTentative) list = list.filter((p) => p.status !== 'tentative');
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.clientId && clientMap.get(p.clientId)?.toLowerCase().includes(q)),
      );
    }

    // Apply active filters
    for (const f of activeFilters) {
      switch (f.key) {
        case 'starred':
          list = list.filter((p) => starredProjects.has(p.id));
          break;
        case 'projectName':
          if (f.values[0]) {
            const q = f.values[0].toLowerCase();
            list = list.filter((p) => p.name.toLowerCase().includes(q));
          }
          break;
        case 'client':
          list = list.filter((p) => p.clientId && f.values.includes(p.clientId));
          break;
        case 'status':
          list = list.filter((p) => f.values.includes(p.status));
          break;
        case 'pricingModel':
          list = list.filter((p) => f.values.includes(p.pricingModel));
          break;
        case 'team':
          list = list.filter((p) => p.teamId && f.values.includes(p.teamId));
          break;
        case 'people': {
          const filterPersonIds = new Set(f.values);
          list = list.filter((p) => {
            const projectPersons = assignmentPersonsByProject.get(p.id);
            return projectPersons && Array.from(projectPersons).some((pid) => filterPersonIds.has(pid));
          });
          break;
        }
      }
    }

    // Sort — for startDate/endDate, derive from assignments
    if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'client') list.sort((a, b) => (clientMap.get(a.clientId ?? '') ?? '').localeCompare(clientMap.get(b.clientId ?? '') ?? ''));
    else {
      // Build date lookup from assignments
      const dateMap = new Map<string, { start: string; end: string }>();
      for (const asgn of assignments) {
        const prev = dateMap.get(asgn.projectId);
        if (!prev) {
          dateMap.set(asgn.projectId, { start: asgn.startDate, end: asgn.endDate });
        } else {
          if (asgn.startDate < prev.start) prev.start = asgn.startDate;
          if (asgn.endDate > prev.end) prev.end = asgn.endDate;
        }
      }
      if (sortBy === 'startDate') {
        list.sort((a, b) => (dateMap.get(a.id)?.start ?? '9').localeCompare(dateMap.get(b.id)?.start ?? '9'));
      } else {
        list.sort((a, b) => (dateMap.get(a.id)?.end ?? '9').localeCompare(dateMap.get(b.id)?.end ?? '9'));
      }
    }
    return list;
  }, [allProjects, showTentative, searchQuery, sortBy, clientMap, assignments, activeFilters, starredProjects, assignmentPersonsByProject]);

  // Group projects by the selected groupBy key
  const groupedProjects = useMemo(() => {
    if (groupBy === 'all') return [{ label: 'Projects', projects }];

    const groups = new Map<string, Project[]>();
    for (const p of projects) {
      let key: string;
      switch (groupBy) {
        case 'status':
          key = p.status === 'tentative' ? 'Tentative' : 'Confirmed';
          break;
        case 'client':
          key = p.clientId ? (clientMap.get(p.clientId) ?? 'Unknown Client') : 'No Client';
          break;
        case 'team':
          key = p.teamId ? (teamMap.get(p.teamId) ?? 'Unknown Team') : 'No Team';
          break;
        case 'pricingModel':
          key = p.pricingModel === 'time_and_materials' ? 'Time and Materials'
            : p.pricingModel === 'fixed_price' ? 'Fixed Price'
            : p.pricingModel === 'non_billable' ? 'Non-Billable'
            : p.pricingModel ?? 'Not Set';
          break;
        case 'tags':
          key = 'All'; // Tags grouping needs tag data on projects
          break;
        default:
          key = 'Other';
      }
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    }

    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, projs]) => ({ label, projects: projs }));
  }, [projects, groupBy, clientMap, teamMap]);

  // Group assignments by project -> role -> person
  const projectRoleGroups = useMemo(() => {
    const map = new Map<string, ProjectRoleGroup[]>();

    for (const project of projects) {
      const projectAssignments = assignments.filter((a) => a.projectId === project.id);
      const byRole = new Map<string, Map<string, { personName: string; assignments: Assignment[] }>>();

      for (const a of projectAssignments) {
        if (!byRole.has(a.roleId)) byRole.set(a.roleId, new Map());
        const personMap = byRole.get(a.roleId)!;
        if (!personMap.has(a.personId)) {
          personMap.set(a.personId, {
            personName: [(a as any).personFirstName, (a as any).personLastName].filter(Boolean).join(' ') || (a as any).person_name || 'Person',
            assignments: [],
          });
        }
        personMap.get(a.personId)!.assignments.push(a);
      }

      const groups: ProjectRoleGroup[] = [];
      for (const [roleId, personMap] of byRole) {
        const role = roleMap.get(roleId);
        let totalHours = 0;
        const persons: ProjectRoleGroup['persons'] = [];
        const uniquePersonIds = new Set<string>();

        for (const [personId, { personName, assignments: pAssignments }] of personMap) {
          uniquePersonIds.add(personId);
          let personHours = 0;
          for (const a of pAssignments) {
            const days = Math.max(1, daysBetween(new Date(a.startDate), new Date(a.endDate)) + 1);
            let weekdays = 0;
            for (let d = 0; d < days; d++) {
              const day = addDays(new Date(a.startDate), d);
              if (!isWeekend(day)) weekdays++;
            }
            personHours += (weekdays * a.minutesPerDay) / 60;
          }
          totalHours += personHours;
          persons.push({ personId, personName, assignments: pAssignments });
        }

        groups.push({
          roleId,
          roleName: role?.name ?? 'Unknown Role',
          persons,
          totalHours,
          personCount: persons.length,
          uniquePersonCount: uniquePersonIds.size,
        });
      }

      map.set(project.id, groups);
    }
    return map;
  }, [projects, assignments, roleMap]);

  // Calculate total hours per project
  const projectTotalHours = useMemo(() => {
    const map = new Map<string, number>();
    for (const [projectId, groups] of projectRoleGroups) {
      map.set(projectId, groups.reduce((sum, g) => sum + g.totalHours, 0));
    }
    return map;
  }, [projectRoleGroups]);

  // Columns (day or week granularity based on period)
  const columns = useMemo(() => {
    let cols: ColumnInfo[];
    if (periodCfg.granularity === 'week') cols = generateWeekColumns(startDate, numDays);
    else cols = generateDayColumns(startDate, numDays);
    if (!showWeekends && periodCfg.granularity === 'day') {
      cols = cols.filter((c) => !c.isWeekend);
    }
    return cols;
  }, [startDate, numDays, periodCfg.granularity, showWeekends]);

  const colWidth = periodCfg.granularity === 'week' ? WEEK_COL_WIDTH : DAY_WIDTH;
  const timelineWidth = columns.length * colWidth;

  // Bar position helper — works for both day and week granularity
  const getBarPx = useCallback(
    (aStart: string, aEnd: string) => {
      if (periodCfg.granularity === 'week') {
        const dayOffset = daysBetween(startDate, new Date(aStart));
        const daySpan = daysBetween(new Date(aStart), new Date(aEnd)) + 1;
        const left = (dayOffset / 7) * colWidth;
        const width = (daySpan / 7) * colWidth;
        return { left: Math.max(left, 0), width: Math.max(width, 4) };
      }
      if (!showWeekends) {
        // Count only weekdays from startDate to bar start/end
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
      const left = daysBetween(startDate, new Date(aStart)) * colWidth;
      const width = (daysBetween(new Date(aStart), new Date(aEnd)) + 1) * colWidth;
      return { left: Math.max(left, 0), width: Math.max(width, 4) };
    },
    [startDate, colWidth, periodCfg.granularity, showWeekends],
  );

  // Navigation
  const navigateDays = (n: number) => setStartDate((prev) => addDays(prev, n));
  const goToToday = () => setStartDate(getMonday(new Date()));

  const toggleProject = useCallback((projectId: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }, []);

  const toggleStar = useCallback((projectId: string) => {
    setStarredProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }, []);

  // Scroll sync
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

  // Get project date range from assignments
  const getProjectDateRange = (projectId: string): { start: string; end: string } | null => {
    const pAssign = assignments.filter((a) => a.projectId === projectId);
    if (pAssign.length === 0) return null;
    const starts = pAssign.map((a) => a.startDate).sort();
    const ends = pAssign.map((a) => a.endDate).sort();
    return { start: starts[0], end: ends[ends.length - 1] };
  };

  // Month header spans
  const monthSpans = useMemo(() => {
    const spans: { label: string; startIdx: number; count: number }[] = [];
    for (let i = 0; i < columns.length; i++) {
      if (columns[i].monthLabel) {
        spans.push({ label: columns[i].monthLabel!, startIdx: i, count: 1 });
      } else if (spans.length > 0) {
        spans[spans.length - 1].count++;
      }
    }
    return spans;
  }, [columns]);

  const sortLabel = SORT_OPTIONS.find((s) => s.key === sortBy)?.label ?? 'Project Name';
  const groupLabel = GROUP_OPTIONS.find((g) => g.key === groupBy)?.label ?? 'All';

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Sub-header: Filter + Search bar */}
      <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-2">
        <div className="relative">
          <button
            onClick={() => { setShowFilterMenu(!showFilterMenu); setFilterSubMenu(null); }}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            <Filter className="h-4 w-4" />
            Filter
          </button>
          {showFilterMenu && !filterSubMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowFilterMenu(false)} />
              <div className="absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                <button className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { applyFilter('starred', 'Starred', ['true']); setShowFilterMenu(false); }}>
                  <Star className="h-3.5 w-3.5" /> Starred
                </button>
                <div className="my-1 border-t border-gray-100" />
                <button className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setFilterSubMenu('projectName')}>
                  <FileText className="h-3.5 w-3.5" /> Project Name
                </button>
                <button className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setFilterSubMenu('client'); setFilterSelectSet(new Set(activeFilters.find((f) => f.key === 'client')?.values ?? [])); }}>
                  <User className="h-3.5 w-3.5" /> Client
                </button>
                <button className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setFilterSubMenu('status'); setFilterSelectSet(new Set(activeFilters.find((f) => f.key === 'status')?.values ?? [])); }}>
                  <Clock className="h-3.5 w-3.5" /> Project Status
                </button>
                <button className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setFilterSubMenu('pricingModel'); setFilterSelectSet(new Set(activeFilters.find((f) => f.key === 'pricingModel')?.values ?? [])); }}>
                  <FileText className="h-3.5 w-3.5" /> Pricing Model
                </button>
                <button className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setFilterSubMenu('team'); setFilterSelectSet(new Set(activeFilters.find((f) => f.key === 'team')?.values ?? [])); }}>
                  <User className="h-3.5 w-3.5" /> Primary Team
                </button>
                <button className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setFilterSubMenu('tags'); setFilterSelectSet(new Set(activeFilters.find((f) => f.key === 'tags')?.values ?? [])); }}>
                  <FileText className="h-3.5 w-3.5" /> Project Tags
                </button>
                <div className="my-1 border-t border-gray-100" />
                <button className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setFilterSubMenu('people'); setFilterSelectSet(new Set(activeFilters.find((f) => f.key === 'people')?.values ?? [])); }}>
                  <User className="h-3.5 w-3.5" /> People & Placeholders
                </button>
              </div>
            </>
          )}
          {showFilterMenu && filterSubMenu === 'projectName' && (
            <FilterTextMenu
              title="Project Name"
              value={filterNameText}
              onChange={(v) => {
                setFilterNameText(v);
                applyFilter('projectName', `Name: ${v}`, v.trim() ? [v.trim()] : []);
              }}
              onClose={() => { setShowFilterMenu(false); setFilterSubMenu(null); }}
            />
          )}
          {showFilterMenu && filterSubMenu === 'client' && (
            <FilterSelectMenu
              title="Client"
              options={clients.map((c) => ({ id: c.id, label: c.name }))}
              selected={filterSelectSet}
              onToggle={(id) => {
                const next = new Set(filterSelectSet);
                if (next.has(id)) next.delete(id); else next.add(id);
                setFilterSelectSet(next);
                applyFilter('client', `Client: ${next.size}`, Array.from(next));
              }}
              onClose={() => { setShowFilterMenu(false); setFilterSubMenu(null); }}
            />
          )}
          {showFilterMenu && filterSubMenu === 'status' && (
            <FilterSelectMenu
              title="Project Status"
              options={[{ id: 'confirmed', label: 'Confirmed' }, { id: 'tentative', label: 'Tentative' }]}
              selected={filterSelectSet}
              onToggle={(id) => {
                const next = new Set(filterSelectSet);
                if (next.has(id)) next.delete(id); else next.add(id);
                setFilterSelectSet(next);
                applyFilter('status', `Status: ${Array.from(next).join(', ')}`, Array.from(next));
              }}
              onClose={() => { setShowFilterMenu(false); setFilterSubMenu(null); }}
            />
          )}
          {showFilterMenu && filterSubMenu === 'pricingModel' && (
            <FilterSelectMenu
              title="Pricing Model"
              options={[
                { id: 'time_and_materials', label: 'Time and Materials' },
                { id: 'fixed_price', label: 'Fixed Price' },
                { id: 'non_billable', label: 'Non-Billable' },
              ]}
              selected={filterSelectSet}
              onToggle={(id) => {
                const next = new Set(filterSelectSet);
                if (next.has(id)) next.delete(id); else next.add(id);
                setFilterSelectSet(next);
                applyFilter('pricingModel', `Model: ${next.size}`, Array.from(next));
              }}
              onClose={() => { setShowFilterMenu(false); setFilterSubMenu(null); }}
            />
          )}
          {showFilterMenu && filterSubMenu === 'team' && (
            <FilterSelectMenu
              title="Primary Team"
              options={(teamsData?.data ?? []).map((t) => ({ id: t.id, label: t.name }))}
              selected={filterSelectSet}
              onToggle={(id) => {
                const next = new Set(filterSelectSet);
                if (next.has(id)) next.delete(id); else next.add(id);
                setFilterSelectSet(next);
                applyFilter('team', `Team: ${next.size}`, Array.from(next));
              }}
              onClose={() => { setShowFilterMenu(false); setFilterSubMenu(null); }}
            />
          )}
          {showFilterMenu && filterSubMenu === 'tags' && (
            <FilterSelectMenu
              title="Project Tags"
              options={allTags.map((t) => ({ id: t.id, label: t.name }))}
              selected={filterSelectSet}
              onToggle={(id) => {
                const next = new Set(filterSelectSet);
                if (next.has(id)) next.delete(id); else next.add(id);
                setFilterSelectSet(next);
                applyFilter('tags', `Tags: ${next.size}`, Array.from(next));
              }}
              onClose={() => { setShowFilterMenu(false); setFilterSubMenu(null); }}
            />
          )}
          {showFilterMenu && filterSubMenu === 'people' && (
            <FilterSelectMenu
              title="People & Placeholders"
              options={allPeople.map((p) => ({ id: p.id, label: `${p.firstName} ${p.lastName}` }))}
              selected={filterSelectSet}
              onToggle={(id) => {
                const next = new Set(filterSelectSet);
                if (next.has(id)) next.delete(id); else next.add(id);
                setFilterSelectSet(next);
                applyFilter('people', `People: ${next.size}`, Array.from(next));
              }}
              onClose={() => { setShowFilterMenu(false); setFilterSubMenu(null); }}
            />
          )}
        </div>

        {/* Active filter chips */}
        {activeFilters.map((f) => (
          <span
            key={f.key}
            className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700"
          >
            {f.label}
            <button onClick={() => removeFilter(f.key)} className="ml-0.5 hover:text-red-900">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        {(searchQuery || activeFilters.length > 0) && (
          <>
            <button onClick={clearAllFilters} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <X className="h-3.5 w-3.5" />
            </button>
            <button disabled className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-400">
              <Copy className="h-3 w-3" />
              Save
            </button>
          </>
        )}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border-0 bg-transparent py-1.5 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-0"
          />
        </div>
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-1.5">
        <div className="flex items-center gap-4">
          {/* Group by */}
          <div className="relative flex items-center gap-1.5">
            <span className="text-sm font-medium text-gray-700">Projects</span>
            <button
              onClick={() => setShowGroupMenu(!showGroupMenu)}
              className="flex items-center gap-1 rounded px-1 py-0.5 text-sm text-gray-500 hover:bg-gray-100"
            >
              <span>by</span>
              <span className="font-medium text-gray-700">{groupLabel}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            {showGroupMenu && (
              <DropdownMenu
                onClose={() => setShowGroupMenu(false)}
                items={GROUP_OPTIONS.map((g) => ({
                  label: g.label,
                  onClick: () => setGroupBy(g.key),
                }))}
              />
            )}
          </div>

          {/* Chart toggle */}
          <div className="flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Chart</span>
            <Toggle enabled={false} />
          </div>

          {/* Tentative toggle */}
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-gray-600">Tentative</span>
            <Toggle enabled={showTentative} onChange={setShowTentative} />
          </div>

          {/* Sort */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1.5 rounded px-1.5 py-0.5 text-sm text-gray-600 hover:bg-gray-100"
            >
              <span>{sortLabel}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            {showSortMenu && (
              <DropdownMenu
                onClose={() => setShowSortMenu(false)}
                items={[
                  { label: 'Sort by', info: '', divider: false, disabled: true },
                  ...SORT_OPTIONS.map((s) => ({
                    label: s.label,
                    onClick: () => setSortBy(s.key),
                  })),
                ]}
              />
            )}
          </div>

          {/* Display settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={clsx('rounded p-1 text-gray-500 hover:bg-gray-100', showSettings && 'bg-gray-100 text-indigo-600')}
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          <button onClick={() => navigateDays(-numDays)} className="rounded p-1 text-gray-500 hover:bg-gray-100">
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button onClick={() => navigateDays(-7)} className="rounded p-1 text-gray-500 hover:bg-gray-100">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={goToToday}
            className="mx-1 rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Today
          </button>
          <button onClick={() => navigateDays(7)} className="rounded p-1 text-gray-500 hover:bg-gray-100">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button onClick={() => navigateDays(numDays)} className="rounded p-1 text-gray-500 hover:bg-gray-100">
            <ChevronsRight className="h-4 w-4" />
          </button>

          {/* Period selector */}
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
                    />
                    <span className="text-sm text-gray-700">Show Weekends</span>
                  </label>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div
          className="flex flex-col border-r border-gray-200 bg-white"
          style={{ width: LEFT_PANEL_WIDTH, minWidth: LEFT_PANEL_WIDTH }}
        >
          {/* Left header: + New + count */}
          <div className="flex items-center gap-3 border-b border-gray-200 px-3 py-2" style={{ height: 56 }}>
            <div className="relative">
              <button
                onClick={() => setShowNewMenu(!showNewMenu)}
                className="flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-sm font-medium text-indigo-600 hover:bg-indigo-100"
              >
                <Plus className="h-3.5 w-3.5" />
                New
              </button>
              {showNewMenu && (
                <DropdownMenu
                  onClose={() => setShowNewMenu(false)}
                  items={[
                    { label: 'Project', icon: <FileText className="h-3.5 w-3.5" />, onClick: () => navigate('/manage/projects/new') },
                    { label: 'Person', icon: <User className="h-3.5 w-3.5" />, onClick: () => navigate('/manage/people/new') },
                    { label: 'Client', icon: <User className="h-3.5 w-3.5" />, onClick: () => navigate('/manage/clients') },
                    { label: 'Role', icon: <User className="h-3.5 w-3.5" />, onClick: () => navigate('/manage/roles') },
                  ]}
                />
              )}
            </div>
            <span className="text-xs text-gray-500">
              {projects.length} Projects
            </span>
          </div>

          {/* Left body: scrollable project list */}
          <div
            ref={leftPanelRef}
            className="flex-1 overflow-y-auto overflow-x-hidden"
            style={{ scrollbarWidth: 'none' }}
          >
            {groupedProjects.map((group) => (
              <div key={group.label}>
                {/* Group section header */}
                <div
                  className="flex cursor-pointer items-center gap-2 border-b border-gray-100 bg-gray-50 px-3 py-1.5 hover:bg-gray-100"
                  onClick={() => {
                    setCollapsedGroups((prev) => {
                      const next = new Set(prev);
                      if (next.has(group.label)) next.delete(group.label);
                      else next.add(group.label);
                      return next;
                    });
                  }}
                >
                  {collapsedGroups.has(group.label) ? (
                    <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                  )}
                  <span className="text-xs font-semibold text-gray-700">{group.label}</span>
                  <span className="text-xs text-gray-400">{group.projects.length}</span>
                </div>

            {!collapsedGroups.has(group.label) && group.projects.map((project) => {
              const expanded = expandedProjects.has(project.id);
              const groups = projectRoleGroups.get(project.id) ?? [];
              const totalHours = projectTotalHours.get(project.id) ?? 0;
              const clientName = project.clientId ? clientMap.get(project.clientId) : null;
              const isStarred = starredProjects.has(project.id);

              return (
                <div key={project.id}>
                  {/* Project row */}
                  <div
                    className="flex items-center gap-2 border-b border-gray-100 px-3 hover:bg-gray-50 cursor-pointer"
                    style={{ height: PROJECT_ROW_HEIGHT }}
                    onClick={() => toggleProject(project.id)}
                  >
                    <ProjectIcon project={project} />
                    <div className="min-w-0 flex-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/manage/projects/${project.id}`); }}
                        className="block truncate text-sm font-medium text-gray-900 hover:text-indigo-600"
                      >
                        {project.name}
                      </button>
                      {clientName && (
                        <span className="block truncate text-xs text-gray-500">{clientName}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                      {/* Three-dot menu */}
                      <div className="relative">
                        <button
                          onClick={() => setProjectMenu(projectMenu === project.id ? null : project.id)}
                          className="rounded p-0.5 text-gray-400 hover:text-gray-600"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                        {projectMenu === project.id && (
                          <DropdownMenu
                            onClose={() => setProjectMenu(null)}
                            items={[
                              { label: 'Edit Details', icon: <Pencil className="h-3.5 w-3.5" />, onClick: () => navigate(`/manage/projects/${project.id}`) },
                              { label: 'Edit Budget', icon: <FileText className="h-3.5 w-3.5" />, onClick: () => navigate(`/manage/projects/${project.id}?tab=budget`) },
                              { divider: true, label: '' },
                              { label: 'Open Dashboard', icon: <ExternalLink className="h-3.5 w-3.5" />, onClick: () => navigate(`/manage/projects/${project.id}`) },
                              { label: 'Notes', icon: <StickyNote className="h-3.5 w-3.5" />, onClick: () => navigate(`/manage/projects/${project.id}?tab=details`) },
                              { divider: true, label: '' },
                              { label: project.status === 'tentative' ? 'Set Confirmed' : 'Set Tentative', icon: <Clock className="h-3.5 w-3.5" />, onClick: () => {
                                updateProject.mutate({ id: project.id, status: project.status === 'tentative' ? 'confirmed' : 'tentative' });
                              }},
                              { label: 'Duplicate', icon: <Copy className="h-3.5 w-3.5" />, onClick: () => {
                                if (confirm(`Duplicate "${project.name}"?`)) {
                                  createProject.mutate({
                                    name: `${project.name} (Copy)`,
                                    clientId: project.clientId,
                                    teamId: project.teamId,
                                    pricingModel: project.pricingModel,
                                    budget: project.budget,
                                    budgetMethod: project.budgetMethod,
                                    status: project.status,
                                    rateType: project.rateType,
                                    emoji: project.emoji,
                                  });
                                }
                              }},
                              { divider: true, label: '' },
                              { label: 'Archive', icon: <Archive className="h-3.5 w-3.5" />, onClick: () => {
                                if (confirm(`Archive "${project.name}"?`)) {
                                  updateProject.mutate({ id: project.id, state: 'archived' as any });
                                }
                              }},
                              { label: 'Delete', icon: <Trash2 className="h-3.5 w-3.5" />, danger: true, onClick: () => { if (confirm(`Delete "${project.name}"?`)) deleteProject.mutate(project.id); } },
                              { divider: true, label: '' },
                              { label: 'Project ID:', info: project.id.slice(0, 8), onClick: () => navigator.clipboard.writeText(project.id) },
                            ]}
                          />
                        )}
                      </div>
                      {/* Star */}
                      <button
                        onClick={() => toggleStar(project.id)}
                        className={clsx('rounded p-0.5', isStarred ? 'text-amber-400' : 'text-gray-300 hover:text-amber-400')}
                      >
                        <Star className={clsx('h-3.5 w-3.5', isStarred && 'fill-amber-400')} />
                      </button>
                      {/* Expand chevron */}
                      <button
                        onClick={() => toggleProject(project.id)}
                        className="rounded p-0.5 text-gray-400 hover:text-gray-600"
                      >
                        {expanded ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {expanded && (
                    <>
                      {/* Phases row */}
                      <div
                        className="flex items-center border-b border-gray-50 bg-gray-50/50 px-4"
                        style={{ height: PHASE_ROW_HEIGHT }}
                      >
                        <span className="text-xs font-medium text-gray-600">Phases</span>
                      </div>

                      {/* Hours/Days/Revenue summary */}
                      <div
                        className="flex items-center justify-between border-b border-gray-50 bg-gray-50/50 px-4"
                        style={{ height: ROLE_ROW_HEIGHT }}
                      >
                        <div className="flex items-center gap-1">
                          <select
                            value={effortView}
                            onChange={(e) => setEffortView(e.target.value as EffortView)}
                            className="rounded border-0 bg-transparent p-0 pr-4 text-xs font-medium text-gray-600 focus:outline-none focus:ring-0"
                          >
                            <option value="days">Days</option>
                            <option value="hours">Hours</option>
                            <option value="revenue">Revenue</option>
                          </select>
                        </div>
                        <span className="text-xs font-semibold text-green-600">
                          {effortView === 'hours'
                            ? formatTotalHours(totalHours)
                            : effortView === 'days'
                              ? `${Math.round(totalHours / 8)}d`
                              : '$—'}
                        </span>
                      </div>

                      {/* Role groups */}
                      {groups.map((group) => (
                        <div key={group.roleId}>
                          {/* Role header */}
                          <div
                            className="flex items-center justify-between border-b border-gray-50 bg-gray-50/30 px-4"
                            style={{ height: ROLE_ROW_HEIGHT }}
                          >
                            <div className="flex items-center gap-2">
                              <Plus className="h-3.5 w-3.5 text-indigo-500 cursor-pointer hover:text-indigo-700" />
                              <span className="text-xs font-medium text-gray-700">{group.roleName}</span>
                              <Eye className="h-3 w-3 text-gray-400" />
                              <span className="text-[10px] text-gray-400">
                                {group.uniquePersonCount} / {group.personCount}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {effortView === 'hours'
                                ? formatTotalHours(group.totalHours)
                                : effortView === 'days'
                                  ? `${Math.round(group.totalHours / 8)}d`
                                  : '$—'}
                            </span>
                          </div>

                          {/* Person rows */}
                          {group.persons.map((person) => (
                            <div
                              key={person.personId}
                              className="flex items-center gap-2 border-b border-gray-50 px-4 pl-8 hover:bg-gray-50"
                              style={{ height: PERSON_ROW_HEIGHT }}
                            >
                              <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-300 text-[10px] font-medium text-gray-700">
                                {person.personName
                                  .split(' ')
                                  .map((w) => w[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </span>
                              <span className="flex-1 truncate text-sm text-gray-800">
                                {person.personName}
                              </span>
                              <div className="relative">
                                <button
                                  onClick={() => setPersonMenu(personMenu === person.personId ? null : person.personId)}
                                  className="rounded p-0.5 text-gray-400 hover:text-gray-600"
                                >
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </button>
                                {personMenu === person.personId && (
                                  <DropdownMenu
                                    onClose={() => setPersonMenu(null)}
                                    items={[
                                      { label: 'Edit Details', icon: <Pencil className="h-3.5 w-3.5" />, onClick: () => navigate(`/manage/people/${person.personId}`) },
                                      { divider: true, label: '' },
                                      { label: 'View Details', icon: <ExternalLink className="h-3.5 w-3.5" />, onClick: () => navigate(`/manage/people/${person.personId}`) },
                                      { label: 'View Schedule', icon: <Calendar className="h-3.5 w-3.5" />, onClick: () => navigate('/planner/people') },
                                      { label: 'Open Dashboard', icon: <ExternalLink className="h-3.5 w-3.5" />, onClick: () => navigate(`/manage/people/${person.personId}`) },
                                      { label: 'Notes', icon: <StickyNote className="h-3.5 w-3.5" />, onClick: () => navigate(`/manage/people/${person.personId}?tab=details`) },
                                      { divider: true, label: '' },
                                      { label: 'Change Project Role', icon: <User className="h-3.5 w-3.5" />, onClick: () => {
                                        const newRoleId = prompt('Enter new role ID (or select from roles)');
                                        if (newRoleId) {
                                          const targetRole = roles.find((r) => r.name.toLowerCase() === newRoleId.toLowerCase() || r.id === newRoleId);
                                          if (targetRole) {
                                            for (const a of person.assignments) {
                                              updateAssignment.mutate({ id: a.id, roleId: targetRole.id });
                                            }
                                          }
                                        }
                                      }},
                                      { divider: true, label: '' },
                                      { label: 'Remove from Project', icon: <UserMinus className="h-3.5 w-3.5" />, danger: true, onClick: () => {
                                        if (confirm(`Remove ${person.personName} from "${project.name}"?`)) {
                                          for (const a of person.assignments) {
                                            deleteAssignment.mutate(a.id);
                                          }
                                        }
                                      }},
                                      { divider: true, label: '' },
                                      { label: 'Person ID:', info: person.personId.slice(0, 8), onClick: () => navigator.clipboard.writeText(person.personId) },
                                    ]}
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}

                      {/* Add Person row */}
                      <div
                        className="flex items-center gap-2 border-b border-gray-100 px-4 cursor-pointer hover:bg-gray-50"
                        style={{ height: ADD_ROW_HEIGHT }}
                        onClick={() => setAddPersonProject(project)}
                      >
                        <Plus className="h-4 w-4 text-indigo-500" />
                        <span className="text-xs font-medium text-indigo-600">Add Person or Placeholder</span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
              </div>
            ))}

            {/* Bottom: + New Project button */}
            <button
              onClick={() => navigate('/manage/projects/new')}
              className="flex w-full items-center gap-2 border-b border-gray-100 px-4 py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
            >
              <Plus className="h-4 w-4" />
              New Project
            </button>
          </div>
        </div>

        {/* Right panel: Timeline */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Timeline header */}
          <div
            ref={timelineHeaderRef}
            className="overflow-hidden border-b border-gray-200"
            style={{ height: 56 }}
          >
            <div style={{ width: timelineWidth }} className="relative h-full">
              {/* Month labels */}
              <div className="flex h-7 items-end">
                {monthSpans.map((ms, i) => (
                  <div
                    key={i}
                    className="absolute text-xs font-medium text-gray-500"
                    style={{
                      left: ms.startIdx * colWidth + 4,
                    }}
                  >
                    {ms.label}
                  </div>
                ))}
              </div>
              {/* Column numbers (day or week) */}
              <div className="absolute bottom-0 flex h-7">
                {columns.map((col, i) => (
                  <div
                    key={i}
                    className={clsx(
                      'flex items-center justify-center text-xs',
                      col.isWeekend
                        ? 'bg-gray-50 text-gray-300'
                        : col.isToday
                          ? 'font-bold text-indigo-600'
                          : 'text-gray-500',
                    )}
                    style={{ width: colWidth, height: 28 }}
                  >
                    {col.isToday ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
                        {col.label}
                      </span>
                    ) : (
                      <span className="text-[11px]">{col.label}</span>
                    )}
                  </div>
                ))}
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
            <div style={{ width: timelineWidth, minHeight: '100%' }} className="relative">
              {/* Weekend shading columns (only for day granularity) */}
              {periodCfg.granularity === 'day' && columns.map(
                (col, i) =>
                  col.isWeekend && (
                    <div
                      key={`ws-${i}`}
                      className="pointer-events-none absolute bottom-0 top-0 bg-gray-50/80"
                      style={{ left: i * colWidth, width: colWidth }}
                    />
                  ),
              )}

              {/* Week separator lines */}
              {columns.map(
                (col, i) => {
                  if (periodCfg.granularity === 'week') {
                    // Every column is a week — show separator
                    return i > 0 ? (
                      <div
                        key={`wl-${i}`}
                        className="pointer-events-none absolute bottom-0 top-0 border-l border-gray-100"
                        style={{ left: i * colWidth }}
                      />
                    ) : null;
                  }
                  // Day granularity — separator on Mondays
                  return col.date.getDay() === 1 && i > 0 ? (
                    <div
                      key={`wl-${i}`}
                      className="pointer-events-none absolute bottom-0 top-0 border-l border-gray-200"
                      style={{ left: i * colWidth }}
                    />
                  ) : null;
                },
              )}

              {/* Today line */}
              {columns.map(
                (col, i) =>
                  col.isToday && (
                    <div
                      key="today"
                      className="pointer-events-none absolute bottom-0 top-0 z-10 border-l-2 border-indigo-500"
                      style={{ left: i * colWidth + colWidth / 2 }}
                    />
                  ),
              )}

              {/* Project rows (grouped) */}
              {groupedProjects.map((grp) => (
                <div key={grp.label}>
                  {/* Group header spacer row in timeline */}
                  <div className="border-b border-gray-100 bg-gray-50/50" style={{ height: 28 }} />

              {!collapsedGroups.has(grp.label) && grp.projects.map((project) => {
                const expanded = expandedProjects.has(project.id);
                const groups = projectRoleGroups.get(project.id) ?? [];
                const dateRange = getProjectDateRange(project.id);
                const color = projectColor(project.id);

                return (
                  <div key={project.id}>
                    {/* Project main row — shows thin project line */}
                    <div className="relative border-b border-gray-100" style={{ height: PROJECT_ROW_HEIGHT }}>
                      {dateRange && (
                        <div
                          className="absolute top-1/2 h-0.5 -translate-y-1/2"
                          style={{
                            left: getBarPx(dateRange.start, dateRange.end).left,
                            width: getBarPx(dateRange.start, dateRange.end).width,
                            backgroundColor: color,
                          }}
                        />
                      )}
                    </div>

                    {/* Expanded rows */}
                    {expanded && (
                      <>
                        {/* Phases row with bars */}
                        <PhaseBarRow projectId={project.id} getBarPx={getBarPx} height={PHASE_ROW_HEIGHT} />

                        {/* Hours summary row — shows light background */}
                        <div
                          className="relative border-b border-gray-50"
                          style={{ height: ROLE_ROW_HEIGHT }}
                        >
                          {dateRange && (
                            <div
                              className="absolute inset-y-0 opacity-10"
                              style={{
                                left: getBarPx(dateRange.start, dateRange.end).left,
                                width: getBarPx(dateRange.start, dateRange.end).width,
                                backgroundColor: color,
                              }}
                            />
                          )}
                        </div>

                        {/* Role + Person rows */}
                        {groups.map((group) => (
                          <div key={group.roleId}>
                            {/* Role row */}
                            <div className="border-b border-gray-50" style={{ height: ROLE_ROW_HEIGHT }} />

                            {/* Person assignment bars */}
                            {group.persons.map((person) => (
                              <div
                                key={person.personId}
                                className="relative border-b border-gray-50"
                                style={{ height: PERSON_ROW_HEIGHT }}
                              >
                                {person.assignments.map((a) => {
                                  const { left, width } = getBarPx(a.startDate, a.endDate);
                                  return (
                                    <div
                                      key={a.id}
                                      className="absolute flex items-center overflow-hidden rounded-[4px] px-2 shadow-sm transition-all hover:brightness-110 cursor-pointer"
                                      style={{
                                        left,
                                        width,
                                        top: (PERSON_ROW_HEIGHT - 28) / 2,
                                        height: 28,
                                        backgroundColor: color,
                                      }}
                                      title={`${person.personName}\n${a.startDate} → ${a.endDate}\n${formatMinutesPerDay(a.minutesPerDay)}`}
                                      onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setEditingAssignment({
                                          assignment: a,
                                          personName: person.personName,
                                          projectColor: color,
                                          anchorRect: { top: rect.top, left: rect.left, width: rect.width },
                                        });
                                      }}
                                    >
                                      <span className="truncate text-[11px] font-medium text-white">
                                        {formatBarLabel(a.minutesPerDay, displayUnit)}
                                      </span>
                                      {!a.isBillable && (
                                        <span className="ml-0.5 text-[9px] text-white/70">NB</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        ))}

                        {/* Add Person row */}
                        <div className="border-b border-gray-100" style={{ height: ADD_ROW_HEIGHT }} />
                      </>
                    )}
                  </div>
                );
              })}
                </div>
              ))}

              {/* Bottom New Project row spacer */}
              <div style={{ height: 48 }} />
            </div>
          </div>
        </div>

        {/* Display Settings Panel (overlay from right) */}
        {showSettings && (
          <DisplaySettingsPanel
            unit={displayUnit}
            onUnitChange={setDisplayUnit}
            showTotalEffort={showTotalEffort}
            onShowTotalEffortChange={setShowTotalEffort}
            alwaysShowPhases={alwaysShowPhases}
            onAlwaysShowPhasesChange={setAlwaysShowPhases}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>

      {/* Assignment Edit Popover */}
      {editingAssignment && (
        <AssignmentEditPopover
          state={editingAssignment}
          onClose={() => setEditingAssignment(null)}
          onSave={(id, changes) => updateAssignment.mutate({ id, ...changes })}
          onDelete={(id) => deleteAssignment.mutate(id)}
        />
      )}

      {/* Add Person Dialog */}
      {addPersonProject && (
        <AddPersonDialog
          project={addPersonProject}
          roles={roles}
          people={allPeople}
          existingPersonIds={new Set(
            assignments
              .filter((a) => a.projectId === addPersonProject.id)
              .map((a) => a.personId),
          )}
          onAdd={(entries) => {
            const today = formatISO(new Date());
            const endDateStr = formatISO(addDays(new Date(), 30));
            for (const entry of entries) {
              createAssignment.mutate({
                personId: entry.personId,
                projectId: addPersonProject.id,
                roleId: entry.roleId,
                startDate: today,
                endDate: endDateStr,
                minutesPerDay: 480,
                isBillable: true,
              });
            }
          }}
          onClose={() => setAddPersonProject(null)}
        />
      )}
    </div>
  );
}
