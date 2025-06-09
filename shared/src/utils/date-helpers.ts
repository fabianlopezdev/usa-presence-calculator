/**
 * Extended Date Helper Functions
 *
 * This module provides standardized date handling across the application,
 * consolidating both UTC date functions and parseISO replacements.
 *
 * IMPORTANT: Always use these functions instead of date-fns parseISO to ensure
 * consistent UTC handling and validation.
 */

// Re-export all UTC date helpers
export {
  parseUTCDate,
  formatUTCDate,
  getCurrentUTCDate,
  getUTCYear,
  subUTCDays,
} from './utc-date-helpers';

// Import for internal use removed - using parseISO instead

// Import parseISO from date-fns for compatibility
import { parseISO } from 'date-fns';

// Create standardized aliases for consistency
// Note: Using parseISO for backward compatibility with existing tests
export { parseISO as parseDate };
export { formatUTCDate as formatDate } from './utc-date-helpers';
export { getCurrentUTCDate as getCurrentDate } from './utc-date-helpers';

/**
 * Add days to a UTC date
 *
 * @param date - The date to add days to
 * @param days - Number of days to add
 * @returns New date with added days
 */
export function addUTCDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/**
 * Get the start of a UTC day (00:00:00.000)
 *
 * @param date - The date to get start of day for
 * @returns Date at start of day in UTC
 */
export function startOfUTCDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0),
  );
}

/**
 * Get the end of a UTC day (23:59:59.999)
 *
 * @param date - The date to get end of day for
 * @returns Date at end of day in UTC
 */
export function endOfUTCDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999),
  );
}

/**
 * Check if a date is valid
 *
 * @param date - The date to check
 * @returns True if date is valid
 */
export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Parse a date that might be a string or Date object
 *
 * @param dateInput - String in YYYY-MM-DD format or Date object
 * @returns Parsed Date object
 */
export function parseDateInput(dateInput: string | Date): Date {
  if (dateInput instanceof Date) {
    return dateInput;
  }
  return parseISO(dateInput);
}

/**
 * Get the number of days in a month
 *
 * @param year - The year
 * @param month - The month (1-12)
 * @returns Number of days in the month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Check if a year is a leap year
 *
 * @param year - The year to check
 * @returns True if leap year
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}
