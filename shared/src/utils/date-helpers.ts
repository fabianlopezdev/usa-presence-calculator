// External dependencies
import { parseISO } from 'date-fns';

// Re-export all UTC date helpers
export {
  parseUTCDate,
  formatUTCDate,
  getCurrentUTCDate,
  getUTCYear,
  subUTCDays,
} from './utc-date-helpers';

// Using parseISO for backward compatibility with existing tests
export { parseISO as parseDate };
export { formatUTCDate as formatDate } from './utc-date-helpers';
export { getCurrentUTCDate as getCurrentDate } from './utc-date-helpers';

// Strict date validation for USCIS compliance - only accepts YYYY-MM-DD format
export function isValidDateFormat(dateString: string): boolean {
  if (typeof dateString !== 'string') return false;

  // Must match YYYY-MM-DD format exactly
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;

  // Verify it's a real calendar date
  const parsed = parseISO(dateString);
  return !isNaN(parsed.getTime());
}

export function addUTCDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function endOfUTCDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999),
  );
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

export function parseDateInput(dateInput: string | Date): Date {
  if (dateInput instanceof Date) {
    return dateInput;
  }
  return parseISO(dateInput);
}

export function startOfUTCDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0),
  );
}
