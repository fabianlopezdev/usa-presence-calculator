import { TravelRiskDetails } from '@schemas/lpr-status';

import {
  CONTINUOUS_RESIDENCE_THRESHOLDS,
  LPR_ABANDONMENT_THRESHOLDS,
  REENTRY_PERMIT_RULES,
} from '@constants/uscis-rules';

/**
 * Helper to map risk level to string description
 */
export function mapRiskLevelToDescription(risk: TravelRiskDetails): string {
  const messages = {
    none: 'No risk',
    low: 'Low risk',
    medium: 'Medium risk',
    warning: 'Warning: Approaching limits',
    high: 'High risk',
    severe: 'Severe risk',
    critical: 'Critical risk',
    presumption_of_abandonment: 'Presumption of abandonment',
    protected_by_permit: 'Protected by reentry permit',
    approaching_permit_limit: 'Approaching reentry permit limit',
  };
  return messages[risk.riskLevel] || 'Unknown risk';
}

/**
 * Determine risk level for green card based on days abroad
 */
export function determineGreenCardRiskLevel(
  daysAbroad: number,
  hasReentryPermit: boolean,
): TravelRiskDetails['riskLevel'] {
  if (hasReentryPermit) {
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

/**
 * Generate warnings based on days abroad
 */
export function generateWarningsForDaysAbroad(
  daysAbroad: number,
  hasReentryPermit: boolean,
): string[] {
  const warnings: string[] = [];

  if (hasReentryPermit) {
    if (daysAbroad >= REENTRY_PERMIT_RULES.APPROACHING_LIMIT_DAYS) {
      warnings.push('You are approaching the maximum protection period of your reentry permit');
    }
    return warnings;
  }

  if (daysAbroad >= LPR_ABANDONMENT_THRESHOLDS.PRESUMPTION_OF_ABANDONMENT) {
    warnings.push(
      'Trip duration creates a legal presumption of abandonment of permanent residence',
      'You may face questioning at the border and need strong evidence of US ties',
    );
  } else if (daysAbroad >= LPR_ABANDONMENT_THRESHOLDS.CRITICAL) {
    warnings.push(
      'Extended absence significantly increases risk of being considered to have abandoned LPR status',
      'Strongly consider obtaining a reentry permit before travel',
    );
  } else if (daysAbroad >= LPR_ABANDONMENT_THRESHOLDS.SEVERE) {
    warnings.push(
      'Trip duration may raise questions about permanent resident intent',
      'Consider applying for a reentry permit if planning extended travel',
    );
  } else if (daysAbroad >= LPR_ABANDONMENT_THRESHOLDS.WARNING) {
    warnings.push('Extended absences can affect your eligibility for naturalization');
  } else if (daysAbroad >= CONTINUOUS_RESIDENCE_THRESHOLDS.MEDIUM_RISK) {
    warnings.push('Trip duration approaching continuous residence limits');
  }

  return warnings;
}

/**
 * Generate recommendations based on risk level
 */
export function generateRecommendationsForRiskLevel(
  riskLevel: TravelRiskDetails['riskLevel'],
  _daysAbroad: number,
): string[] {
  const recommendations: string[] = [];

  switch (riskLevel) {
    case 'presumption_of_abandonment':
      recommendations.push(
        'Consult an immigration attorney before attempting to return to the US',
        'Gather strong evidence of your US ties (property, employment, family)',
        'Consider applying for SB-1 returning resident visa if unable to return soon',
      );
      break;
    case 'critical':
      recommendations.push(
        'Return to the US as soon as possible',
        'Apply for a reentry permit if you must travel again',
        'Maintain strong evidence of US ties',
      );
      break;
    case 'severe':
      recommendations.push(
        'Limit any additional travel outside the US',
        'Consider applying for a reentry permit for future trips',
        'Keep documentation of your US ties readily available',
      );
      break;
    case 'high':
      recommendations.push(
        'Avoid extended trips abroad',
        'Maintain continuous residence for naturalization eligibility',
      );
      break;
    case 'warning':
      recommendations.push('Plan to return well before 6 months to maintain continuous residence');
      break;
    case 'approaching_permit_limit':
      recommendations.push(
        'Plan to return before your reentry permit protection expires',
        'Consider your naturalization timeline as permit does not protect continuous residence',
      );
      break;
  }

  return recommendations;
}
