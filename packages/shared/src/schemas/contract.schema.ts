import { z } from 'zod';
import {
  EmploymentType,
  IsoDateString,
  MinutesPerDay,
  MoneyAmount,
  UuidString,
  WorkDaysSchema,
} from './common.schema.js';

// ============================================================
// Create Contract
// ============================================================

export const CreateContractSchema = z.object({
  personId: UuidString,
  roleId: UuidString,
  jobTitle: z.string().max(255).optional().nullable(),
  employmentType: EmploymentType.default('employee'),
  startDate: IsoDateString,
  endDate: IsoDateString.optional().nullable(),
  workDays: WorkDaysSchema.default({
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: false,
    sun: false,
  }),
  minutesPerDay: MinutesPerDay.default(480),
  costRateHourly: MoneyAmount.default(0),
});
export type CreateContractInput = z.infer<typeof CreateContractSchema>;

// ============================================================
// Update Contract (partial — personId not updatable)
// ============================================================

export const UpdateContractSchema = CreateContractSchema.omit({
  personId: true,
}).partial();
export type UpdateContractInput = z.infer<typeof UpdateContractSchema>;
