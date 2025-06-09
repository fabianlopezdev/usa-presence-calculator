/**
 * Date and Time Constants
 *
 * Common date/time values and utility constants used
 * throughout the application for date calculations.
 */

// ============================================================================
// TIME UNIT CONVERSIONS
// ============================================================================

/**
 * Milliseconds Conversions
 * Used for date arithmetic and time calculations
 */
export const MILLISECONDS = {
  PER_SECOND: 1000,
  PER_MINUTE: 1000 * 60,
  PER_HOUR: 1000 * 60 * 60,
  PER_DAY: 1000 * 60 * 60 * 24,
} as const;

// ============================================================================
// CALENDAR CONSTANTS
// ============================================================================

/**
 * Day of Week Indices
 * JavaScript Date.getDay() returns 0-6
 */
export const DAY_OF_WEEK = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
} as const;

/**
 * Month Indices (0-based)
 * JavaScript Date months are 0-indexed
 */
export const MONTH_INDEX = {
  JANUARY: 0,
  FEBRUARY: 1,
  MARCH: 2,
  APRIL: 3,
  MAY: 4,
  JUNE: 5,
  JULY: 6,
  AUGUST: 7,
  SEPTEMBER: 8,
  OCTOBER: 9,
  NOVEMBER: 10,
  DECEMBER: 11,
} as const;

// ============================================================================
// DATE FORMATTING
// ============================================================================

/**
 * ISO Date String Utilities
 * Common patterns for working with ISO date strings
 */
export const ISO_DATE_UTILS = {
  /** Extracts YYYY-MM-DD from ISO string */
  DATE_ONLY_REGEX: /^\d{4}-\d{2}-\d{2}/,
  /** Split character for getting date portion */
  TIME_SEPARATOR: 'T',
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type DayOfWeek = (typeof DAY_OF_WEEK)[keyof typeof DAY_OF_WEEK];
export type MonthIndex = (typeof MONTH_INDEX)[keyof typeof MONTH_INDEX];
