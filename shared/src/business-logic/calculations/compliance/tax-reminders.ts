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
import { parseISO, differenceInDays, isAfter, isBefore, getYear, addDays, getDay } from 'date-fns';

// Internal dependencies - Schemas & Types
import { TaxReminderStatus } from '@schemas/compliance';
import { Trip } from '@schemas/trip';

// Internal dependencies - Constants
import { TAX_FILING } from '@constants/uscis-rules';

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
  const applicableDeadline = isAbroadDuringTaxSeason ? 'abroad_extension' : 'standard';

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
  deadlineType: 'standard' | 'abroad_extension' | 'october_extension' = 'standard',
): string {
  const current = parseISO(currentDate);
  const currentYear = getYear(current);

  // Get base deadline for current year
  let baseDeadline = getBaseDeadlineForYear(currentYear, deadlineType);

  // Check if we need to look at next year's deadline
  if (isAfter(current, adjustForWeekend(baseDeadline))) {
    baseDeadline = getBaseDeadlineForYear(currentYear + 1, deadlineType);
  }

  // Adjust for weekends
  const adjustedDeadline = adjustForWeekend(baseDeadline);
  return adjustedDeadline.toISOString().split('T')[0];
}

/**
 * Get base deadline for a specific year and type
 */
function getBaseDeadlineForYear(
  year: number,
  deadlineType: 'standard' | 'abroad_extension' | 'october_extension',
): Date {
  switch (deadlineType) {
    case 'abroad_extension':
      return parseISO(
        `${year}-${TAX_FILING.ABROAD_EXTENSION_MONTH}-${TAX_FILING.ABROAD_EXTENSION_DAY}`,
      );
    case 'october_extension':
      return parseISO(
        `${year}-${TAX_FILING.OCTOBER_EXTENSION_MONTH}-${TAX_FILING.OCTOBER_EXTENSION_DAY}`,
      );
    default:
      return parseISO(`${year}-${TAX_FILING.DEADLINE_MONTH}-${TAX_FILING.DEADLINE_DAY}`);
  }
}

/**
 * Adjust date to next business day if it falls on weekend or DC Emancipation Day
 * DC Emancipation Day (April 16) affects IRS deadlines nationwide
 */
function adjustForWeekend(date: Date): Date {
  let adjustedDate = date;
  const dayOfWeek = getDay(adjustedDate);

  // First, adjust for weekend
  if (dayOfWeek === 6) {
    // Saturday - move to Monday
    adjustedDate = addDays(adjustedDate, 2);
  } else if (dayOfWeek === 0) {
    // Sunday - move to Monday
    adjustedDate = addDays(adjustedDate, 1);
  }

  // Check if we need to account for DC Emancipation Day (April 16)
  // Only relevant for April tax deadlines
  if (adjustedDate.getMonth() === 3) {
    // April (0-indexed)
    const day = adjustedDate.getDate();
    const year = adjustedDate.getFullYear();

    // Check if adjusted date falls on April 16
    if (day === 16) {
      // Move to April 17
      adjustedDate = addDays(adjustedDate, 1);
    } else if (day === 15) {
      // Special case: If April 15 is Friday, check if we need to skip to April 18
      // because April 16 (Saturday) is Emancipation Day
      const dayOfWeek15 = getDay(adjustedDate);
      if (dayOfWeek15 === 5) {
        // Friday - skip weekend AND Emancipation Day
        adjustedDate = addDays(adjustedDate, 3); // Move to Monday April 18
      }
    } else if (day === 17) {
      // Special case: If we moved to April 17 (Monday),
      // check if Emancipation Day is being observed on this day
      const april16 = new Date(year, 3, 16);
      const april16DayOfWeek = getDay(april16);

      // If April 16 was Sunday, it's observed on Monday (April 17)
      if (april16DayOfWeek === 0) {
        // Move to Tuesday
        adjustedDate = addDays(adjustedDate, 1);
      }
    }
  }

  return adjustedDate;
}

/**
 * Get the next tax filing deadline (legacy - for backward compatibility)
 */
export function getNextTaxDeadline(currentDate: string = new Date().toISOString()): string {
  const current = parseISO(currentDate);
  const currentYear = getYear(current);

  // Tax deadline for current year
  const currentYearDeadline = parseISO(
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
  const current = parseISO(currentDate);
  const deadlineDate = parseISO(deadline);

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
  const current = parseISO(currentDate);
  const nextDeadline = parseISO(getNextTaxDeadline(currentDate));

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
  const current = parseISO(currentDate);
  const { start, end } = getTaxSeasonDateRange(currentDate);

  const seasonStart = parseISO(start);
  const seasonEnd = parseISO(end);

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
  const nextDeadlineYear = getYear(parseISO(nextDeadline));

  // Get the tax season dates for the year of the next deadline
  const seasonStart = `${nextDeadlineYear}-${TAX_FILING.SEASON_START_MONTH}-${TAX_FILING.SEASON_START_DAY}`;
  const seasonEnd = `${nextDeadlineYear}-${TAX_FILING.DEADLINE_MONTH}-${TAX_FILING.DEADLINE_DAY}`;

  const seasonStartDate = parseISO(seasonStart);
  const seasonEndDate = parseISO(seasonEnd);

  // Filter out simulated trips and check only real trips
  const realTrips = trips.filter((trip) => !trip.isSimulated);

  // Check if any trip overlaps with tax season
  return realTrips.some((trip) => {
    const departureDate = parseISO(trip.departureDate);
    const returnDate = parseISO(trip.returnDate);

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
  const current = parseISO(currentDate);
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
      extensionDeadline: 'June 15',
      requiresForm: false,
      formNumber: null,
    };
  }

  return {
    automaticExtension: false,
    extensionDeadline: 'October 15',
    requiresForm: true,
    formNumber: 'Form 4868',
  };
}
