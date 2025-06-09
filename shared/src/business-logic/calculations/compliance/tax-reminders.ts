/**
 * Tax Filing Reminder Calculator
 *
 * Provides tax filing reminders and travel-aware notifications
 * for LPRs who must file US taxes on worldwide income
 *
 * Handles IRS rules including:
 * - Weekend/holiday deadline adjustments
 * - Automatic 2-month extension for taxpayers abroad
 * - October extension deadline with Form 4868
 */

// External dependencies
import { differenceInDays, isAfter, isBefore, getYear } from 'date-fns';

// Internal dependencies - Schemas & Types
import { TaxReminderStatus } from '@schemas/compliance';
import { Trip } from '@schemas/trip';

// Internal dependencies - Constants
import { TAX_FILING } from '@constants/uscis-rules';
import {
  TAX_DEADLINE_TYPE,
  TAX_EXTENSION_DEADLINE_DISPLAY,
  GOVERNMENT_FORM_NAMES,
} from '@constants/compliance';
import { ISO_DATE_UTILS } from '@constants/date-time';

// Internal dependencies - Helpers
import { adjustForWeekend } from './tax-deadline-helpers';

// Internal dependencies - Utilities
import { parseDate } from '@utils/date-helpers';

/**
 * Calculate the tax filing reminder status
 */
export function calculateTaxReminderStatus(
  trips: Trip[],
  reminderDismissed: boolean,
  currentDate: string = new Date().toISOString(),
): TaxReminderStatus {
  const isAbroadDuringTaxSeason = willBeAbroadDuringTaxSeason(trips, currentDate);

  // Determine which deadline applies
  const applicableDeadline = isAbroadDuringTaxSeason
    ? TAX_DEADLINE_TYPE.ABROAD_EXTENSION
    : TAX_DEADLINE_TYPE.STANDARD;

  // Get the actual deadline (adjusted for weekends/holidays)
  const actualDeadline = getActualTaxDeadline(currentDate, applicableDeadline);
  const daysUntilDeadline = getDaysUntilSpecificDeadline(actualDeadline, currentDate);

  // For legacy compatibility, keep nextDeadline as the base deadline
  const nextDeadline = getNextTaxDeadline(currentDate);

  return {
    nextDeadline,
    daysUntilDeadline,
    isAbroadDuringTaxSeason,
    reminderDismissed,
    applicableDeadline,
    actualDeadline,
  };
}

/**
 * Get the actual tax deadline adjusted for weekends and common holidays
 */
export function getActualTaxDeadline(
  currentDate: string = new Date().toISOString(),
  deadlineType: 'standard' | 'abroad_extension' | 'october_extension' = TAX_DEADLINE_TYPE.STANDARD,
): string {
  const current = parseDate(currentDate);
  const currentYear = getYear(current);

  // Get base deadline for current year
  let baseDeadline = getBaseDeadlineForYear(currentYear, deadlineType);

  // Check if we need to look at next year's deadline
  if (isAfter(current, adjustForWeekend(baseDeadline))) {
    baseDeadline = getBaseDeadlineForYear(currentYear + 1, deadlineType);
  }

  // Adjust for weekends
  const adjustedDeadline = adjustForWeekend(baseDeadline);
  return adjustedDeadline.toISOString().split(ISO_DATE_UTILS.TIME_SEPARATOR)[0];
}

/**
 * Get base deadline for a specific year and type
 */
function getBaseDeadlineForYear(
  year: number,
  deadlineType: 'standard' | 'abroad_extension' | 'october_extension',
): Date {
  switch (deadlineType) {
    case TAX_DEADLINE_TYPE.ABROAD_EXTENSION:
      return parseDate(
        `${year}-${TAX_FILING.ABROAD_EXTENSION_MONTH}-${TAX_FILING.ABROAD_EXTENSION_DAY}`,
      );
    case TAX_DEADLINE_TYPE.OCTOBER_EXTENSION:
      return parseDate(
        `${year}-${TAX_FILING.OCTOBER_EXTENSION_MONTH}-${TAX_FILING.OCTOBER_EXTENSION_DAY}`,
      );
    default:
      return parseDate(`${year}-${TAX_FILING.DEADLINE_MONTH}-${TAX_FILING.DEADLINE_DAY}`);
  }
}

/**
 * Get the next tax filing deadline (legacy - for backward compatibility)
 */
export function getNextTaxDeadline(currentDate: string = new Date().toISOString()): string {
  const current = parseDate(currentDate);
  const currentYear = getYear(current);

  // Tax deadline for current year
  const currentYearDeadline = parseDate(
    `${currentYear}-${TAX_FILING.DEADLINE_MONTH}-${TAX_FILING.DEADLINE_DAY}`,
  );

  // If we're past this year's deadline, return next year's
  if (isAfter(current, currentYearDeadline)) {
    return `${currentYear + 1}-${TAX_FILING.DEADLINE_MONTH}-${TAX_FILING.DEADLINE_DAY}`;
  }

  return `${currentYear}-${TAX_FILING.DEADLINE_MONTH}-${TAX_FILING.DEADLINE_DAY}`;
}

