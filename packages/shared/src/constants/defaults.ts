// ============================================================
// Default Constants for the DNVSol Platform
// ============================================================

/**
 * Default full-time minutes per day (8 hours = 480 minutes).
 * Used as the default for accounts and contracts.
 */
export const MINUTES_PER_DAY = 480;

/**
 * Default working days: Monday (1) through Friday (5).
 * Uses ISO day-of-week numbering (1=Mon, 7=Sun).
 */
export const DEFAULT_WORKING_DAYS: readonly number[] = [1, 2, 3, 4, 5];

/**
 * Default work days map matching the contract schema.
 */
export const DEFAULT_WORK_DAYS_MAP = {
  mon: true,
  tue: true,
  wed: true,
  thu: true,
  fri: true,
  sat: false,
  sun: false,
} as const;

/**
 * Pagination defaults.
 */
export const DEFAULT_PAGE_LIMIT = 50;
export const MAX_PAGE_LIMIT = 200;
export const MIN_PAGE_LIMIT = 1;

/**
 * Rate limiting: 120 requests per minute per API key per IP.
 */
export const RATE_LIMIT_PER_MINUTE = 120;

/**
 * Default currency.
 */
export const DEFAULT_CURRENCY = 'USD';

/**
 * Default timezone.
 */
export const DEFAULT_TIMEZONE = 'UTC';

/**
 * Default pricing model for new projects.
 */
export const DEFAULT_PRICING_MODEL = 'time_and_materials' as const;

/**
 * Default rate type.
 */
export const DEFAULT_RATE_TYPE = 'hourly' as const;

/**
 * Default project state.
 */
export const DEFAULT_PROJECT_STATE = 'active' as const;

/**
 * Default project status.
 */
export const DEFAULT_PROJECT_STATUS = 'confirmed' as const;

/**
 * Default budget method.
 */
export const DEFAULT_BUDGET_METHOD = 'total' as const;

/**
 * Default timesheet auto-lock weeks (52 = effectively disabled).
 */
export const DEFAULT_TIMESHEET_AUTOLOCK_WEEKS = 52;

// ============================================================
// Availability Thresholds (5-level color coding)
// From FDD Section 4.2 / PRD Section 7.4
// ============================================================

export const AVAILABILITY_THRESHOLDS = {
  /** 75-100% available — highly available (green) */
  FREE_HIGH: { min: 75, max: 100, color: '#4CAF50', label: 'free_high' },
  /** 50-74% available — moderately available (light green) */
  FREE_MID: { min: 50, max: 74, color: '#8BC34A', label: 'free_mid' },
  /** 25-49% available — limited availability (amber) */
  FREE_LOW: { min: 25, max: 49, color: '#FFC107', label: 'free_low' },
  /** 1-24% available — nearly full (orange) */
  FREE_MINIMAL: { min: 1, max: 24, color: '#FF9800', label: 'free_minimal' },
  /** 0% or overbooked — no availability or overallocated (red) */
  OVER: { min: -Infinity, max: 0, color: '#F44336', label: 'over' },
} as const;

// ============================================================
// Phase Color Presets (12 hex colors)
// ============================================================

export const PHASE_COLORS: readonly string[] = [
  '#67D0D5', // Teal (default)
  '#5B93FF', // Blue
  '#7C5CFC', // Purple
  '#FF6B8A', // Pink
  '#FF8A65', // Orange
  '#FFD54F', // Yellow
  '#81C784', // Green
  '#4DB6AC', // Teal Green
  '#A1887F', // Brown
  '#90A4AE', // Blue Grey
  '#F06292', // Rose
  '#BA68C8', // Violet
];

/**
 * Default phase color.
 */
export const DEFAULT_PHASE_COLOR = '#67D0D5';

// ============================================================
// Milestone Icon Options
// ============================================================

export const MILESTONE_ICONS = [
  'start',
  'end',
  'flag',
  'dollar',
  'warning',
] as const;

/**
 * Default milestone icon.
 */
export const DEFAULT_MILESTONE_ICON = 'flag' as const;

// ============================================================
// Skill Level Range
// ============================================================

export const SKILL_LEVEL_MIN = 0;
export const SKILL_LEVEL_MAX = 5;

// ============================================================
// Partial Leave Minimum Minutes
// ============================================================

/**
 * Minimum minutes for partial-day leave (15 minutes).
 */
export const PARTIAL_LEAVE_MIN_MINUTES = 15;
