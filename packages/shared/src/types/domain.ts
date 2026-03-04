import type { z } from 'zod';
import type {
  AvailabilityStatus,
  BudgetMethod,
  EmploymentType,
  LeaveType,
  PricingModel,
  ProjectState,
  ProjectStatus,
  RateType,
  RepeatFrequency,
  UserRole,
  WorkDaysSchema,
} from '../schemas/common.schema.js';

// ============================================================
// Base Entity (all DB entities share these)
// ============================================================

export interface BaseEntity {
  id: string;
  createdAt: string; // ISO datetime
  updatedAt?: string; // ISO datetime
}

export interface AccountScopedEntity extends BaseEntity {
  accountId: string;
}

// ============================================================
// Account
// ============================================================

export interface Account extends BaseEntity {
  name: string;
  slug: string;
  currency: string;
  fullTimeMinutesPerDay: number;
  defaultPricingModel: z.infer<typeof PricingModel>;
  defaultRateType: z.infer<typeof RateType>;
  timezone: string;
  settings: AccountSettings;
}

export interface AccountSettings {
  allowProfilePhotos?: boolean;
  displayWeekNumbers?: boolean;
  teamFieldRequired?: boolean;
  sessionTimeout?: string;
  ssoOnly?: boolean;
  secondaryPersonField?: 'default_role' | 'team' | 'job_title';
  weeklyScheduleEmail?: boolean;
  timesheetsEnabled?: boolean;
  timesheetAutolockWeeks?: number;
}

// ============================================================
// User
// ============================================================

export interface User extends AccountScopedEntity {
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: z.infer<typeof UserRole>;
  permissions: Record<string, unknown>;
  lastLoginAt: string | null;
}

// ============================================================
// Organizational Entities
// ============================================================

export interface Team extends AccountScopedEntity {
  name: string;
}

export interface Role extends AccountScopedEntity {
  name: string;
  defaultHourlyRate: number;
  defaultHourlyCost: number;
  references: Record<string, string>;
}

export interface Skill extends AccountScopedEntity {
  name: string;
}

export interface Tag extends AccountScopedEntity {
  name: string;
  entityType: 'person' | 'project';
}

export interface Client extends AccountScopedEntity {
  name: string;
  website: string | null;
  references: Record<string, string>;
}

export interface Workstream extends AccountScopedEntity {
  name: string;
}

// ============================================================
// Person
// ============================================================

export interface Person extends AccountScopedEntity {
  firstName: string;
  lastName: string;
  email: string | null;
  teamId: string | null;
  managerId: string | null;
  isPlaceholder: boolean;
  archived: boolean;
  holidayGroupId: string | null;
  photoUrl: string | null;
  references: Record<string, string>;
  links: Array<{ label?: string; url: string }>;
  customFields: Record<string, unknown>;
}

export interface PersonSkill {
  personId: string;
  skillId: string;
  level: number; // 0-5
}

export interface PersonTag {
  personId: string;
  tagId: string;
}

export interface PersonManager {
  personId: string;
  userId: string;
}

export interface PersonNote extends BaseEntity {
  personId: string;
  userId: string | null;
  content: string;
}

/**
 * Extended person detail returned by GET /people/:id.
 * Includes active contract snapshot and computed data.
 */
export interface PersonDetail extends Person {
  activeContract: Contract | null;
  skills: Array<Skill & { level: number }>;
  tags: Tag[];
  managers: User[];
}

// ============================================================
// Contract
// ============================================================

export interface Contract extends AccountScopedEntity {
  personId: string;
  jobTitle: string | null;
  roleId: string;
  startDate: string; // ISO date
  endDate: string | null; // ISO date, NULL = ongoing
  employmentType: z.infer<typeof EmploymentType>;
  workDays: z.infer<typeof WorkDaysSchema>;
  minutesPerDay: number;
  costRateHourly: number;
}

// ============================================================
// Project
// ============================================================

export interface Project extends AccountScopedEntity {
  name: string;
  clientId: string | null;
  teamId: string | null;
  rateCardId: string | null;
  pricingModel: z.infer<typeof PricingModel>;
  budget: number | null;
  expensesBudget: number | null;
  budgetMethod: z.infer<typeof BudgetMethod>;
  status: z.infer<typeof ProjectStatus>;
  state: z.infer<typeof ProjectState>;
  rateType: z.infer<typeof RateType>;
  emoji: string | null;
  references: Record<string, string>;
  customFields: Record<string, unknown>;
}

export interface ProjectPhase extends BaseEntity {
  projectId: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  color: string;
  budget: number | null;
  sortOrder: number;
}

export interface ProjectMilestone extends BaseEntity {
  projectId: string;
  name: string;
  date: string;
  icon: 'start' | 'end' | 'flag' | 'dollar' | 'warning';
  description: string | null;
}

