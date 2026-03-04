import { z } from 'zod';
import {
  BudgetMethod,
  IsoDateString,
  MilestoneIcon,
  MoneyAmount,
  PaginationQuerySchema,
  PricingModel,
  ProjectState,
  ProjectStatus,
  RateType,
  SortQuerySchema,
  UuidString,
} from './common.schema.js';

// ============================================================
// Create Project
// ============================================================

export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
  clientId: UuidString.optional().nullable(),
  teamId: UuidString.optional().nullable(),
  rateCardId: UuidString.optional().nullable(),
  pricingModel: PricingModel.default('time_and_materials'),
  budget: MoneyAmount.optional().nullable(),
  expensesBudget: MoneyAmount.optional().nullable(),
  budgetMethod: BudgetMethod.default('total'),
  status: ProjectStatus.default('confirmed'),
  state: ProjectState.default('active'),
  rateType: RateType.default('hourly'),
  emoji: z.string().max(10).optional().nullable(),
  tags: z.array(UuidString).default([]),
  references: z.record(z.string(), z.string()).default({}),
  customFields: z.record(z.string(), z.unknown()).default({}),
});
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

// ============================================================
// Update Project (partial)
// ============================================================

export const UpdateProjectSchema = CreateProjectSchema.partial();
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;

// ============================================================
// Bulk Update Projects
// ============================================================

export const BulkUpdateProjectsSchema = z.object({
  ids: z.array(UuidString).min(1, 'At least one project ID is required'),
  updates: UpdateProjectSchema,
});
export type BulkUpdateProjectsInput = z.infer<typeof BulkUpdateProjectsSchema>;

// ============================================================
// Project Filter
// ============================================================

export const ProjectFilterSchema = z
  .object({
    clientId: UuidString.optional(),
    status: ProjectStatus.optional(),
    state: ProjectState.optional(),
    pricingModel: PricingModel.optional(),
    teamId: UuidString.optional(),
    search: z.string().max(255).optional(),
    tags: z
      .union([z.array(UuidString), z.string().transform((s) => s.split(','))])
      .optional(),
  })
  .merge(PaginationQuerySchema)
  .merge(SortQuerySchema);
export type ProjectFilter = z.infer<typeof ProjectFilterSchema>;

// ============================================================
// Phase
// ============================================================

export const CreatePhaseSchema = z.object({
  name: z.string().min(1, 'Phase name is required').max(255),
  startDate: IsoDateString.optional().nullable(),
  endDate: IsoDateString.optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color')
    .default('#67D0D5'),
  budget: MoneyAmount.optional().nullable(),
  sortOrder: z.number().int().default(0),
});
export type CreatePhaseInput = z.infer<typeof CreatePhaseSchema>;

export const UpdatePhaseSchema = CreatePhaseSchema.partial();
export type UpdatePhaseInput = z.infer<typeof UpdatePhaseSchema>;

// ============================================================
// Milestone
// ============================================================

export const CreateMilestoneSchema = z.object({
  name: z.string().min(1, 'Milestone name is required').max(255),
  date: IsoDateString,
  icon: MilestoneIcon.default('flag'),
  description: z.string().optional().nullable(),
});
export type CreateMilestoneInput = z.infer<typeof CreateMilestoneSchema>;

export const UpdateMilestoneSchema = CreateMilestoneSchema.partial();
export type UpdateMilestoneInput = z.infer<typeof UpdateMilestoneSchema>;

// ============================================================
// Other Expenses
// ============================================================

export const CreateOtherExpenseSchema = z.object({
  description: z.string().min(1, 'Description is required').max(255),
  amount: z.number(),
  date: IsoDateString,
  isCharge: z.boolean().default(true),
});
export type CreateOtherExpenseInput = z.infer<typeof CreateOtherExpenseSchema>;

export const UpdateOtherExpenseSchema = CreateOtherExpenseSchema.partial();
export type UpdateOtherExpenseInput = z.infer<typeof UpdateOtherExpenseSchema>;

// ============================================================
// Project Rate Override
// ============================================================

export const ProjectRateSchema = z.object({
  roleId: UuidString,
  rateHourly: MoneyAmount.default(0),
  rateDaily: MoneyAmount.default(0),
});
export type ProjectRateInput = z.infer<typeof ProjectRateSchema>;

// ============================================================
// Budget Role
// ============================================================

export const BudgetRoleSchema = z.object({
  roleId: UuidString,
  estimatedMinutes: z.number().int().nonnegative().default(0),
  estimatedBudget: MoneyAmount.default(0),
});
export type BudgetRoleInput = z.infer<typeof BudgetRoleSchema>;

// ============================================================
// Project Note
// ============================================================

export const CreateProjectNoteSchema = z.object({
  content: z.string().min(1, 'Note content is required'),
});
export type CreateProjectNoteInput = z.infer<typeof CreateProjectNoteSchema>;

// ============================================================
// Project Duplicate / Reschedule
// ============================================================

export const RescheduleProjectSchema = z.object({
  shiftDays: z.number().int(),
});
export type RescheduleProjectInput = z.infer<typeof RescheduleProjectSchema>;
