// External dependencies (alphabetical)
import { differenceInDays } from 'date-fns';

// Internal dependencies - Schemas & Types (alphabetical)
import { ComprehensiveRiskAssessment, ReentryPermitInfo } from '@schemas/lpr-status';
import { Trip } from '@schemas/trip';

// Internal dependencies - Business Logic (alphabetical)
import { calculateGreenCardAbandonmentRisk } from '@business-logic/calculations/travel-risk-abandonment';

// Internal dependencies - Constants (alphabetical)
import {
  CONTINUOUS_RESIDENCE_THRESHOLDS,
  LPR_ABANDONMENT_THRESHOLDS,
  RISK_WARNING_THRESHOLDS,
} from '@constants/index';

// Internal dependencies - Utilities (alphabetical)
import { parseUTCDate } from '@utils/utc-date-helpers';

export function assessTripRiskForAllLegalThresholds(
  trip: Trip,
  reentryPermitInfo?: ReentryPermitInfo,
): ComprehensiveRiskAssessment {
  const departureDate = parseUTCDate(trip.departureDate);
  const returnDate = parseUTCDate(trip.returnDate);
  // USCIS rule: departure and return days count as days IN the USA
  const daysAbroad = Math.max(0, differenceInDays(returnDate, departureDate) - 1);

  const result = initializeAssessmentResult(daysAbroad);

  assessContinuousResidenceRisk(result, daysAbroad);
  assessLPRStatusRisk(result, daysAbroad, reentryPermitInfo);

  return result;
}

function initializeAssessmentResult(daysAbroad: number): ComprehensiveRiskAssessment {
  return {
    physicalPresenceImpact: {
      daysDeductedFromEligibility: daysAbroad,
      affectsNaturalizationTimeline: daysAbroad > 0,
      message:
        daysAbroad > 0
          ? `This trip deducts ${daysAbroad} days from your physical presence requirement`
          : 'No impact on physical presence',
    },
    continuousResidenceImpact: {
      breaksRequirement: false,
      resetsEligibilityClock: false,
      daysUntilBreak: CONTINUOUS_RESIDENCE_THRESHOLDS.RESETS_CLOCK - daysAbroad,
      message: 'No impact on continuous residence',
    },
    lprStatusRisk: {
      riskLevel: 'none',
      daysUntilNextThreshold: LPR_ABANDONMENT_THRESHOLDS.WARNING - daysAbroad,
      message: 'No risk to LPR status',
    },
    overallRiskLevel: 'none',
    continuousResidenceRisk: 'none',
    daysAbroad,
    warnings: [],
    recommendations: [],
    metadata: {
      daysAbroad,
      hasReentryPermit: false,
      assessmentDate: new Date().toISOString(),
    },
  };
}

function assessContinuousResidenceRisk(
  result: ComprehensiveRiskAssessment,
  daysAbroad: number,
): void {
  if (daysAbroad >= RISK_WARNING_THRESHOLDS.CONTINUOUS_RESIDENCE.BROKEN) {
    result.continuousResidenceRisk = 'broken';
    result.warnings.push('Continuous residence has been definitively broken.');
    result.recommendations.push('Your naturalization timeline has been reset');
  } else if (daysAbroad >= RISK_WARNING_THRESHOLDS.CONTINUOUS_RESIDENCE.AT_RISK) {
    result.continuousResidenceRisk = 'at_risk';
    result.warnings.push('This trip may reset your citizenship eligibility timeline.');
    result.recommendations.push('Return immediately to minimize impact on continuous residence');
  } else if (daysAbroad >= RISK_WARNING_THRESHOLDS.CONTINUOUS_RESIDENCE.APPROACHING) {
    result.continuousResidenceRisk = 'approaching';
    result.warnings.push(
      'Your trip is approaching 180 days. Plan your return to protect your continuous residence.',
    );
    result.recommendations.push(
      'Consider returning before 180 days to avoid presumption of breaking continuous residence',
    );
  }
}

function assessLPRStatusRisk(
  result: ComprehensiveRiskAssessment,
  daysAbroad: number,
  reentryPermitInfo?: ReentryPermitInfo,
): void {
  const greenCardRisk = calculateGreenCardAbandonmentRisk(
    daysAbroad,
    reentryPermitInfo?.hasReentryPermit,
  );
  result.lprStatusRisk = {
    riskLevel: greenCardRisk.riskLevel as ComprehensiveRiskAssessment['lprStatusRisk']['riskLevel'],
    daysUntilNextThreshold: greenCardRisk.daysUntilNextThreshold,
    message: greenCardRisk.message,
  };
  handleLPRRiskLevel(result, greenCardRisk.riskLevel);
}

function handleLPRRiskLevel(result: ComprehensiveRiskAssessment, riskLevel: string): void {
  switch (riskLevel) {
    case 'automatic_loss':
      handleAutomaticLoss(result);
      break;
    case 'high_risk':
      handleHighRisk(result);
      break;
    case 'presumption_of_abandonment':
      handlePresumptionOfAbandonment(result);
      break;
    case 'warning':
      handleWarning(result);
      break;
    case 'protected_by_permit':
      handleProtectedByPermit(result);
      break;
    case 'approaching_permit_limit':
      handleApproachingPermitLimit(result);
      break;
  }
}

function handleAutomaticLoss(result: ComprehensiveRiskAssessment): void {
  result.warnings.push(
    'Urgent: This extended absence may result in loss of your permanent resident status.',
  );
  result.recommendations.push(
    'Seek immediate legal representation',
    'You may need to apply for a returning resident visa (SB-1)',
  );
}

function handleHighRisk(result: ComprehensiveRiskAssessment): void {
  result.warnings.push('Your trip is approaching one year. Your green card may be at risk.');
  if (result.continuousResidenceRisk === 'at_risk') {
    result.warnings.push('Continuous residence presumption already broken.');
  }
  result.recommendations.push(
    'Return IMMEDIATELY - approaching automatic loss of LPR status',
    'Do NOT exceed 365 days under any circumstances',
    'Seek immediate legal counsel',
  );
}

function handlePresumptionOfAbandonment(result: ComprehensiveRiskAssessment): void {
  result.warnings.push('Creates rebuttable presumption of abandoning permanent residence.');
  result.recommendations.push(
    'Prepare evidence to overcome presumption of abandonment',
    'Consult with an immigration attorney',
  );
}

function handleWarning(result: ComprehensiveRiskAssessment): void {
  result.warnings.push('Extended absence detected. Maintain strong ties to the U.S.');
  result.recommendations.push('Keep evidence of U.S. ties (employment, home, family)');
}

function handleProtectedByPermit(result: ComprehensiveRiskAssessment): void {
  result.warnings.push('Your reentry permit protects your LPR status for this trip.');
  result.recommendations.push(
    'Reentry permit protects green card but not continuous residence for naturalization',
    'Consider shorter trips if maintaining citizenship timeline is important',
  );
}

function handleApproachingPermitLimit(result: ComprehensiveRiskAssessment): void {
  result.warnings.push('Approaching maximum 2-year reentry permit protection');
  result.recommendations.push(
    'Plan your return to the U.S. soon',
    'Do not exceed 730 days abroad even with permit',
  );
}
