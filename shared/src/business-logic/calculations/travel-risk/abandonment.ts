// External imports (alphabetical)
import { differenceInDays, parseISO } from 'date-fns';

// Internal imports - schemas/types first (alphabetical)
import { GreenCardRiskResult, PermitProtectedThresholds } from '@schemas/lpr-status';

// Internal imports - other (alphabetical)
import { LPR_ABANDONMENT_THRESHOLDS, REENTRY_PERMIT_RULES } from '@constants/index';

/**
 * Calculate risk of green card abandonment based on trip duration
 * Considers reentry permit protection if applicable
 */
export function calculateGreenCardAbandonmentRisk(
  daysAbroad: number,
  hasReentryPermit = false,
): GreenCardRiskResult {
  if (hasReentryPermit) {
    return calculateWithPermitProtection(daysAbroad);
  }

  return calculateStandardRisk(daysAbroad);
}

function calculateWithPermitProtection(daysAbroad: number): GreenCardRiskResult {
  if (daysAbroad > REENTRY_PERMIT_RULES.MAXIMUM_PROTECTION_DAYS) {
    return {
      riskLevel: 'automatic_loss',
      daysUntilNextThreshold: 0,
      message: 'Exceeded 2-year reentry permit protection period.',
    };
  }

  if (daysAbroad >= REENTRY_PERMIT_RULES.APPROACHING_LIMIT_DAYS) {
    return {
      riskLevel: 'approaching_permit_limit',
      daysUntilNextThreshold: REENTRY_PERMIT_RULES.MAXIMUM_PROTECTION_DAYS - daysAbroad,
      message: 'Approaching 2-year reentry permit limit. Plan return soon.',
    };
  }

  return {
    riskLevel: 'protected_by_permit',
    daysUntilNextThreshold: REENTRY_PERMIT_RULES.MAXIMUM_PROTECTION_DAYS - daysAbroad,
    message: 'Protected by reentry permit. Valid for up to 2 years.',
  };
}

function calculateStandardRisk(daysAbroad: number): GreenCardRiskResult {
  if (daysAbroad >= LPR_ABANDONMENT_THRESHOLDS.AUTOMATIC_LOSS) {
    return {
      riskLevel: 'automatic_loss',
      daysUntilNextThreshold: 0,
      message: 'Risk of automatic loss of permanent resident status.',
    };
  }

  if (daysAbroad >= LPR_ABANDONMENT_THRESHOLDS.HIGH_RISK) {
    return {
      riskLevel: 'high_risk',
      daysUntilNextThreshold: LPR_ABANDONMENT_THRESHOLDS.AUTOMATIC_LOSS - daysAbroad,
      message: 'Your green card is at serious risk. Return immediately.',
    };
  }

  if (daysAbroad >= LPR_ABANDONMENT_THRESHOLDS.PRESUMPTION_OF_ABANDONMENT) {
    return {
      riskLevel: 'presumption_of_abandonment',
      daysUntilNextThreshold: LPR_ABANDONMENT_THRESHOLDS.HIGH_RISK - daysAbroad,
      message: 'Creates rebuttable presumption of abandoning permanent residence.',
    };
  }

  if (daysAbroad >= LPR_ABANDONMENT_THRESHOLDS.WARNING) {
    return {
      riskLevel: 'warning',
      daysUntilNextThreshold: LPR_ABANDONMENT_THRESHOLDS.PRESUMPTION_OF_ABANDONMENT - daysAbroad,
      message: 'Extended absence detected. Maintain strong ties to the U.S.',
    };
  }

  return {
    riskLevel: 'none',
    daysUntilNextThreshold: LPR_ABANDONMENT_THRESHOLDS.WARNING - daysAbroad,
    message: 'No risk to permanent resident status',
  };
}

/**
 * Get applicable thresholds based on reentry permit status
 * Returns modified thresholds for users with valid reentry permits
 */
export function getReentryPermitProtectedThresholds(permitInfo?: {
  hasPermit: boolean;
  permitExpiryDate?: string;
}): PermitProtectedThresholds {
  // Default thresholds without permit
  if (!permitInfo?.hasPermit) {
    return {
      warningThreshold: LPR_ABANDONMENT_THRESHOLDS.WARNING,
      presumptionThreshold: LPR_ABANDONMENT_THRESHOLDS.PRESUMPTION_OF_ABANDONMENT,
      highRiskThreshold: LPR_ABANDONMENT_THRESHOLDS.HIGH_RISK,
      criticalThreshold: LPR_ABANDONMENT_THRESHOLDS.AUTOMATIC_LOSS,
    };
  }

  // Check if permit is expiring soon
  let warningMessage: string | undefined;
  if (permitInfo.permitExpiryDate) {
    const today = new Date();
    const expiryDate = parseISO(permitInfo.permitExpiryDate);
    const daysUntilExpiry = differenceInDays(expiryDate, today);

    if (daysUntilExpiry <= REENTRY_PERMIT_RULES.WARNING_BEFORE_EXPIRY_DAYS) {
      warningMessage = `Reentry permit expires in ${daysUntilExpiry} days. Return before expiry to maintain protection.`;
    }
  }

  // Extended thresholds with valid permit
  return {
    warningThreshold: REENTRY_PERMIT_RULES.APPROACHING_LIMIT_DAYS,
    presumptionThreshold: null, // No presumption with valid permit
    highRiskThreshold: REENTRY_PERMIT_RULES.MAXIMUM_PROTECTION_DAYS - 60,
    criticalThreshold: REENTRY_PERMIT_RULES.MAXIMUM_PROTECTION_DAYS,
    warningMessage,
  };
}

/**
 * Check if trip is approaching continuous residence risk (150-179 days)
 */
export function checkIfTripApproachesContinuousResidenceRisk(daysAbroad: number): boolean {
  return daysAbroad >= 150 && daysAbroad < 180;
}

/**
 * Check if trip breaks continuous residence (180+ days)
 */
export function checkIfTripBreaksContinuousResidence(daysAbroad: number): boolean {
  return daysAbroad >= 180;
}

/**
 * Check if trip is approaching green card loss risk (330-364 days)
 */
export function checkIfTripApproachesGreenCardLoss(daysAbroad: number): boolean {
  return (
    daysAbroad >= LPR_ABANDONMENT_THRESHOLDS.HIGH_RISK &&
    daysAbroad < LPR_ABANDONMENT_THRESHOLDS.AUTOMATIC_LOSS
  );
}

/**
 * Check if trip risks automatic green card loss (365+ days without permit)
 */
export function checkIfTripRisksAutomaticGreenCardLoss(
  daysAbroad: number,
  hasReentryPermit = false,
): boolean {
  if (hasReentryPermit) {
    return daysAbroad > REENTRY_PERMIT_RULES.MAXIMUM_PROTECTION_DAYS;
  }
  return daysAbroad >= LPR_ABANDONMENT_THRESHOLDS.AUTOMATIC_LOSS;
}
