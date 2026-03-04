import { z } from 'zod';
import {
  MoneyAmount,
  RateCardType,
  RateMode,
  TagEntityType,
  UuidString,
} from './common.schema.js';

// ============================================================
// Team
// ============================================================

export const CreateTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(100),
});
export type CreateTeamInput = z.infer<typeof CreateTeamSchema>;

export const UpdateTeamSchema = CreateTeamSchema.partial();
export type UpdateTeamInput = z.infer<typeof UpdateTeamSchema>;

// ============================================================
// Role
// ============================================================

export const CreateRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(100),
  defaultHourlyRate: MoneyAmount.default(0),
  defaultHourlyCost: MoneyAmount.default(0),
  references: z.record(z.string(), z.string()).default({}),
});
export type CreateRoleInput = z.infer<typeof CreateRoleSchema>;

export const UpdateRoleSchema = CreateRoleSchema.partial();
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>;

// ============================================================
// Skill
// ============================================================

export const CreateSkillSchema = z.object({
  name: z.string().min(1, 'Skill name is required').max(100),
});
export type CreateSkillInput = z.infer<typeof CreateSkillSchema>;

export const UpdateSkillSchema = CreateSkillSchema.partial();
export type UpdateSkillInput = z.infer<typeof UpdateSkillSchema>;

// ============================================================
// Tag
// ============================================================

export const CreateTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(100),
  entityType: TagEntityType,
});
export type CreateTagInput = z.infer<typeof CreateTagSchema>;

export const UpdateTagSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});
export type UpdateTagInput = z.infer<typeof UpdateTagSchema>;

// ============================================================
// Client
// ============================================================

export const CreateClientSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(255),
  website: z.string().url().max(255).optional().nullable(),
  references: z.record(z.string(), z.string()).default({}),
});
export type CreateClientInput = z.infer<typeof CreateClientSchema>;

export const UpdateClientSchema = CreateClientSchema.partial();
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;

export const BulkCreateClientsSchema = z.object({
  clients: z.array(CreateClientSchema).min(1, 'At least one client is required'),
});
export type BulkCreateClientsInput = z.infer<typeof BulkCreateClientsSchema>;

// ============================================================
// Workstream
// ============================================================

export const CreateWorkstreamSchema = z.object({
  name: z.string().min(1, 'Workstream name is required').max(255),
});
export type CreateWorkstreamInput = z.infer<typeof CreateWorkstreamSchema>;

export const UpdateWorkstreamSchema = CreateWorkstreamSchema.partial();
export type UpdateWorkstreamInput = z.infer<typeof UpdateWorkstreamSchema>;

// ============================================================
// Rate Card
// ============================================================

export const CreateRateCardSchema = z.object({
  name: z.string().min(1, 'Rate card name is required').max(100),
  cardType: RateCardType.default('standard'),
  rateMode: RateMode.default('per_role'),
  isDefault: z.boolean().default(false),
});
export type CreateRateCardInput = z.infer<typeof CreateRateCardSchema>;

export const UpdateRateCardSchema = CreateRateCardSchema.partial();
export type UpdateRateCardInput = z.infer<typeof UpdateRateCardSchema>;

// ============================================================
// Rate Card Entry
// ============================================================

export const CreateRateCardEntrySchema = z.object({
  roleId: UuidString,
  rateHourly: MoneyAmount.default(0),
  rateDaily: MoneyAmount.default(0),
});
export type CreateRateCardEntryInput = z.infer<typeof CreateRateCardEntrySchema>;

export const UpdateRateCardEntrySchema = z.object({
  rateHourly: MoneyAmount.optional(),
  rateDaily: MoneyAmount.optional(),
});
export type UpdateRateCardEntryInput = z.infer<typeof UpdateRateCardEntrySchema>;

// ============================================================
// Custom Field Definition
// ============================================================

export const CreateCustomFieldDefinitionSchema = z.object({
  name: z.string().min(1, 'Field name is required').max(100),
  fieldType: z.enum(['text', 'number', 'dropdown', 'date', 'checkbox']),
  entityType: z.enum(['person', 'project']),
  options: z.array(z.string()).default([]),
});
export type CreateCustomFieldDefinitionInput = z.infer<
  typeof CreateCustomFieldDefinitionSchema
>;

export const UpdateCustomFieldDefinitionSchema =
  CreateCustomFieldDefinitionSchema.partial();
export type UpdateCustomFieldDefinitionInput = z.infer<
  typeof UpdateCustomFieldDefinitionSchema
>;

// ============================================================
// Holiday Group
// ============================================================

export const CreateHolidayGroupSchema = z.object({
  name: z.string().min(1, 'Holiday group name is required').max(100),
  countryCode: z.string().length(2).optional().nullable(),
});
export type CreateHolidayGroupInput = z.infer<typeof CreateHolidayGroupSchema>;

export const UpdateHolidayGroupSchema = CreateHolidayGroupSchema.partial();
export type UpdateHolidayGroupInput = z.infer<typeof UpdateHolidayGroupSchema>;

// ============================================================
// Public Holiday
// ============================================================

export const CreatePublicHolidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid ISO date'),
  name: z.string().min(1, 'Holiday name is required').max(255),
  countryCode: z.string().length(2).optional().nullable(),
  holidayGroupId: UuidString.optional().nullable(),
});
export type CreatePublicHolidayInput = z.infer<typeof CreatePublicHolidaySchema>;
