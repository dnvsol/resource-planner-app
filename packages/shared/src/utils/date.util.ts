import { DEFAULT_WORKING_DAYS } from '../constants/defaults.js';

// ============================================================
// Date Utility Functions
// ============================================================

/**
 * Parse an ISO date string (YYYY-MM-DD) into a Date object.
 * Sets time to midnight UTC to avoid timezone issues.
 */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Format a Date object to ISO date string (YYYY-MM-DD).
 */
export function formatDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a given date falls on a weekend (Saturday=6, Sunday=0).
 */
export function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

/**
 * Get the ISO day-of-week (1=Monday ... 7=Sunday) from a Date.
 */
export function getIsoWeekday(date: Date): number {
  const day = date.getUTCDay();
  return day === 0 ? 7 : day;
}

/**
 * Check if a date is a working day given a set of ISO working day numbers.
 * Default working days: [1,2,3,4,5] (Monday through Friday).
 */
export function isWorkingDay(
  date: Date,
  workingDays: readonly number[] = DEFAULT_WORKING_DAYS,
): boolean {
  return workingDays.includes(getIsoWeekday(date));
}

/**
 * Count the number of working days between two dates (inclusive).
 *
 * @param start - Start date (ISO string or Date)
 * @param end - End date (ISO string or Date)
 * @param workingDays - Array of ISO day-of-week numbers that are working days
 * @param holidays - Array of ISO date strings that are holidays (excluded from count)
 */
export function getWorkingDays(
  start: string | Date,
  end: string | Date,
  workingDays: readonly number[] = DEFAULT_WORKING_DAYS,
  holidays: readonly string[] = [],
): number {
  const startDate = typeof start === 'string' ? parseDate(start) : start;
  const endDate = typeof end === 'string' ? parseDate(end) : end;

  if (startDate > endDate) return 0;

  const holidaySet = new Set(holidays);
  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    if (
      isWorkingDay(current, workingDays) &&
      !holidaySet.has(formatDate(current))
    ) {
      count++;
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return count;
}

/**
 * Add a specified number of business days to a date.
 *
 * @param date - Starting date (ISO string or Date)
 * @param days - Number of business days to add (can be negative)
 * @param workingDays - Array of ISO day-of-week numbers that are working days
 */
export function addBusinessDays(
  date: string | Date,
  days: number,
  workingDays: readonly number[] = DEFAULT_WORKING_DAYS,
): Date {
  const result = typeof date === 'string' ? parseDate(date) : new Date(date);
  const direction = days >= 0 ? 1 : -1;
  let remaining = Math.abs(days);

  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() + direction);
    if (isWorkingDay(result, workingDays)) {
      remaining--;
    }
  }

  return result;
}

/**
 * Get the start of the week (Monday) for a given date.
 */
export function getWeekStart(date: string | Date): Date {
  const d = typeof date === 'string' ? parseDate(date) : new Date(date);
  const dayOfWeek = d.getUTCDay();
  // Sunday is 0, Monday is 1, etc.
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}

/**
 * Get the start of the month for a given date.
 */
export function getMonthStart(date: string | Date): Date {
  const d = typeof date === 'string' ? parseDate(date) : new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

/**
 * Get the end of the month for a given date.
 */
export function getMonthEnd(date: string | Date): Date {
  const d = typeof date === 'string' ? parseDate(date) : new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
}

/**
 * Get the number of calendar days between two dates (inclusive).
 */
export function getCalendarDays(
  start: string | Date,
  end: string | Date,
): number {
  const startDate = typeof start === 'string' ? parseDate(start) : start;
  const endDate = typeof end === 'string' ? parseDate(end) : end;
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Check if two date ranges overlap.
 */
export function dateRangesOverlap(
  startA: string | Date,
  endA: string | Date,
  startB: string | Date,
  endB: string | Date,
): boolean {
  const sA = typeof startA === 'string' ? parseDate(startA) : startA;
  const eA = typeof endA === 'string' ? parseDate(endA) : endA;
  const sB = typeof startB === 'string' ? parseDate(startB) : startB;
  const eB = typeof endB === 'string' ? parseDate(endB) : endB;
  return sA <= eB && sB <= eA;
}

/**
 * Add calendar days to a date.
 */
export function addDays(date: string | Date, days: number): Date {
  const d = typeof date === 'string' ? parseDate(date) : new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}
