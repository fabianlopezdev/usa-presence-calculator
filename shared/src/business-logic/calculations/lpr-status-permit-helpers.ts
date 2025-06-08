import { differenceInDays } from 'date-fns';

import { ReentryPermit, ReentryPermitProtection } from '@schemas/lpr-status';

import { REENTRY_PERMIT_RULES } from '@constants/uscis-rules';
import { parseUTCDate } from '@utils/utc-date-helpers';

/**
 * Determine if a reentry permit provides protection for a given trip duration
 */
export function determineIfReentryPermitProvidesProtection(
  tripDurationDays: number,
  permitStatus: {
    hasPermit: boolean;
    permitExpiryDate?: string;
  },
): ReentryPermitProtection {
  const result: ReentryPermitProtection = {
    providesProtection: false,
    daysProtected: 0,
    daysUntilExpiry: 0,
    warnings: [],
  };

  if (!permitStatus.hasPermit) {
    result.warnings.push('No reentry permit on file');
    return result;
  }

  // Calculate days until expiry if date provided
  calculateDaysUntilExpiry(result, permitStatus.permitExpiryDate);

  // Check if permit was expired
  if (result.daysUntilExpiry < 0 && permitStatus.permitExpiryDate) {
    return result; // warnings already added by calculateDaysUntilExpiry
  }

  result.daysProtected = REENTRY_PERMIT_RULES.MAXIMUM_PROTECTION_DAYS;

  if (tripDurationDays <= REENTRY_PERMIT_RULES.MAXIMUM_PROTECTION_DAYS) {
    result.providesProtection = true;
  } else {
    result.warnings.push('Trip duration exceeds maximum 2-year reentry permit protection');
  }

  return result;
}

function calculateDaysUntilExpiry(
  result: ReentryPermitProtection,
  permitExpiryDate?: string,
): void {
  if (permitExpiryDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for consistent comparison
    const expiryDate = new Date(permitExpiryDate);
    expiryDate.setHours(0, 0, 0, 0); // Set to start of day for consistent comparison
    result.daysUntilExpiry = Math.round(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (result.daysUntilExpiry < 0) {
      result.warnings.push('Reentry permit has expired. It no longer provides protection.');
    } else if (result.daysUntilExpiry <= REENTRY_PERMIT_RULES.WARNING_BEFORE_EXPIRY_DAYS) {
      result.warnings.push(
        `Reentry permit expires in ${result.daysUntilExpiry} days. Plan your return accordingly.`,
      );
    }
  } else {
    // If no expiry date is provided, daysUntilExpiry remains 0
    result.daysUntilExpiry = 0;
  }
}

/**
 * Determine if reentry permit provides protection (enhanced version)
 */
export function determineIfReentryPermitProvidesProtectionAdvanced(
  tripDurationDays: number,
  reentryPermit: ReentryPermit,
  currentDate: string,
): ReentryPermitProtection {
  const result = initializeReentryPermitProtection();

  if (reentryPermit.status === 'none') {
    result.warnings.push('No reentry permit on file');
    return result;
  }

  if (reentryPermit.status === 'pending') {
    return handlePendingPermit(result);
  }

  if (reentryPermit.status === 'expired') {
    return handleExpiredPermit(result);
  }

  if (reentryPermit.status === 'approved' && reentryPermit.expirationDate) {
    return handleApprovedPermit(
      tripDurationDays,
      reentryPermit.expirationDate,
      currentDate,
      result,
    );
  }

  return result;
}

function initializeReentryPermitProtection(): ReentryPermitProtection {
  return {
    providesProtection: false,
    daysProtected: 0,
    daysUntilExpiry: 0,
    warnings: [],
  };
}

function handlePendingPermit(result: ReentryPermitProtection): ReentryPermitProtection {
  result.warnings.push(
    'Reentry permit is pending approval',
    'Protection not guaranteed until approved',
  );
  return result;
}

function handleExpiredPermit(result: ReentryPermitProtection): ReentryPermitProtection {
  result.warnings.push('Reentry permit has expired. It no longer provides protection.');
  return result;
}

function handleApprovedPermit(
  tripDurationDays: number,
  expirationDate: string,
  currentDate: string,
  result: ReentryPermitProtection,
): ReentryPermitProtection {
  const today = parseUTCDate(currentDate);
  const expiryDate = parseUTCDate(expirationDate);
  result.daysUntilExpiry = differenceInDays(expiryDate, today);

  if (result.daysUntilExpiry < 0) {
    result.warnings.push('Reentry permit has expired. It no longer provides protection.');
    return result;
  }

  if (result.daysUntilExpiry <= REENTRY_PERMIT_RULES.WARNING_BEFORE_EXPIRY_DAYS) {
    result.warnings.push(
      `Reentry permit expires in ${result.daysUntilExpiry} days. Plan your return accordingly.`,
    );
  }

  // If permit is valid, it can protect up to the maximum days or until expiry
  if (result.daysUntilExpiry > 0) {
    result.daysProtected = Math.min(
      REENTRY_PERMIT_RULES.MAXIMUM_PROTECTION_DAYS,
      result.daysUntilExpiry,
    );

    // Permit provides protection for trips up to 730 days (2 years) or until expiry
    if (
      tripDurationDays <= REENTRY_PERMIT_RULES.MAXIMUM_PROTECTION_DAYS &&
      result.daysUntilExpiry > 0
    ) {
      result.providesProtection = true;
    } else if (tripDurationDays > REENTRY_PERMIT_RULES.MAXIMUM_PROTECTION_DAYS) {
      result.warnings.push(
        `Trip duration (${tripDurationDays} days) exceeds maximum 2-year reentry permit protection`,
      );
    }
  }

  return result;
}