export interface ProjectNote extends BaseEntity {
  projectId: string;
  userId: string | null;
  content: string;
}

export interface ProjectRate {
  id: string;
  projectId: string;
  roleId: string;
  rateHourly: number;
  rateDaily: number;
}

export interface BudgetRole {
  id: string;
  projectId: string;
  roleId: string;
  estimatedMinutes: number;
  estimatedBudget: number;
}

export interface OtherExpense extends BaseEntity {
  projectId: string;
  description: string;
  amount: number;
  date: string;
  isCharge: boolean;
}

export interface ProjectManager {
  projectId: string;
  userId: string;
}

export interface ProjectTag {
  projectId: string;
  tagId: string;
}

/**
 * Extended project detail returned by GET /projects/:id.
 */
export interface ProjectDetail extends Project {
  phases: ProjectPhase[];
  milestones: ProjectMilestone[];
  projectRates: ProjectRate[];
  budgetRoles: BudgetRole[];
  tags: Tag[];
  managers: User[];
  client: Client | null;
}

// ============================================================
// Assignment
// ============================================================

export interface Assignment extends AccountScopedEntity {
  personId: string;
  projectId: string;
  roleId: string;
  phaseId: string | null;
  workstreamId: string | null;
  startDate: string; // ISO date
  endDate: string; // ISO date
  minutesPerDay: number;
  isBillable: boolean;
  isNonWorkingDay: boolean;
  repeatFrequency: z.infer<typeof RepeatFrequency> | null;
  repeatEndDate: string | null;
  repeatCount: number | null;
  repeatParentId: string | null;
  note: string | null;
}

// ============================================================
// Scheduled Leave
// ============================================================

export interface ScheduledLeave extends AccountScopedEntity {
  personId: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  leaveType: z.infer<typeof LeaveType>;
  minutesPerDay: number | null; // NULL = full day
  note: string | null;
}

// ============================================================
// Timesheet
// ============================================================

export interface TimesheetEntry extends AccountScopedEntity {
  personId: string;
  projectId: string;
  roleId: string | null;
  phaseId: string | null;
  date: string; // ISO date
  actualMinutes: number;
  isBillable: boolean;
  note: string | null;
  isLocked: boolean;
}

export interface TimesheetLock extends BaseEntity {
  accountId: string;
  projectId: string;
  weekStartDate: string; // ISO date (Monday)
  lockedBy: string;
  lockedAt: string;
}

// ============================================================
// Public Holidays
// ============================================================

export interface PublicHoliday extends AccountScopedEntity {
  date: string; // ISO date
  name: string;
  countryCode: string | null;
  holidayGroupId: string | null;
}

export interface HolidayGroup extends AccountScopedEntity {
  name: string;
  countryCode: string | null;
}

// ============================================================
// Rate Card
// ============================================================

export interface RateCard extends AccountScopedEntity {
  name: string;
  cardType: 'standard' | 'internal' | 'custom';
  rateMode: 'per_role' | 'blended';
  isDefault: boolean;
  entries?: RateCardEntry[];
}

export interface RateCardEntry {
  id: string;
  rateCardId: string;
  roleId: string;
  rateHourly: number;
  rateDaily: number;
}

// ============================================================
// Resource Request
// ============================================================

export interface PersonRequest extends AccountScopedEntity {
  projectId: string;
  roleId: string;
  placeholderId: string | null;
  status: 'open' | 'filled' | 'cancelled';
  startDate: string | null;
  endDate: string | null;
  minutesPerDay: number | null;
  note: string | null;
}

// ============================================================
// Custom Field Definition
// ============================================================

export interface CustomFieldDefinition extends BaseEntity {
  accountId: string;
  name: string;
  fieldType: 'text' | 'number' | 'dropdown' | 'date' | 'checkbox';
  entityType: 'person' | 'project';
  options: string[];
}

// ============================================================
// Activity Log
// ============================================================

export interface ActivityLog extends BaseEntity {
  accountId: string;
  userId: string | null;
  action: 'create' | 'update' | 'delete' | 'archive';
  entityType: string;
  entityId: string;
  changes: Record<string, [unknown, unknown]> | null;
}

// ============================================================
// Views
// ============================================================

export interface SavedView extends BaseEntity {
  accountId: string;
  userId: string | null;
  name: string;
  viewType: 'people_planner' | 'projects_planner';
  config: ViewConfig;
  isShared: boolean;
}

export interface ViewConfig {
  filters?: Record<string, unknown>;
  groupBy?: string;
  sortBy?: string;
  timeScale?: 'week' | 'month' | 'quarter' | 'halfyear' | 'year';
  columns?: string[];
}

// ============================================================
// User Starred (Bookmarks)
// ============================================================

export interface UserStarred {
  userId: string;
  entityType: 'person' | 'project';
  entityId: string;
  createdAt: string;
}

// ============================================================
// Invitation
// ============================================================

