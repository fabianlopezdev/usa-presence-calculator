// External imports (alphabetical)
import { differenceInDays } from 'date-fns';

// Internal imports - schemas/types first (alphabetical)
import { Trip } from '@schemas/trip';

// Internal imports - other (alphabetical)
import { CONTINUOUS_RESIDENCE_THRESHOLDS } from '@constants/uscis-rules';
import { parseUTCDate } from '@utils/utc-date-helpers';

/**
 * Calculate trip metrics including current year trips and longest trip
 */
export function calculateTripMetrics(trips: Trip[]): {
  currentYearTrips: Trip[];
  totalDaysAbroadCurrentYear: number;
  longestTrip: Trip | null;
  maxDays: number;
} {
  const currentYear = new Date().getFullYear();
  const currentYearTrips = trips.filter(
    (trip) => parseUTCDate(trip.departureDate).getFullYear() === currentYear,
  );

  const totalDaysAbroadCurrentYear = currentYearTrips.reduce((total, trip) => {
    const departure = parseUTCDate(trip.departureDate);
    const returnDate = parseUTCDate(trip.returnDate);
    // USCIS rule: departure and return days count as days IN the USA
    // So we subtract 1 from the difference (or use max 0 for same-day trips)
    const daysAbroad = Math.max(0, differenceInDays(returnDate, departure) - 1);
    return total + daysAbroad;
  }, 0);

  let longestTrip: Trip | null = null;
  let maxDays = 0;

  trips.forEach((trip) => {
    const departure = parseUTCDate(trip.departureDate);
    const returnDate = parseUTCDate(trip.returnDate);
    // USCIS rule: departure and return days count as days IN the USA
    const daysAbroad = Math.max(0, differenceInDays(returnDate, departure) - 1);

    if (daysAbroad > maxDays) {
      maxDays = daysAbroad;
      longestTrip = trip;
    }
  });

  return {
    currentYearTrips,
    totalDaysAbroadCurrentYear,
    longestTrip,
    maxDays,
  };
}

/**
 * Get recommendations for different risk levels
 */
function getRecommendationsByRiskLevel(riskLevel: string): string[] {
  const recommendationMap: Record<string, string[]> = {
    automatic_loss: [
      'Your green card is likely considered abandoned',
      'You will need to apply for a returning resident visa (SB-1)',
      'Consult with an immigration attorney before attempting to return',
      'Prepare extensive documentation of ties to the U.S.',
    ],
    high_risk: [
      'URGENT: Return to the U.S. immediately',
      'Risk of automatic loss of green card is imminent',
      'Seek legal representation before attempting reentry',
      'Apply for a reentry permit if you must travel again',
    ],
    presumption_of_abandonment: [
      'Prepare evidence to overcome presumption of abandonment',
      'Consult with an immigration attorney immediately',
      'Consider applying for a reentry permit for future travel',
      'Document all ties to the United States',
    ],
    warning: [
      'Maintain strong ties to the U.S. (employment, home, family)',
      'Keep documentation of your U.S. connections',
      'Consider shorter trips in the future',
    ],
  };
  return recommendationMap[riskLevel] || [];
}

/**
 * Generate recommendations based on LPR risk level
 */
export function generateLPRStatusRecommendations(
  riskLevel: string,
  totalDaysAbroadCurrentYear: number,
): { recommendations: string[]; requiresReentryPermit: boolean } {
  const recommendations = getRecommendationsByRiskLevel(riskLevel);
  const requiresReentryPermit = [
    'automatic_loss',
    'high_risk',
    'presumption_of_abandonment',
  ].includes(riskLevel);

  // Additional warnings for cumulative travel
  if (totalDaysAbroadCurrentYear > 180 && riskLevel === 'none') {
    recommendations.push(
      `You have spent ${totalDaysAbroadCurrentYear} days abroad this year`,
      'Frequent extended travel may indicate abandonment of residence',
      'Consider reducing travel frequency and duration',
      'Maintain strong evidence of U.S. ties',
    );
  }

  return { recommendations, requiresReentryPermit };
}

/**
 * Check if any trips pose a risk to continuous residence
 */
export function hasRiskyTrips(trips: Trip[]): boolean {
  return trips.some((trip) => {
    const departure = parseUTCDate(trip.departureDate);
    const returnDate = parseUTCDate(trip.returnDate);
    // USCIS rule: departure and return days count as days IN the USA
    const daysAbroad = Math.max(0, differenceInDays(returnDate, departure) - 1);
    return daysAbroad >= CONTINUOUS_RESIDENCE_THRESHOLDS.HIGH_RISK;
  });
}
