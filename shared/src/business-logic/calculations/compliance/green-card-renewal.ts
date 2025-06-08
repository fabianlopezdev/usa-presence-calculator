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
import { differenceInMonths, isAfter, parseISO, subMonths } from 'date-fns';

// Internal dependencies - Schemas & Types
import { GreenCardRenewalStatus } from '@schemas/compliance';

// Internal dependencies - Constants
import { DOCUMENT_RENEWAL } from '@constants/uscis-rules';

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
  const current = parseISO(currentDate);
  const expiration = parseISO(expirationDate);

  // Calculate renewal window start (6 months before expiration)
  const renewalWindowStart = getRenewalWindowStartDate(expirationDate);

  // Calculate months until expiration
  const monthsUntilExpiration = getMonthsUntilExpiration(expirationDate, currentDate);

  // Determine if in renewal window
  const isInWindow = isInRenewalWindow(expirationDate, currentDate);

  // Determine current status
  let currentStatus: GreenCardRenewalStatus['currentStatus'];

  if (isAfter(current, expiration)) {
    currentStatus = 'expired';
  } else if (monthsUntilExpiration <= 0) {
    currentStatus = 'renewal_urgent';
  } else if (monthsUntilExpiration < 2) {
    currentStatus = 'renewal_urgent';
  } else if (isInWindow) {
    currentStatus = 'renewal_recommended';
  } else {
    currentStatus = 'valid';
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
  const current = parseISO(currentDate);
  const expiration = parseISO(expirationDate);

  return differenceInMonths(expiration, current);
}

/**
 * Check if currently in the renewal window (6 months before expiration)
 */
export function isInRenewalWindow(
  expirationDate: string,
  currentDate: string = new Date().toISOString(),
): boolean {
  const current = parseISO(currentDate);
  const renewalStart = parseISO(getRenewalWindowStartDate(expirationDate));

  return isAfter(current, renewalStart) || current.getTime() === renewalStart.getTime();
}

/**
 * Get the renewal urgency level
 */
export function getRenewalUrgency(
  expirationDate: string,
  currentDate: string = new Date().toISOString(),
): 'none' | 'low' | 'medium' | 'high' | 'critical' {
  const monthsRemaining = getMonthsUntilExpiration(expirationDate, currentDate);

  if (monthsRemaining < 0) {
    return 'critical'; // Already expired
  } else if (monthsRemaining < 2) {
    return 'high';
  } else if (monthsRemaining < 4) {
    return 'medium';
  } else if (monthsRemaining <= 6) {
    return 'low';
  } else {
    return 'none';
  }
}

/**
 * Calculate the date when renewal window opens (6 months before expiration)
 */
export function getRenewalWindowStartDate(expirationDate: string): string {
  const expiration = parseISO(expirationDate);
  const windowStart = subMonths(expiration, DOCUMENT_RENEWAL.RENEWAL_WINDOW_MONTHS);

  return windowStart.toISOString().split('T')[0];
}