export interface Invitation extends BaseEntity {
  accountId: string;
  email: string;
  role: 'admin' | 'manager' | 'contributor';
  invitedBy: string;
  token: string;
  expiresAt: string;
  acceptedAt: string | null;
}

// ============================================================
// API Key
// ============================================================

export interface ApiKey extends BaseEntity {
  accountId: string;
  userId: string;
  name: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  // Note: keyHash is never exposed; the raw key is shown only once at creation
}

// ============================================================
// Project Template
// ============================================================

export interface ProjectTemplate extends BaseEntity {
  accountId: string;
  name: string;
  description: string | null;
  config: ProjectTemplateConfig;
  createdBy: string | null;
}

export interface ProjectTemplateConfig {
  pricingModel?: string;
  budgetMethod?: string;
  rateCardId?: string;
  phases?: Array<{
    name: string;
    relativeDays: number;
    durationDays: number;
    color?: string;
  }>;
  milestones?: Array<{
    name: string;
    relativeDays: number;
    icon?: string;
  }>;
  roleAllocations?: Array<{
    roleId: string;
    minutesPerDay: number;
  }>;
  tags?: string[];
}

// ============================================================
// Notification
// ============================================================

export interface Notification extends BaseEntity {
  accountId: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  category: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
}

// ============================================================
// Integration Connection
// ============================================================

export interface IntegrationConnection extends BaseEntity {
  accountId: string;
  provider: string;
  config: Record<string, unknown>;
  status: 'active' | 'paused' | 'error';
  lastSyncAt: string | null;
}

// ============================================================
// Computed Domain Types (not stored in DB)
// ============================================================

/**
 * Availability data for a single time period (week/month/etc.)
 * as displayed in the planner.
 */
export interface PeriodAvailability {
  periodStart: string; // ISO date
  periodEnd: string; // ISO date
  /** Total capacity from contract (working days x minutes/day) */
  contractCapacityMinutes: number;
  /** Capacity after deducting leave/holidays */
  effectiveCapacityMinutes: number;
  /** Total scheduled assignment minutes */
  scheduledMinutes: number;
  /** (effective - scheduled) / effective x 100 */
  availablePct: number;
  /** 5-level status based on availability percentage */
  status: z.infer<typeof AvailabilityStatus>;
  /** Human-readable label (e.g., "40h free", "16h over") */
  label: string;
  /** Hex color for the availability indicator */
  color: string;
}

/**
 * Financial summary for a project.
 * Returned by the Financial Engine.
 */
export interface ProjectFinancials {
  scheduledRevenue: number;
  scheduledCost: number;
  scheduledProfit: number;
  scheduledMargin: number; // percentage
  actualRevenue: number;
  actualCost: number;
  actualProfit: number;
  scheduledHours: number;
  actualHours: number;
  variance: number; // actualHours - scheduledHours
  budgetRemaining: number;
  /** T&M benchmark revenue (always calculated for comparison) */
  tmBenchmark: number;
}

/**
 * Utilization data for a person over a date range.
 */
export interface UtilizationData {
  personId: string;
  /** Total available capacity in minutes */
  capacityMinutes: number;
  /** Total scheduled minutes */
  scheduledMinutes: number;
  /** Total billable scheduled minutes */
  billableMinutes: number;
  /** Total non-billable scheduled minutes */
  nonBillableMinutes: number;
  /** Total actual (timesheet) minutes */
  actualMinutes: number;
  /** Leave minutes deducted from capacity */
  leaveMinutes: number;
  /** Total utilization percentage: scheduled / capacity x 100 */
  totalUtilizationPct: number;
  /** Billable utilization percentage: billable / capacity x 100 */
  billableUtilizationPct: number;
}

/**
 * Capacity vs demand data for workforce planning.
 */
export interface CapacityData {
  /** ISO date of the period start */
  periodStart: string;
  /** ISO date of the period end */
  periodEnd: string;
  /** Total capacity in minutes across all people */
  totalCapacityMinutes: number;
  /** Total scheduled demand in minutes */
  totalDemandMinutes: number;
  /** Surplus (positive) or deficit (negative) minutes */
  surplusMinutes: number;
  /** Number of people with availability */
  availablePeople: number;
  /** Number of people at or over capacity */
  fullPeople: number;
}

/**
 * Client financial forecast for a single week.
 */
export interface WeekForecast {
  weekStart: string; // ISO date
  billings: number;
  peopleCosts: number;
  profit: number;
  margin: number; // percentage
}

/**
 * Client dashboard forecast (4-week rolling).
 */
export interface ClientForecast {
  clientId: string;
  weeks: WeekForecast[];
}

/**
 * SmartMatch result for placeholder-to-person matching.
 */
export interface SmartMatchResult {
  person: Person;
  matchScore: number; // 0-100
  reasons: string[];
}
