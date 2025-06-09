// External dependencies
import { addDays, differenceInDays } from 'date-fns';

// Internal dependencies - Schemas & Types
import { CountryData } from '@schemas/travel-analytics-helpers';
import {
  CountryStatistics,
  TravelProjection,
  TripRiskAssessment,
  YearlyDaysAbroad,
} from '@schemas/travel-analytics';
import { Trip } from '@schemas/trip';

// Internal dependencies - Business Logic
import { validateAndParseDates } from '@business-logic/calculations/presence/helpers';
import { calculateSafeTravelBudget } from '@business-logic/calculations/travel-analytics/budget-helpers';
import {
  calculateDaysAbroadInYear,
  calculateTotalInclusiveDays,
  getActualValidTrips,
  getDefaultCountryData,
  getRequiredDays,
  getYearBoundaries,
  isValidTripForRiskAssessment,
  updateCountryData,
} from '@business-logic/calculations/travel-analytics/helpers';
import {
  assessTravelRisk,
  calculateConfidenceLevel,
  getRiskImpactDescription,
  getRiskRecommendation,
} from '@business-logic/calculations/travel-risk/helpers';

// Internal dependencies - Constants
import { DEFAULT_VALUES, PROJECTION_DEFAULTS, TIME_PERIODS } from '@constants/index';

// Internal dependencies - Utilities
import { calculateTripDuration } from '@utils/trip-calculations';
import { parseUTCDate, formatUTCDate, getUTCYear } from '@utils/utc-date-helpers';

// Export functions in alphabetical order
export function assessUpcomingTripRisk(
  upcomingTrips: Trip[],
  currentTotalDaysAbroad: number,
  eligibilityCategory: 'three_year' | 'five_year',
  greenCardDate: string,
  currentDate: string = new Date().toISOString().split('T')[0],
): TripRiskAssessment[] {
  const assessments: TripRiskAssessment[] = [];
  const requiredDays = getRequiredDays(eligibilityCategory);

  const safeBudget = calculateSafeTravelBudget(
    requiredDays - currentTotalDaysAbroad,
    currentTotalDaysAbroad,
    eligibilityCategory,
    greenCardDate,
    currentDate,
  );

  let cumulativeDaysAbroad = 0;

  // Only assess simulated (future) trips with valid data
  const futureTrips = upcomingTrips.filter(isValidTripForRiskAssessment);

  for (const trip of futureTrips) {
    const tripDays = calculateTripDuration(trip);
    if (tripDays < 0) continue;

    cumulativeDaysAbroad += tripDays;

    const departureDate = parseUTCDate(trip.departureDate);
    const returnDate = parseUTCDate(trip.returnDate);
    const totalTripDays = calculateTotalInclusiveDays(departureDate, returnDate);
    const { riskLevel, reason } = assessTravelRisk(
      totalTripDays,
      cumulativeDaysAbroad,
      safeBudget.daysAvailable,
    );

    assessments.push({
      tripId: trip.id,
      riskLevel,
      impactDescription: getRiskImpactDescription(riskLevel, reason),
      daysUntilRisk: tripDays >= 150 ? tripDays - 150 : null,
      recommendation: getRiskRecommendation(riskLevel, reason),
    });
  }

  return assessments;
}

export function calculateCountryStatistics(trips: Trip[]): CountryStatistics[] {
  const countryMap = new Map<string, CountryData>();
  const actualTrips = getActualValidTrips(trips);

  for (const trip of actualTrips) {
    const daysAbroad = calculateTripDuration(trip);
    if (daysAbroad < 0) continue;

    const country = trip.location || DEFAULT_VALUES.UNKNOWN_LOCATION;
    const existing = countryMap.get(country) || getDefaultCountryData();
    const returnDate = parseUTCDate(trip.returnDate);
    countryMap.set(country, updateCountryData(existing, daysAbroad, returnDate));
  }

  const statistics: CountryStatistics[] = [];
  for (const [country, data] of countryMap.entries()) {
    statistics.push({
      country,
      totalDays: data.totalDays,
      tripCount: data.tripCount,
      averageDuration: Math.round(data.totalDays / data.tripCount),
      lastVisited: data.lastVisited ? formatUTCDate(data.lastVisited) : null,
    });
  }

  // Users typically want to see their most visited destinations first
  return statistics.sort((a, b) => b.totalDays - a.totalDays);
}

export function calculateDaysAbroadByYear(
  trips: Trip[],
  greenCardDate: string,
  currentDate: string = new Date().toISOString().split('T')[0],
): YearlyDaysAbroad[] {
  const {
    startDate,
    endDate,
    isValid: datesValid,
  } = validateAndParseDates(greenCardDate, currentDate);

  if (!datesValid) {
    return [];
  }

  const startYear = startDate.getUTCFullYear();
  const endYear = endDate.getUTCFullYear();

  const yearlyData: YearlyDaysAbroad[] = [];
  const actualTrips = getActualValidTrips(trips);

  for (let year = startYear; year <= endYear; year++) {
    const yearBoundaries = getYearBoundaries(year, startYear, endYear, startDate, endDate);

    let daysAbroad = 0;
    let tripCount = 0;

    for (const trip of actualTrips) {
      const daysInYear = calculateDaysAbroadInYear(trip, yearBoundaries);
      daysAbroad += daysInYear;

      // Count trips based on departure year to avoid double-counting
      // trips that span multiple years, and only count if trip has days in this year
      const departure = parseUTCDate(trip.departureDate);
      if (getUTCYear(departure) === year && daysInYear > 0) {
        tripCount++;
      }
    }

    yearlyData.push({ year, daysAbroad, tripCount });
  }

  return yearlyData;
}

