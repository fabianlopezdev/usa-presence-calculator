/**
 * Tax Filing Reminder Calculator
 *
 * Provides tax filing reminders and travel-aware notifications
 * for LPRs who must file US taxes on worldwide income
 */

// External dependencies
import { parseISO, differenceInDays, isAfter, isBefore, getYear } from 'date-fns';

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
  const nextDeadline = getNextTaxDeadline(currentDate);
  const daysUntilDeadline = getDaysUntilTaxDeadline(currentDate);
  const isAbroadDuringTaxSeason = willBeAbroadDuringTaxSeason(trips, currentDate);

  return {
    nextDeadline,
    daysUntilDeadline,
    isAbroadDuringTaxSeason,
    reminderDismissed,
  };
}

/**
 * Get the next tax filing deadline
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
 * Calculate days until the next tax deadline
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
 * Check if currently in tax season (March 1 - April 15)
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
