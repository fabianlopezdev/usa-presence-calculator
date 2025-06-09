/**
 * Removal of Conditions (Form I-751) Calculator
 *
 * Calculates filing windows and tracks status for conditional permanent residents
 * who must file Form I-751 to remove conditions on their green card
 */

// External dependencies
import { addYears, addDays, differenceInDays, isAfter, isBefore } from 'date-fns';

// Internal dependencies - Schemas & Types
import { RemovalOfConditionsStatus } from '@schemas/compliance';

// Internal dependencies - Constants
import { REMOVAL_OF_CONDITIONS } from '@constants/uscis-rules';
import { REMOVAL_CONDITIONS_STATUS } from '@constants/compliance';
import { ISO_DATE_UTILS } from '@constants/date-time';

// Internal dependencies - Utilities
import { parseDate } from '@utils/date-helpers';

/**
 * Determine the current status based on dates and filing status
 */
function determineCurrentStatus(
  current: Date,
  windowStartDate: Date,
  windowEndDate: Date,
  filingStatus?: 'filed' | 'approved',
): RemovalOfConditionsStatus['currentStatus'] {
  if (filingStatus === REMOVAL_CONDITIONS_STATUS.FILED) {
    return REMOVAL_CONDITIONS_STATUS.FILED;
  }
  if (filingStatus === REMOVAL_CONDITIONS_STATUS.APPROVED) {
    return REMOVAL_CONDITIONS_STATUS.APPROVED;
  }
  if (isAfter(current, windowEndDate)) {
    return REMOVAL_CONDITIONS_STATUS.OVERDUE;
  }
  if (isAfter(current, windowStartDate) || current.getTime() === windowStartDate.getTime()) {
    return REMOVAL_CONDITIONS_STATUS.IN_WINDOW;
  }
  return REMOVAL_CONDITIONS_STATUS.NOT_YET;
}

/**
 * Calculate the removal of conditions status for a conditional resident
 */
export function calculateRemovalOfConditionsStatus(
  isConditionalResident: boolean,
  greenCardDate: string,
  currentDate: string = new Date().toISOString(),
  filingStatus?: 'filed' | 'approved',
): RemovalOfConditionsStatus | null {
  // Return null if not a conditional resident
  if (!isConditionalResident) {
    return null;
  }

  const current = parseDate(currentDate);
  const { windowStart, windowEnd } = getFilingWindowDates(greenCardDate);
  const windowStartDate = parseDate(windowStart);
  const windowEndDate = parseDate(windowEnd);

  // Determine current status
  const currentStatus = determineCurrentStatus(
    current,
    windowStartDate,
    windowEndDate,
    filingStatus,
  );

  // Calculate days until window and deadline
  const daysUntilWindow = isBefore(current, windowStartDate)
    ? differenceInDays(windowStartDate, current)
    : 0;

  const daysUntilDeadline =
    isBefore(current, windowEndDate) || current.getTime() === windowEndDate.getTime()
      ? differenceInDays(windowEndDate, current)
      : null;

  return {
    applies: true,
    greenCardDate,
    filingWindowStart: windowStart,
    filingWindowEnd: windowEnd,
    currentStatus,
    daysUntilWindow:
      currentStatus === REMOVAL_CONDITIONS_STATUS.IN_WINDOW ||
      currentStatus === REMOVAL_CONDITIONS_STATUS.OVERDUE
        ? null
        : daysUntilWindow,
    daysUntilDeadline: daysUntilDeadline === 0 ? 0 : daysUntilDeadline,
  };
}

/**
 * Get the number of days until the filing window opens
 */
export function getDaysUntilFilingWindow(
  greenCardDate: string,
  currentDate: string = new Date().toISOString(),
): number {
  const current = parseDate(currentDate);
  const { windowStart } = getFilingWindowDates(greenCardDate);
  const windowStartDate = parseDate(windowStart);

  if (isAfter(current, windowStartDate) || current.getTime() === windowStartDate.getTime()) {
    return 0;
  }

  return differenceInDays(windowStartDate, current);
}

/**
 * Check if currently in the 90-day filing window
 */
export function isInFilingWindow(
  greenCardDate: string,
  currentDate: string = new Date().toISOString(),
): boolean {
  const current = parseDate(currentDate);
  const { windowStart, windowEnd } = getFilingWindowDates(greenCardDate);
  const windowStartDate = parseDate(windowStart);
  const windowEndDate = parseDate(windowEnd);

  return (
    (isAfter(current, windowStartDate) || current.getTime() === windowStartDate.getTime()) &&
    (isBefore(current, windowEndDate) || current.getTime() === windowEndDate.getTime())
  );
}

/**
 * Calculate the filing window start and end dates
 */
export function getFilingWindowDates(greenCardDate: string): {
  windowStart: string;
  windowEnd: string;
} {
  const gcDate = parseDate(greenCardDate);

  // Calculate 2-year anniversary (end of filing window)
  const windowEnd = addYears(gcDate, REMOVAL_OF_CONDITIONS.CONDITIONAL_PERIOD_YEARS);

  // Calculate 90 days before anniversary (start of filing window)
  const windowStart = addDays(windowEnd, -REMOVAL_OF_CONDITIONS.FILING_WINDOW_DAYS);

  return {
    windowStart: windowStart.toISOString().split(ISO_DATE_UTILS.TIME_SEPARATOR)[0],
    windowEnd: windowEnd.toISOString().split(ISO_DATE_UTILS.TIME_SEPARATOR)[0],
  };
}

/**
 * Get the deadline for filing Form I-751 (2-year anniversary)
 */
export function getRemovalOfConditionsDeadline(greenCardDate: string): string {
  const gcDate = parseDate(greenCardDate);
  const deadline = addYears(gcDate, REMOVAL_OF_CONDITIONS.CONDITIONAL_PERIOD_YEARS);
  return deadline.toISOString().split(ISO_DATE_UTILS.TIME_SEPARATOR)[0];
}
