// ============================================================
// Formatting Utility Functions
// ============================================================

/**
 * Format a number as currency.
 *
 * @param amount - The numeric amount
 * @param currency - ISO 4217 currency code (default: 'USD')
 * @param locale - BCP 47 locale string (default: 'en-US')
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number as a compact currency (e.g., "$1.2K", "$3.4M").
 */
export function formatCurrencyCompact(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

/**
 * Format a number as a percentage.
 *
 * @param value - The numeric value (e.g., 75 for 75%)
 * @param decimals - Number of decimal places (default: 1)
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format hours with appropriate precision.
 *
 * @param hours - Number of hours
 * @param decimals - Number of decimal places (default: 1)
 */
export function formatHours(hours: number, decimals: number = 1): string {
  return `${hours.toFixed(decimals)}h`;
}

/**
 * Convert minutes to hours.
 */
export function minutesToHours(minutes: number): number {
  return minutes / 60;
}

/**
 * Convert hours to minutes.
 */
export function hoursToMinutes(hours: number): number {
  return hours * 60;
}

/**
 * Format minutes as a human-readable hours + minutes string.
 * E.g., 510 -> "8h 30m", 480 -> "8h", 30 -> "30m"
 */
export function formatMinutes(minutes: number): string {
  if (minutes === 0) return '0m';

  const negative = minutes < 0;
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const sign = negative ? '-' : '';

  if (h === 0) return `${sign}${m}m`;
  if (m === 0) return `${sign}${h}h`;
  return `${sign}${h}h ${m}m`;
}

/**
 * Format a decimal number with a fixed number of decimal places.
 */
export function formatDecimal(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

/**
 * Format a number with thousand separators.
 */
export function formatNumber(
  value: number,
  locale: string = 'en-US',
): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Calculate profit margin percentage.
 * Returns 0 if revenue is 0 to avoid division by zero.
 */
export function calculateMargin(revenue: number, cost: number): number {
  if (revenue === 0) return 0;
  return ((revenue - cost) / revenue) * 100;
}
