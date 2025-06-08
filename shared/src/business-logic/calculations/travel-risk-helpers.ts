// Internal imports - schemas/types first (alphabetical)
import { TravelBudgetRiskResult, TravelRiskResult } from '@schemas/travel-analytics-helpers';

// Internal imports - other (alphabetical)
import {
  BUDGET_RECOMMENDATIONS,
  CONFIDENCE_THRESHOLDS,
  CONTINUOUS_RESIDENCE_THRESHOLDS,
  RISK_MESSAGES,
  RISK_RECOMMENDATIONS,
  TRAVEL_BUDGET_BUFFERS,
  TRAVEL_TREND_THRESHOLDS,
} from '@constants/index';

export { assessTripRiskForAllLegalThresholds } from './travel-risk-assessment';
export {
  calculateGreenCardAbandonmentRisk,
  checkIfTripApproachesGreenCardLoss,
  checkIfTripApproachesContinuousResidenceRisk,
  checkIfTripBreaksContinuousResidence,
  checkIfTripRisksAutomaticGreenCardLoss,
  getReentryPermitProtectedThresholds,
} from './travel-risk-abandonment';

export function assessTravelRisk(
  totalTripDays: number,
  cumulativeDaysAbroad: number,
  availableDays: number,
): TravelRiskResult {
  if (totalTripDays >= CONTINUOUS_RESIDENCE_THRESHOLDS.CRITICAL) {
    return { riskLevel: 'critical', reason: 'continuous_residence' };
  }
  if (totalTripDays >= CONTINUOUS_RESIDENCE_THRESHOLDS.HIGH_RISK) {
    return { riskLevel: 'high', reason: 'continuous_residence' };
  }
  if (totalTripDays >= CONTINUOUS_RESIDENCE_THRESHOLDS.MEDIUM_RISK) {
    return { riskLevel: 'medium', reason: 'continuous_residence' };
  }
  if (cumulativeDaysAbroad > availableDays) {
    return { riskLevel: 'medium', reason: 'physical_presence' };
  }
  return { riskLevel: 'low', reason: 'safe' };
}

export function determineTravelBudgetRisk(daysAvailable: number): TravelBudgetRiskResult {
  if (daysAvailable <= TRAVEL_BUDGET_BUFFERS.WARNING) {
    return {
      riskLevel: 'warning',
      recommendation: BUDGET_RECOMMENDATIONS.WARNING,
    };
  }
  if (daysAvailable <= TRAVEL_BUDGET_BUFFERS.CAUTION) {
    return {
      riskLevel: 'caution',
      recommendation: BUDGET_RECOMMENDATIONS.CAUTION,
    };
  }
  return {
    riskLevel: 'safe',
    recommendation: BUDGET_RECOMMENDATIONS.SAFE,
  };
}

export function calculateConfidenceLevel(
  variance: number,
  dataYears: number,
): 'high' | 'medium' | 'low' {
  if (
    variance > CONFIDENCE_THRESHOLDS.HIGH_VARIANCE ||
    dataYears < CONFIDENCE_THRESHOLDS.MINIMUM_YEARS_FOR_HIGH_CONFIDENCE
  ) {
    return 'low';
  }
  if (variance > CONFIDENCE_THRESHOLDS.MEDIUM_VARIANCE) {
    return 'medium';
  }
  return 'high';
}

export function determineTravelTrend(
  daysChange: number,
): 'more_travel' | 'less_travel' | 'similar' {
  if (daysChange > TRAVEL_TREND_THRESHOLDS.SIGNIFICANT_CHANGE_DAYS) {
    return 'more_travel';
  }
  if (daysChange < -TRAVEL_TREND_THRESHOLDS.SIGNIFICANT_CHANGE_DAYS) {
    return 'less_travel';
  }
  return 'similar';
}

// These helper functions make the risk assessment logic more maintainable
// by centralizing the message mapping
export function getRiskImpactDescription(
  riskLevel: 'low' | 'medium' | 'high' | 'critical',
  reason: 'continuous_residence' | 'physical_presence' | 'safe',
): string {
  if (riskLevel === 'critical' && reason === 'continuous_residence') {
    return RISK_MESSAGES.CONTINUOUS_RESIDENCE.CRITICAL;
  }
  if (riskLevel === 'high' && reason === 'continuous_residence') {
    return RISK_MESSAGES.CONTINUOUS_RESIDENCE.HIGH;
  }
  if (riskLevel === 'medium' && reason === 'continuous_residence') {
    return RISK_MESSAGES.CONTINUOUS_RESIDENCE.MEDIUM;
  }
  if (riskLevel === 'medium' && reason === 'physical_presence') {
    return RISK_MESSAGES.PHYSICAL_PRESENCE.EXCEEDED;
  }
  return RISK_MESSAGES.SAFE;
}

export function getRiskRecommendation(
  riskLevel: 'low' | 'medium' | 'high' | 'critical',
  reason: 'continuous_residence' | 'physical_presence' | 'safe',
): string {
  if (riskLevel === 'critical' && reason === 'continuous_residence') {
    return RISK_RECOMMENDATIONS.CONTINUOUS_RESIDENCE.CRITICAL;
  }
  if (riskLevel === 'high' && reason === 'continuous_residence') {
    return RISK_RECOMMENDATIONS.CONTINUOUS_RESIDENCE.HIGH;
  }
  if (riskLevel === 'medium' && reason === 'continuous_residence') {
    return RISK_RECOMMENDATIONS.CONTINUOUS_RESIDENCE.MEDIUM;
  }
  if (riskLevel === 'medium' && reason === 'physical_presence') {
    return RISK_RECOMMENDATIONS.PHYSICAL_PRESENCE.EXCEEDED;
  }
  return RISK_RECOMMENDATIONS.SAFE;
}
