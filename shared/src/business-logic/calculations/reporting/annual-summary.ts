// Internal dependencies - Schemas & Types
import { Trip } from '@schemas/trip';

// Internal dependencies - Business Logic
import {
  calculateTripDaysAbroadExcludingTravelDays,
  formatDateRange,
  getActualValidTrips,
  parseTripDates,
} from '@business-logic/calculations/travel-analytics/helpers';
import { determineTravelTrend } from '@business-logic/calculations/travel-risk/helpers';

// Internal dependencies - Constants
import { ANNUAL_SUMMARY_CONFIG, DEFAULT_VALUES } from '@constants/index';

// Internal dependencies - Utilities
import { parseUTCDate, getUTCYear } from '@utils/utc-date-helpers';

// Export functions in alphabetical order
export function calculateYearSummaryData(yearTrips: Trip[]): {
  totalDaysAbroad: number;
  longestTrip: { trip: Trip; duration: number } | null;
  countryDays: Map<string, number>;
} {
  let totalDaysAbroad = 0;
  let longestTrip: { trip: Trip; duration: number } | null = null;
  const countryDays = new Map<string, number>();

  for (const trip of yearTrips) {
    const dates = parseTripDates(trip);
    if (!dates) continue;

    const duration = calculateTripDaysAbroadExcludingTravelDays(dates.departure, dates.returnDate);

    totalDaysAbroad += duration;

    if (!longestTrip || duration > longestTrip.duration) {
      longestTrip = { trip, duration };
    }

    const country = trip.location || DEFAULT_VALUES.UNKNOWN_LOCATION;
    const existing = countryDays.get(country) || 0;
    countryDays.set(country, existing + duration);
  }

  return { totalDaysAbroad, longestTrip, countryDays };
}

export function compareWithPreviousYear(
  currentTotalDays: number,
  currentTripCount: number,
  previousYearTrips: Trip[],
  previousYear: number,
): {
  daysChange: number;
  tripsChange: number;
  trend: 'more_travel' | 'less_travel' | 'similar';
} {
  const prevYearTrips = getYearTrips(previousYearTrips, previousYear);
  const { totalDaysAbroad: prevTotalDays } = calculateYearSummaryData(prevYearTrips);

  const daysChange = currentTotalDays - prevTotalDays;
  const tripsChange = currentTripCount - prevYearTrips.length;
  const trend = determineTravelTrend(daysChange);

  return { daysChange, tripsChange, trend };
}

export function formatLongestTrip(longestTrip: { trip: Trip; duration: number }): {
  destination: string;
  duration: number;
  dates: string;
} {
  return {
    destination: longestTrip.trip.location || DEFAULT_VALUES.UNKNOWN_LOCATION,
    duration: longestTrip.duration,
    dates: formatDateRange(longestTrip.trip.departureDate, longestTrip.trip.returnDate),
  };
}

export function generateAnnualTravelSummary(
  trips: Trip[],
  year: number,
  previousYearTrips?: Trip[],
): {
  year: number;
  totalDaysAbroad: number;
  totalTrips: number;
  longestTrip: { destination: string; duration: number; dates: string } | null;
  topDestinations: Array<{ country: string; days: number }>;
  comparedToLastYear: {
    daysChange: number;
    tripsChange: number;
    trend: 'more_travel' | 'less_travel' | 'similar';
  } | null;
} {
  const yearTrips = getYearTrips(trips, year);
  const { totalDaysAbroad, longestTrip, countryDays } = calculateYearSummaryData(yearTrips);

  const topDestinations = getTopDestinations(countryDays);
  const comparedToLastYear = previousYearTrips
    ? compareWithPreviousYear(totalDaysAbroad, yearTrips.length, previousYearTrips, year - 1)
    : null;

  return {
    year,
    totalDaysAbroad,
    totalTrips: yearTrips.length,
    longestTrip: longestTrip ? formatLongestTrip(longestTrip) : null,
    topDestinations,
    comparedToLastYear,
  };
}

export function getTopDestinations(
  countryDays: Map<string, number>,
): Array<{ country: string; days: number }> {
  return Array.from(countryDays.entries())
    .map(([country, days]) => ({ country, days }))
    .sort((a, b) => b.days - a.days)
    .slice(0, ANNUAL_SUMMARY_CONFIG.TOP_DESTINATIONS_LIMIT);
}

export function getYearTrips(trips: Trip[], year: number): Trip[] {
  return getActualValidTrips(trips).filter((trip) => {
    const departure = parseUTCDate(trip.departureDate);
    return getUTCYear(departure) === year;
  });
}
