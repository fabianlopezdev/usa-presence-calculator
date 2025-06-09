/**
 * Green Card Renewal Tracker
 *
 * Tracks green card expiration dates and provides renewal recommendations
 * to ensure users maintain valid documentation
 *
 * IMPORTANT: This module is for 10-year permanent resident cards only.
 * Conditional residents (2-year cards) must use the removal of conditions
 * module, as they cannot renew their cards - they must file Form I-751
 * during the 90-day window before expiration.
 */

// External dependencies
import { differenceInMonths, isAfter, subMonths } from 'date-fns';

// Internal dependencies - Schemas & Types
import { GreenCardRenewalStatus } from '@schemas/compliance';

// Internal dependencies - Constants
import { DOCUMENT_RENEWAL } from '@constants/uscis-rules';
import { GREEN_CARD_RENEWAL_STATUS } from '@constants/compliance';
import {
  PRIORITY_LEVEL,
  GREEN_CARD_RENEWAL_THRESHOLDS_MONTHS,
  PriorityLevel,
} from '@constants/priority-urgency';
import { ISO_DATE_UTILS } from '@constants/date-time';

// Internal dependencies - Utilities
import { parseDate } from '@utils/date-helpers';

/**
 * Calculate the green card renewal status
 *
 * @param expirationDate - The expiration date of the 10-year green card
 * @param currentDate - The current date to check against
 * @returns Green card renewal status
 *
 * NOTE: This function is ONLY for 10-year permanent resident cards.
 * For 2-year conditional resident cards, use the removal of conditions module.
 */
export function calculateGreenCardRenewalStatus(
  expirationDate: string,
  currentDate: string = new Date().toISOString(),
): GreenCardRenewalStatus {
  const current = parseDate(currentDate);
  const expiration = parseDate(expirationDate);

  // Calculate renewal window start (6 months before expiration)
  const renewalWindowStart = getRenewalWindowStartDate(expirationDate);

  // Calculate months until expiration
  const monthsUntilExpiration = getMonthsUntilExpiration(expirationDate, currentDate);

  // Determine if in renewal window
  const isInWindow = isInRenewalWindow(expirationDate, currentDate);

  // Determine current status
  let currentStatus: GreenCardRenewalStatus['currentStatus'];

  if (isAfter(current, expiration)) {
    currentStatus = GREEN_CARD_RENEWAL_STATUS.EXPIRED;
  } else if (monthsUntilExpiration <= 0) {
    currentStatus = GREEN_CARD_RENEWAL_STATUS.RENEWAL_URGENT;
  } else if (monthsUntilExpiration < GREEN_CARD_RENEWAL_THRESHOLDS_MONTHS.URGENT_THRESHOLD) {
    currentStatus = GREEN_CARD_RENEWAL_STATUS.RENEWAL_URGENT;
  } else if (isInWindow) {
    currentStatus = GREEN_CARD_RENEWAL_STATUS.RENEWAL_RECOMMENDED;
  } else {
    currentStatus = GREEN_CARD_RENEWAL_STATUS.VALID;
  }

  return {
    expirationDate,
    renewalWindowStart,
    currentStatus,
    monthsUntilExpiration,
    isInRenewalWindow: isInWindow,
  };
}

/**
 * Calculate months until expiration
 */
export function getMonthsUntilExpiration(
  expirationDate: string,
  currentDate: string = new Date().toISOString(),
): number {
  const current = parseDate(currentDate);
  const expiration = parseDate(expirationDate);

  return differenceInMonths(expiration, current);
}

/**
 * Check if currently in the renewal window (6 months before expiration)
 */
export function isInRenewalWindow(
  expirationDate: string,
  currentDate: string = new Date().toISOString(),
): boolean {
  const current = parseDate(currentDate);
  const renewalStart = parseDate(getRenewalWindowStartDate(expirationDate));

  return isAfter(current, renewalStart) || current.getTime() === renewalStart.getTime();
}

/**
 * Get the renewal urgency level
 */
export function getRenewalUrgency(
  expirationDate: string,
  currentDate: string = new Date().toISOString(),
): PriorityLevel {
  const monthsRemaining = getMonthsUntilExpiration(expirationDate, currentDate);

  if (monthsRemaining < 0) {
    return PRIORITY_LEVEL.CRITICAL; // Already expired
  } else if (monthsRemaining < GREEN_CARD_RENEWAL_THRESHOLDS_MONTHS.URGENT_THRESHOLD) {
    return PRIORITY_LEVEL.HIGH;
  } else if (monthsRemaining < GREEN_CARD_RENEWAL_THRESHOLDS_MONTHS.MEDIUM_THRESHOLD) {
    return PRIORITY_LEVEL.MEDIUM;
  } else if (monthsRemaining <= GREEN_CARD_RENEWAL_THRESHOLDS_MONTHS.LOW_THRESHOLD) {
    return PRIORITY_LEVEL.LOW;
  } else {
    return PRIORITY_LEVEL.NONE;
  }
}

/**
 * Calculate the date when renewal window opens (6 months before expiration)
 */
export function getRenewalWindowStartDate(expirationDate: string): string {
  const expiration = parseDate(expirationDate);
  const windowStart = subMonths(expiration, DOCUMENT_RENEWAL.RENEWAL_WINDOW_MONTHS);

  return windowStart.toISOString().split(ISO_DATE_UTILS.TIME_SEPARATOR)[0];
}