/**
 * Calculate days until a specific deadline
 */
export function getDaysUntilSpecificDeadline(
  deadline: string,
  currentDate: string = new Date().toISOString(),
): number {
  const current = parseDate(currentDate);
  const deadlineDate = parseDate(deadline);

  // If it's deadline day, return 0
  if (current.getTime() === deadlineDate.getTime()) {
    return 0;
  }

  return differenceInDays(deadlineDate, current);
}

/**
 * Calculate days until the next tax deadline (legacy - for backward compatibility)
 */
export function getDaysUntilTaxDeadline(currentDate: string = new Date().toISOString()): number {
  const current = parseDate(currentDate);
  const nextDeadline = parseDate(getNextTaxDeadline(currentDate));

  // If it's deadline day, return 0
  if (current.getTime() === nextDeadline.getTime()) {
    return 0;
  }

  return differenceInDays(nextDeadline, current);
}

/**
 * Check if currently in tax season (late January - April 15)
 * Updated to reflect when IRS actually starts accepting returns
 */
export function isCurrentlyTaxSeason(currentDate: string = new Date().toISOString()): boolean {
  const current = parseDate(currentDate);
  const { start, end } = getTaxSeasonDateRange(currentDate);

  const seasonStart = parseDate(start);
  const seasonEnd = parseDate(end);

  return (
    (isAfter(current, seasonStart) || current.getTime() === seasonStart.getTime()) &&
    (isBefore(current, seasonEnd) || current.getTime() === seasonEnd.getTime())
  );
}

/**
 * Check if user will be abroad during the upcoming tax season
 */
export function willBeAbroadDuringTaxSeason(
  trips: Trip[],
  currentDate: string = new Date().toISOString(),
): boolean {
  // Get next tax deadline to determine which tax season to check
  const nextDeadline = getNextTaxDeadline(currentDate);
  const nextDeadlineYear = getYear(parseDate(nextDeadline));

  // Get the tax season dates for the year of the next deadline
  const seasonStart = `${nextDeadlineYear}-${TAX_FILING.SEASON_START_MONTH}-${TAX_FILING.SEASON_START_DAY}`;
  const seasonEnd = `${nextDeadlineYear}-${TAX_FILING.DEADLINE_MONTH}-${TAX_FILING.DEADLINE_DAY}`;

  const seasonStartDate = parseDate(seasonStart);
  const seasonEndDate = parseDate(seasonEnd);

  // Filter out simulated trips and check only real trips
  const realTrips = trips.filter((trip) => !trip.isSimulated);

  // Check if any trip overlaps with tax season
  return realTrips.some((trip) => {
    const departureDate = parseDate(trip.departureDate);
    const returnDate = parseDate(trip.returnDate);

    // Trip overlaps if:
    // 1. Starts before season end AND ends after season start
    // 2. Encompasses the entire season
    // 3. Starts during season
    // 4. Ends during season
    return (
      (isBefore(departureDate, seasonEndDate) ||
        departureDate.getTime() === seasonEndDate.getTime()) &&
      (isAfter(returnDate, seasonStartDate) || returnDate.getTime() === seasonStartDate.getTime())
    );
  });
}

/**
 * Get the tax season date range for the current year
 * Updated to start in late January when IRS begins accepting returns
 */
export function getTaxSeasonDateRange(currentDate: string = new Date().toISOString()): {
  start: string;
  end: string;
} {
  const current = parseDate(currentDate);
  const currentYear = getYear(current);

  return {
    start: `${currentYear}-${TAX_FILING.SEASON_START_MONTH}-${TAX_FILING.SEASON_START_DAY}`,
    end: `${currentYear}-${TAX_FILING.DEADLINE_MONTH}-${TAX_FILING.DEADLINE_DAY}`,
  };
}

/**
 * Get information about available extensions
 */
export function getExtensionInfo(isAbroad: boolean): {
  automaticExtension: boolean;
  extensionDeadline: string | null;
  requiresForm: boolean;
  formNumber: string | null;
} {
  if (isAbroad) {
    return {
      automaticExtension: true,
      extensionDeadline: TAX_EXTENSION_DEADLINE_DISPLAY.JUNE,
      requiresForm: false,
      formNumber: null,
    };
  }

  return {
    automaticExtension: false,
    extensionDeadline: TAX_EXTENSION_DEADLINE_DISPLAY.OCTOBER,
    requiresForm: true,
    formNumber: GOVERNMENT_FORM_NAMES.TAX_EXTENSION,
  };
}