export function projectEligibilityDate(
  trips: Trip[],
  totalDaysInUSA: number,
  eligibilityCategory: 'three_year' | 'five_year',
  greenCardDate: string,
  currentDate: string = new Date().toISOString().split('T')[0],
): TravelProjection {
  const requiredDays = getRequiredDays(eligibilityCategory);
  const daysRemaining = Math.max(0, requiredDays - totalDaysInUSA);

  const greenCardParsed = parseUTCDate(greenCardDate);
  const currentParsed = parseUTCDate(currentDate);
  const daysSinceGreenCard = differenceInDays(currentParsed, greenCardParsed) + 1;
  const historicalAbsenceRate = calculateHistoricalAbsenceRate(daysSinceGreenCard, totalDaysInUSA);

  if (daysRemaining === 0) {
    return handleAlreadyEligible(currentDate, historicalAbsenceRate);
  }

  if (historicalAbsenceRate >= 1) {
    return handleImpossibleEligibility();
  }

  const projectedDaysNeeded = Math.ceil(daysRemaining / (1 - historicalAbsenceRate));
  const projectedDate = addDays(currentParsed, projectedDaysNeeded);

  const { variance, recentYears } = calculateProjectionConfidence(
    trips,
    greenCardDate,
    currentDate,
  );

  if (recentYears.length === 0 || trips.length === 0) {
    return createNoHistoryProjection(projectedDate);
  }

  return createProjectionWithHistory(
    projectedDate,
    historicalAbsenceRate,
    variance,
    recentYears.length,
  );
}

// Re-export functions from helper files
export { generateAnnualTravelSummary } from '@business-logic/calculations/reporting/annual-summary';
export { calculateMilestones } from '@business-logic/calculations/reporting/milestones';

function calculateHistoricalAbsenceRate(
  daysSinceGreenCard: number,
  totalDaysInUSA: number,
): number {
  return (daysSinceGreenCard - totalDaysInUSA) / daysSinceGreenCard;
}

function handleAlreadyEligible(
  currentDate: string,
  historicalAbsenceRate: number,
): TravelProjection {
  return {
    projectedEligibilityDate: currentDate,
    averageDaysAbroadPerYear: Math.round(historicalAbsenceRate * TIME_PERIODS.DAYS_IN_YEAR),
    confidenceLevel: 'high',
    assumptions: ['Physical presence requirement already met'],
  };
}

function handleImpossibleEligibility(): TravelProjection {
  return {
    projectedEligibilityDate: PROJECTION_DEFAULTS.FAR_FUTURE_DATE,
    averageDaysAbroadPerYear: TIME_PERIODS.DAYS_IN_YEAR,
    confidenceLevel: 'low',
    assumptions: ['100% historical absence rate makes eligibility impossible at current rate'],
  };
}

function calculateProjectionConfidence(
  trips: Trip[],
  greenCardDate: string,
  currentDate: string,
): { variance: number; recentYears: YearlyDaysAbroad[] } {
  const yearlyData = calculateDaysAbroadByYear(trips, greenCardDate, currentDate);
  const recentYears = yearlyData.slice(-3);

  if (recentYears.length === 0) {
    return { variance: 0, recentYears: [] };
  }

  const avgDaysAbroad =
    recentYears.reduce((sum, year) => sum + year.daysAbroad, 0) / recentYears.length;
  const variance =
    recentYears.reduce((sum, year) => sum + Math.pow(year.daysAbroad - avgDaysAbroad, 2), 0) /
    recentYears.length;

  return { variance, recentYears };
}

function createNoHistoryProjection(projectedDate: Date): TravelProjection {
  return {
    projectedEligibilityDate: formatUTCDate(projectedDate),
    averageDaysAbroadPerYear: 0,
    confidenceLevel: 'low',
    assumptions: ['No travel history available for projection'],
  };
}

function createProjectionWithHistory(
  projectedDate: Date,
  historicalAbsenceRate: number,
  variance: number,
  recentYearsCount: number,
): TravelProjection {
  const confidenceLevel = calculateConfidenceLevel(variance, recentYearsCount);

  return {
    projectedEligibilityDate: formatUTCDate(projectedDate),
    averageDaysAbroadPerYear: Math.round(historicalAbsenceRate * TIME_PERIODS.DAYS_IN_YEAR),
    confidenceLevel,
    assumptions: [
      `Based on ${Math.round(historicalAbsenceRate * 100)}% historical absence rate`,
      `Assuming similar travel patterns continue`,
      recentYearsCount < 3 ? 'Limited historical data available' : '',
    ].filter(Boolean),
  };
}
