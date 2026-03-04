import { z } from 'zod';

// ============================================================
// Shared Enums
// ============================================================

export const EmploymentType = z.enum(['employee', 'contractor']);
export type EmploymentType = z.infer<typeof EmploymentType>;

export const UserRole = z.enum(['admin', 'manager', 'contributor']);
export type UserRole = z.infer<typeof UserRole>;

export const ProjectState = z.enum(['active', 'archived']);
export type ProjectState = z.infer<typeof ProjectState>;

export const ProjectStatus = z.enum(['confirmed', 'tentative']);
export type ProjectStatus = z.infer<typeof ProjectStatus>;

export const PricingModel = z.enum([
  'time_and_materials',
  'fixed_price',
  'non_billable',
]);
export type PricingModel = z.infer<typeof PricingModel>;

export const BudgetMethod = z.enum([
  'total',
  'roles',
  'phases',
  'phases_roles',
]);
export type BudgetMethod = z.infer<typeof BudgetMethod>;

export const RateType = z.enum(['hourly', 'daily']);
export type RateType = z.infer<typeof RateType>;

export const RateCardType = z.enum(['standard', 'internal', 'custom']);
export type RateCardType = z.infer<typeof RateCardType>;

export const RateMode = z.enum(['per_role', 'blended']);
export type RateMode = z.infer<typeof RateMode>;

export const LeaveType = z.enum(['leave', 'holiday', 'rostered_off']);
export type LeaveType = z.infer<typeof LeaveType>;

export const RepeatFrequency = z.enum(['weekly', 'biweekly', 'monthly']);
export type RepeatFrequency = z.infer<typeof RepeatFrequency>;

export const CustomFieldType = z.enum([
  'text',
  'number',
  'dropdown',
  'date',
  'checkbox',
]);
export type CustomFieldType = z.infer<typeof CustomFieldType>;

export const EntityType = z.enum(['person', 'project']);
export type EntityType = z.infer<typeof EntityType>;

export const TagEntityType = z.enum(['person', 'project']);
export type TagEntityType = z.infer<typeof TagEntityType>;

export const MilestoneIcon = z.enum([
  'start',
  'end',
  'flag',
  'dollar',
  'warning',
]);
export type MilestoneIcon = z.infer<typeof MilestoneIcon>;

export const PersonRequestStatus = z.enum(['open', 'filled', 'cancelled']);
export type PersonRequestStatus = z.infer<typeof PersonRequestStatus>;

export const ActivityAction = z.enum([
  'create',
  'update',
  'delete',
  'archive',
]);
export type ActivityAction = z.infer<typeof ActivityAction>;

export const ViewType = z.enum(['people_planner', 'projects_planner']);
export type ViewType = z.infer<typeof ViewType>;

export const TimeScale = z.enum([
  'week',
  'month',
  'quarter',
  'halfyear',
  'year',
]);
export type TimeScale = z.infer<typeof TimeScale>;

export const AvailabilityStatus = z.enum([
  'free_high',
  'free_mid',
  'free_low',
  'free_minimal',
  'over',
]);
export type AvailabilityStatus = z.infer<typeof AvailabilityStatus>;

export const NotificationCategory = z.enum([
  'assignment_changes',
  'project_updates',
  'timesheet_reminders',
]);
export type NotificationCategory = z.infer<typeof NotificationCategory>;

export const IntegrationProvider = z.enum([
  'bamboohr',
  'jira',
  'linear',
  'clockify',
]);
export type IntegrationProvider = z.infer<typeof IntegrationProvider>;

export const IntegrationStatus = z.enum(['active', 'paused', 'error']);
export type IntegrationStatus = z.infer<typeof IntegrationStatus>;

// ============================================================
// Common Validators
// ============================================================

/** ISO date string (YYYY-MM-DD) */
export const IsoDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid ISO date (YYYY-MM-DD)');

/** UUID v4 string */
export const UuidString = z.string().uuid();

/** Non-negative decimal monetary value */
export const MoneyAmount = z.number().nonnegative();

/** Minutes per day (0 to max 1440) */
export const MinutesPerDay = z.number().int().min(0).max(1440);

// ============================================================
// Pagination (cursor-based)
// ============================================================

export const PaginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

// ============================================================
// Sorting
// ============================================================

export const SortDirection = z.enum(['asc', 'desc']);
export type SortDirection = z.infer<typeof SortDirection>;

export const SortQuerySchema = z.object({
  sortBy: z.string().optional(),
  sortDirection: SortDirection.default('asc'),
});
export type SortQuery = z.infer<typeof SortQuerySchema>;

// ============================================================
// Work Days (contract schedule)
// ============================================================

export const WorkDaysSchema = z.object({
  mon: z.boolean().default(true),
  tue: z.boolean().default(true),
  wed: z.boolean().default(true),
  thu: z.boolean().default(true),
  fri: z.boolean().default(true),
  sat: z.boolean().default(false),
  sun: z.boolean().default(false),
});
export type WorkDays = z.infer<typeof WorkDaysSchema>;
