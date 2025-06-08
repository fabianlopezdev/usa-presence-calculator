/**
 * UTC Date Helper Functions
 *
 * These functions ensure consistent UTC date handling across the application,
 * avoiding timezone-related issues and DST complications.
 */

// Parse date string to UTC Date object
export function parseUTCDate(dateString: string): Date {
  // First, do a basic format check to quickly reject clearly invalid strings.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return new Date(NaN); // Return an "Invalid Date" object
  }

  const [year, month, day] = dateString.split('-').map(Number);

  // Check for invalid month or day numbers.
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return new Date(NaN);
  }

  // Create the date using UTC. JavaScript will still roll over dates
  // like Feb 30 into March, so we need one more check.
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 || // month is 0-indexed
    date.getUTCDate() !== day
  ) {
    return new Date(NaN); // Return an "Invalid Date" if a rollover occurred.
  }

  return date;
}

// Format date to YYYY-MM-DD using UTC components
export function formatUTCDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get current UTC date
export function getCurrentUTCDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
}

// Get UTC year from date
export function getUTCYear(date: Date): number {
  return date.getUTCFullYear();
}

// Subtract days from a UTC date
export function subUTCDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() - days);
  return result;
}
