import { differenceInDays, isAfter, isBefore } from 'date-fns';

import { PatternOfNonResidence } from '@schemas/lpr-status';
import { Trip } from '@schemas/trip';

import { calculateTripDuration } from '@utils/trip-calculations';
import { parseUTCDate } from '@utils/utc-date-helpers';

/**
 * Analyze pattern of non-residence for LPR status
 */
export function analyzePatternOfNonResidence(
  trips: Trip[],
  lprStartDate: string,
  currentDate: string,
): PatternOfNonResidence {
  const { startDate, endDate, yearsCovered } = parseDateRange(lprStartDate, currentDate);

  const sortedTrips = [...trips].sort(
    (a, b) => parseUTCDate(a.departureDate).getTime() - parseUTCDate(b.departureDate).getTime(),
  );

  const stats = calculateTripStatistics(sortedTrips, startDate, endDate);

  const totalDays = differenceInDays(endDate, startDate);
  const percentageTimeAbroad = totalDays > 0 ? (stats.totalDaysAbroad / totalDays) * 100 : 0;
  const avgDaysAbroadPerYear = yearsCovered > 0 ? stats.totalDaysAbroad / yearsCovered : 0;

  const hasPattern = determineIfHasPattern(
    percentageTimeAbroad,
    avgDaysAbroadPerYear,
    stats.numberOfTrips,
    stats.shortestReturnToUSA,
    stats.longestStayInUSA,
  );

  return {
    avgDaysAbroadPerYear,
    hasPattern,
    longestStayInUSA: stats.longestStayInUSA,
    numberOfTrips: stats.numberOfTrips,
    percentageTimeAbroad,
    shortestReturnToUSA:
      stats.shortestReturnToUSA === Number.MAX_SAFE_INTEGER ? 0 : stats.shortestReturnToUSA,
    totalDaysAbroad: stats.totalDaysAbroad,
    yearsCovered,
  };
}

function parseDateRange(
  lprStartDate: string,
  currentDate: string,
): { startDate: Date; endDate: Date; yearsCovered: number } {
  const startDate = parseUTCDate(lprStartDate);
  const endDate = parseUTCDate(currentDate);
  const yearsCovered = differenceInDays(endDate, startDate) / 365;
  return { startDate, endDate, yearsCovered };
}

function calculateTripStatistics(
  sortedTrips: Trip[],
  startDate: Date,
  endDate: Date,
): {
  totalDaysAbroad: number;
  numberOfTrips: number;
  longestStayInUSA: number;
  shortestReturnToUSA: number;
} {
  let totalDaysAbroad = 0;
  let numberOfTrips = 0;
  let longestStayInUSA = 0;
  let shortestReturnToUSA = Number.MAX_SAFE_INTEGER;
  let previousReturnDate: Date | null = null;

  sortedTrips.forEach((trip) => {
    const departure = parseUTCDate(trip.departureDate);
    const returnDate = parseUTCDate(trip.returnDate);

    // Include trips that are within or overlap with the analysis period
    if (isAfter(returnDate, startDate) && isBefore(departure, endDate)) {
      const daysAbroad = calculateTripDuration(trip);
      totalDaysAbroad += daysAbroad;
      numberOfTrips++;

      if (previousReturnDate) {
        // Calculate days in USA between trips (exclusive of travel days)
        const daysInUSA = Math.max(0, differenceInDays(departure, previousReturnDate) - 1);
        longestStayInUSA = Math.max(longestStayInUSA, daysInUSA);
        shortestReturnToUSA = Math.min(shortestReturnToUSA, daysInUSA);
      }

      previousReturnDate = returnDate;
    }
  });

  return {
    totalDaysAbroad,
    numberOfTrips,
    longestStayInUSA,
    shortestReturnToUSA,
  };
}

function determineIfHasPattern(
  percentageTimeAbroad: number,
  avgDaysAbroadPerYear: number,
  numberOfTrips: number,
  shortestReturnToUSA: number,
  longestStayInUSA: number,
): boolean {
  return (
    percentageTimeAbroad > 50 ||
    avgDaysAbroadPerYear > 180 ||
    (numberOfTrips > 5 && shortestReturnToUSA < 30) ||
    longestStayInUSA < 90
  );
}
