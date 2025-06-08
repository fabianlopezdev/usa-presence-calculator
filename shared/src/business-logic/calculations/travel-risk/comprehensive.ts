// External imports (alphabetical)
import { differenceInDays } from 'date-fns';

// Internal imports - schemas/types first (alphabetical)
import {
  ComprehensiveRiskAssessment,
  ReentryPermitInfo,
  TravelRiskDetails,
} from '@schemas/lpr-status';
import { Trip } from '@schemas/trip';

// Internal imports - other (alphabetical)
import {
  CONTINUOUS_RESIDENCE_THRESHOLDS,
  LPR_ABANDONMENT_THRESHOLDS,
  REENTRY_PERMIT_RULES,
} from '@constants/index';
import { parseUTCDate } from '@utils/utc-date-helpers';

/**
 * Enhanced assessment for all legal thresholds
 * Evaluates impact on physical presence, continuous residence, and LPR status
 */
export function assessTripRiskForAllLegalThresholds(
  trip: Trip,
  reentryPermitInfo?: ReentryPermitInfo,
): ComprehensiveRiskAssessment {
  const departureDate = parseUTCDate(trip.departureDate);
  const returnDate = parseUTCDate(trip.returnDate);
  // USCIS rule: departure and return days count as days IN the USA
  const daysAbroad = Math.max(0, differenceInDays(returnDate, departureDate) - 1);

  const hasPermit = reentryPermitInfo?.hasReentryPermit || false;

  // Calculate impact on different aspects
  const assessmentResult = createBaseAssessment(daysAbroad, hasPermit);

  return assessmentResult;
}

function createBaseAssessment(daysAbroad: number, hasPermit: boolean): ComprehensiveRiskAssessment {
  const result: ComprehensiveRiskAssessment = {
    physicalPresenceImpact: assessPhysicalPresenceImpact(daysAbroad),
    continuousResidenceImpact: assessContinuousResidenceImpact(daysAbroad),
    lprStatusRisk: assessLprStatusRisk(daysAbroad, hasPermit),
    overallRiskLevel: 'none',
    continuousResidenceRisk: 'none',
    daysAbroad,
    recommendations: [],
    warnings: [],
    metadata: {
      daysAbroad,
      hasReentryPermit: hasPermit,
      assessmentDate: new Date().toISOString(),
    },
  };

  // Determine overall risk level
  result.overallRiskLevel = determineOverallRiskLevel(result);

  // Generate warnings and recommendations
  result.warnings = generateWarnings(result, daysAbroad, hasPermit);
  result.recommendations = generateRecommendations(result);

  return result;
}

function assessPhysicalPresenceImpact(
  daysAbroad: number,
): ComprehensiveRiskAssessment['physicalPresenceImpact'] {
  return {
    daysDeductedFromEligibility: daysAbroad,
    affectsNaturalizationTimeline: daysAbroad > 0,
    message:
      daysAbroad > 0
        ? `This trip deducts ${daysAbroad} days from your physical presence requirement`
        : 'No impact on physical presence',
  };
}

function assessContinuousResidenceImpact(
  daysAbroad: number,
): ComprehensiveRiskAssessment['continuousResidenceImpact'] {
  if (daysAbroad >= CONTINUOUS_RESIDENCE_THRESHOLDS.RESETS_CLOCK) {
    return {
      breaksRequirement: true,
      resetsEligibilityClock: true,
      daysUntilBreak: 0,
      message: 'Trip breaks continuous residence. 3/5 year eligibility clock resets.',
    };
  }

  if (daysAbroad >= CONTINUOUS_RESIDENCE_THRESHOLDS.MEDIUM_RISK) {
    return {
      breaksRequirement: false,
      resetsEligibilityClock: false,
      daysUntilBreak: CONTINUOUS_RESIDENCE_THRESHOLDS.RESETS_CLOCK - daysAbroad,
      message: `Trip approaching continuous residence limit. ${CONTINUOUS_RESIDENCE_THRESHOLDS.RESETS_CLOCK - daysAbroad} days until break.`,
    };
  }

  return {
    breaksRequirement: false,
    resetsEligibilityClock: false,
    daysUntilBreak: CONTINUOUS_RESIDENCE_THRESHOLDS.RESETS_CLOCK - daysAbroad,
    message: 'No impact on continuous residence',
  };
}

function assessLprStatusRisk(
  daysAbroad: number,
  hasPermit: boolean,
): ComprehensiveRiskAssessment['lprStatusRisk'] {
  const riskLevel = determineGreenCardRiskLevel(daysAbroad, hasPermit);
  const daysUntilNextThreshold = calculateDaysUntilNextThreshold(daysAbroad, hasPermit);

  return {
    riskLevel,
    daysUntilNextThreshold,
    message: getRiskMessage(riskLevel, hasPermit),
  };
}

