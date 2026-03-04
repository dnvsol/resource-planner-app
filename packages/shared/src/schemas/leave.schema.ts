import { z } from 'zod';
import {
  IsoDateString,
  LeaveType,
  MinutesPerDay,
  PaginationQuerySchema,
  SortQuerySchema,
  UuidString,
} from './common.schema.js';

// ============================================================
// Create Leave
// ============================================================

export const CreateLeaveSchema = z.object({
  personId: UuidString,
  startDate: IsoDateString,
  endDate: IsoDateString,
  leaveType: LeaveType.default('leave'),
  minutesPerDay: MinutesPerDay.optional().nullable(), // NULL = full day; >= 15 for partial leave
  note: z.string().optional().nullable(),
});
export type CreateLeaveInput = z.infer<typeof CreateLeaveSchema>;

// ============================================================
// Update Leave (partial — personId not updatable)
// ============================================================

export const UpdateLeaveSchema = CreateLeaveSchema.omit({
  personId: true,
}).partial();
export type UpdateLeaveInput = z.infer<typeof UpdateLeaveSchema>;

// ============================================================
// Bulk Create Leave
// ============================================================

export const BulkCreateLeaveSchema = z.object({
  leaves: z.array(CreateLeaveSchema).min(1, 'At least one leave entry is required'),
});
export type BulkCreateLeaveInput = z.infer<typeof BulkCreateLeaveSchema>;

// ============================================================
// Bulk Delete Leave
// ============================================================

export const BulkDeleteLeaveSchema = z.object({
  ids: z.array(UuidString).min(1, 'At least one leave ID is required'),
});
export type BulkDeleteLeaveInput = z.infer<typeof BulkDeleteLeaveSchema>;

// ============================================================
// Leave Filter
// ============================================================

export const LeaveFilterSchema = z
  .object({
    personId: UuidString.optional(),
    leaveType: LeaveType.optional(),
    startDate: IsoDateString.optional(),
    endDate: IsoDateString.optional(),
  })
  .merge(PaginationQuerySchema)
  .merge(SortQuerySchema);
export type LeaveFilter = z.infer<typeof LeaveFilterSchema>;
