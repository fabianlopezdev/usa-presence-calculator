// External dependencies
import { addDays, differenceInDays, isAfter, isBefore, subDays } from 'date-fns';

// Internal dependencies - Schemas & Types
import { TravelStreak } from '@schemas/travel-analytics';
import { Trip } from '@schemas/trip';

// Internal dependencies - Business Logic
import { validateAndParseDates } from '@business-logic/calculations/presence-calculator-helpers';
import {
  createPresenceStreak,
  getActualValidTrips,
} from '@business-logic/calculations/travel-analytics-helpers';

// Internal dependencies - Utilities
import { parseUTCDate, formatUTCDate, getCurrentUTCDate } from '@utils/utc-date-helpers';

// Export functions in alphabetical order
export function calculateTravelStreaks(
  trips: Trip[],
  greenCardDate: string,
  currentDate: string = formatUTCDate(getCurrentUTCDate()),
): TravelStreak[] {
  const {
    startDate,
    endDate,
    isValid: datesValid,
  } = validateAndParseDates(greenCardDate, currentDate);

  if (!datesValid) {
    return [];
  }

  const streaks: TravelStreak[] = [];
  const sortedTrips = getActualValidTrips(trips).sort((a, b) =>
    a.departureDate.localeCompare(b.departureDate),
  );

  if (sortedTrips.length === 0) {
    streaks.push(
      createPresenceStreak(startDate, endDate, 'Continuous presence in USA for {days} days'),
    );
    return streaks;
  }

  const firstDeparture = parseUTCDate(sortedTrips[0].departureDate);
  addInitialPresenceStreak(streaks, firstDeparture, startDate);

  addGapStreaks(streaks, sortedTrips);

  const lastReturn = parseUTCDate(sortedTrips[sortedTrips.length - 1].returnDate);
  addFinalPresenceStreak(streaks, lastReturn, endDate);

  // Users find it most useful to see their longest streaks first
  return streaks.sort((a, b) => b.duration - a.duration);
}

// Helper functions
function addFinalPresenceStreak(streaks: TravelStreak[], lastReturn: Date, endDate: Date): void {
  if (isBefore(lastReturn, endDate)) {
    const days = differenceInDays(endDate, lastReturn);
    if (days > 0) {
      streaks.push(
        createPresenceStreak(
          addDays(lastReturn, 1),
          endDate,
          'Current presence in USA for {days} days',
        ),
      );
    }
  }
}

function addGapStreaks(streaks: TravelStreak[], sortedTrips: Trip[]): void {
  for (let i = 0; i < sortedTrips.length - 1; i++) {
    const currentReturn = parseUTCDate(sortedTrips[i].returnDate);
    const nextDeparture = parseUTCDate(sortedTrips[i + 1].departureDate);

    const gapDays = differenceInDays(nextDeparture, currentReturn) - 1;
    if (gapDays > 0) {
      streaks.push(
        createPresenceStreak(
          addDays(currentReturn, 1),
          subDays(nextDeparture, 1),
          'Presence in USA for {days} days',
        ),
      );
    }
  }
}

function addInitialPresenceStreak(
  streaks: TravelStreak[],
  firstDeparture: Date,
  startDate: Date,
): void {
  if (isAfter(firstDeparture, startDate)) {
    const days = differenceInDays(firstDeparture, startDate);
    if (days > 0) {
      streaks.push(
        createPresenceStreak(
          startDate,
          subDays(firstDeparture, 1),
          'Initial presence in USA for {days} days',
        ),
      );
    }
  }
}