function determineGreenCardRiskLevel(
  daysAbroad: number,
  hasPermit: boolean,
): TravelRiskDetails['riskLevel'] {
  if (hasPermit) {
    if (daysAbroad >= REENTRY_PERMIT_RULES.APPROACHING_LIMIT_DAYS) {
      return 'approaching_permit_limit';
    }
    return 'protected_by_permit';
  }

  if (daysAbroad >= LPR_ABANDONMENT_THRESHOLDS.PRESUMPTION_OF_ABANDONMENT) {
    return 'presumption_of_abandonment';
  }
  if (daysAbroad >= LPR_ABANDONMENT_THRESHOLDS.HIGH_RISK) {
    return 'critical';
  }
  if (daysAbroad >= LPR_ABANDONMENT_THRESHOLDS.CRITICAL) {
    return 'severe';
  }
  if (daysAbroad >= LPR_ABANDONMENT_THRESHOLDS.SEVERE) {
    return 'high';
  }
  if (daysAbroad >= LPR_ABANDONMENT_THRESHOLDS.WARNING) {
    return 'warning';
  }
  if (daysAbroad >= CONTINUOUS_RESIDENCE_THRESHOLDS.MEDIUM_RISK) {
    return 'medium';
  }
  if (daysAbroad >= CONTINUOUS_RESIDENCE_THRESHOLDS.LOW_RISK) {
    return 'low';
  }
  return 'none';
}

function calculateDaysUntilNextThreshold(daysAbroad: number, hasPermit: boolean): number {
  if (hasPermit) {
    return Math.max(0, REENTRY_PERMIT_RULES.MAXIMUM_PROTECTION_DAYS - daysAbroad);
  }

  if (daysAbroad < LPR_ABANDONMENT_THRESHOLDS.WARNING) {
    return LPR_ABANDONMENT_THRESHOLDS.WARNING - daysAbroad;
  }
  if (daysAbroad < LPR_ABANDONMENT_THRESHOLDS.PRESUMPTION_OF_ABANDONMENT) {
    return LPR_ABANDONMENT_THRESHOLDS.PRESUMPTION_OF_ABANDONMENT - daysAbroad;
  }
  if (daysAbroad < LPR_ABANDONMENT_THRESHOLDS.HIGH_RISK) {
    return LPR_ABANDONMENT_THRESHOLDS.HIGH_RISK - daysAbroad;
  }
  return 0;
}

function getRiskMessage(riskLevel: TravelRiskDetails['riskLevel'], _hasPermit: boolean): string {
  const messages: Record<TravelRiskDetails['riskLevel'], string> = {
    none: 'No risk to LPR status',
    low: 'Low risk - maintain awareness',
    medium: 'Medium risk - plan return carefully',
    warning: 'Warning - approaching significant thresholds',
    high: 'High risk - immediate action recommended',
    severe: 'Severe risk - return urgently',
    critical: 'Critical risk - LPR status in jeopardy',
    presumption_of_abandonment: 'Presumption of abandonment - prepare strong evidence',
    protected_by_permit: 'Protected by reentry permit',
    approaching_permit_limit: 'Approaching reentry permit limit',
  };

  return messages[riskLevel];
}

function determineOverallRiskLevel(
  assessment: ComprehensiveRiskAssessment,
): TravelRiskDetails['riskLevel'] {
  const { continuousResidenceImpact, lprStatusRisk } = assessment;

  // If continuous residence is broken, that's at least severe
  if (continuousResidenceImpact.breaksRequirement) {
    if (lprStatusRisk.riskLevel === 'presumption_of_abandonment') {
      return 'presumption_of_abandonment';
    }
    return 'severe';
  }

  // Otherwise use the LPR status risk level
  return lprStatusRisk.riskLevel;
}

function generateWarnings(
  assessment: ComprehensiveRiskAssessment,
  daysAbroad: number,
  hasPermit: boolean,
): string[] {
  const warnings: string[] = [];

  if (assessment.continuousResidenceImpact.breaksRequirement) {
    warnings.push('This trip breaks continuous residence for naturalization');
  }

  if (daysAbroad >= LPR_ABANDONMENT_THRESHOLDS.WARNING && !hasPermit) {
    warnings.push('Extended absence may raise questions about permanent resident intent');
  }

  if (hasPermit && daysAbroad >= REENTRY_PERMIT_RULES.APPROACHING_LIMIT_DAYS) {
    warnings.push('Approaching maximum reentry permit protection period');
  }

  return warnings;
}

function generateRecommendations(assessment: ComprehensiveRiskAssessment): string[] {
  const recommendations: string[] = [];
  const { overallRiskLevel } = assessment;

  switch (overallRiskLevel) {
    case 'presumption_of_abandonment':
      recommendations.push(
        'Consult an immigration attorney immediately',
        'Prepare evidence of US ties',
        'Consider SB-1 visa if unable to return',
      );
      break;
    case 'critical':
    case 'severe':
      recommendations.push(
        'Return to US as soon as possible',
        'Apply for reentry permit for future trips',
        'Document all US ties',
      );
      break;
    case 'high':
    case 'warning':
      recommendations.push(
        'Limit future travel',
        'Consider reentry permit for extended trips',
        'Maintain strong US ties',
      );
      break;
  }

  return recommendations;
}
