import { z } from 'zod';
import {
  IsoDateString,
  MinutesPerDay,
  PaginationQuerySchema,
  RepeatFrequency,
  SortQuerySchema,
  UuidString,
} from './common.schema.js';

// ============================================================
// Create Assignment
// ============================================================

export const CreateAssignmentSchema = z
  .object({
    personId: UuidString,
    projectId: UuidString,
    roleId: UuidString,
    phaseId: UuidString.optional().nullable(),
    workstreamId: UuidString.optional().nullable(),
    startDate: IsoDateString,
    endDate: IsoDateString,
    minutesPerDay: MinutesPerDay,
    isBillable: z.boolean().default(true),
    isNonWorkingDay: z.boolean().default(false),
    repeatFrequency: RepeatFrequency.optional().nullable(),
    repeatEndDate: IsoDateString.optional().nullable(),
    repeatCount: z.number().int().positive().optional().nullable(),
    note: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      // Non-working day assignments must have startDate === endDate
      if (data.isNonWorkingDay) {
        return data.startDate === data.endDate;
      }
      return true;
    },
    {
      message:
        'Non-working day assignments must have the same start and end date',
      path: ['endDate'],
    },
  )
  .refine(
    (data) => {
      // repeatEndDate and repeatCount are mutually exclusive
      if (data.repeatEndDate && data.repeatCount) {
        return false;
      }
      return true;
    },
    {
      message: 'repeatEndDate and repeatCount are mutually exclusive',
      path: ['repeatEndDate'],
    },
  );
export type CreateAssignmentInput = z.infer<typeof CreateAssignmentSchema>;

// ============================================================
// Update Assignment (partial — personId, projectId not updatable)
// ============================================================

export const UpdateAssignmentSchema = z.object({
  roleId: UuidString.optional(),
  phaseId: UuidString.optional().nullable(),
  workstreamId: UuidString.optional().nullable(),
  startDate: IsoDateString.optional(),
  endDate: IsoDateString.optional(),
  minutesPerDay: MinutesPerDay.optional(),
  isBillable: z.boolean().optional(),
  isNonWorkingDay: z.boolean().optional(),
  repeatFrequency: RepeatFrequency.optional().nullable(),
  repeatEndDate: IsoDateString.optional().nullable(),
  repeatCount: z.number().int().positive().optional().nullable(),
  note: z.string().optional().nullable(),
});
export type UpdateAssignmentInput = z.infer<typeof UpdateAssignmentSchema>;

// ============================================================
// Assignment Filter
// ============================================================

export const AssignmentFilterSchema = z
  .object({
    personId: UuidString.optional(),
    projectId: UuidString.optional(),
    roleId: UuidString.optional(),
    phaseId: UuidString.optional(),
    startDate: IsoDateString.optional(),
    endDate: IsoDateString.optional(),
    isBillable: z.coerce.boolean().optional(),
  })
  .merge(PaginationQuerySchema)
  .merge(SortQuerySchema);
export type AssignmentFilter = z.infer<typeof AssignmentFilterSchema>;
