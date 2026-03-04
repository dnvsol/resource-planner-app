import { z } from 'zod';
import {
  IsoDateString,
  PaginationQuerySchema,
  SortQuerySchema,
  UuidString,
} from './common.schema.js';

// ============================================================
// Create Person
// ============================================================

export const CreatePersonSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email().optional().nullable(),
  teamId: UuidString.optional().nullable(),
  managerId: UuidString.optional().nullable(),
  isPlaceholder: z.boolean().default(false),
  holidayGroupId: UuidString.optional().nullable(),
  photoUrl: z.string().url().max(500).optional().nullable(),
  tags: z.array(UuidString).default([]),
  references: z.record(z.string(), z.string()).default({}),
  links: z
    .array(
      z.object({
        label: z.string().optional(),
        url: z.string().url(),
      }),
    )
    .default([]),
  customFields: z.record(z.string(), z.unknown()).default({}),
});
export type CreatePersonInput = z.infer<typeof CreatePersonSchema>;

// ============================================================
// Update Person (partial)
// ============================================================

export const UpdatePersonSchema = CreatePersonSchema.partial();
export type UpdatePersonInput = z.infer<typeof UpdatePersonSchema>;

// ============================================================
// Bulk Update People
// ============================================================

export const BulkUpdatePeopleSchema = z.object({
  ids: z.array(UuidString).min(1, 'At least one person ID is required'),
  updates: UpdatePersonSchema,
});
export type BulkUpdatePeopleInput = z.infer<typeof BulkUpdatePeopleSchema>;

// ============================================================
// Person Filter
// ============================================================

export const PersonFilterSchema = z
  .object({
    teamId: UuidString.optional(),
    roleId: UuidString.optional(),
    archived: z.coerce.boolean().optional(),
    isPlaceholder: z.coerce.boolean().optional(),
    managerId: UuidString.optional(),
    search: z.string().max(255).optional(),
    tags: z
      .union([z.array(UuidString), z.string().transform((s) => s.split(','))])
      .optional(),
    skills: z
      .union([z.array(UuidString), z.string().transform((s) => s.split(','))])
      .optional(),
    employmentType: z.enum(['employee', 'contractor']).optional(),
  })
  .merge(PaginationQuerySchema)
  .merge(SortQuerySchema);
export type PersonFilter = z.infer<typeof PersonFilterSchema>;

// ============================================================
// Person Skill
// ============================================================

export const PersonSkillSchema = z.object({
  skillId: UuidString,
  level: z.number().int().min(0).max(5).default(0),
});
export type PersonSkillInput = z.infer<typeof PersonSkillSchema>;

// ============================================================
// Person Note
// ============================================================

export const CreatePersonNoteSchema = z.object({
  content: z.string().min(1, 'Note content is required'),
});
export type CreatePersonNoteInput = z.infer<typeof CreatePersonNoteSchema>;
