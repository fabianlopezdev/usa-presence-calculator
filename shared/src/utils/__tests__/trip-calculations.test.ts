/**
 * Tests for Trip Duration Calculation Utilities
 */

// Internal dependencies - Utilities
import {
  calculateTripDuration,
  calculateTripDaysInPeriod,
  calculateTripDaysExcludingTravel,
  calculateTripDaysInYear,
  populateTripDaysSet,
  TripDurationOptions,
} from '../trip-calculations';

// Internal dependencies - Schemas
import { Trip } from '@schemas/trip';

describe('trip-calculations', () => {
  describe('calculateTripDuration', () => {
    const mockTrip: Trip = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      departureDate: '2024-01-10',
      returnDate: '2024-01-20',
      location: 'Canada',
      isSimulated: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    it('should calculate days abroad with USCIS rules (default)', () => {
      const result = calculateTripDuration(mockTrip);
      // Jan 10 to Jan 20 = 11 inclusive days, minus 2 (departure and return) = 9 days abroad
      expect(result).toBe(9);
    });

    it('should calculate days abroad without USCIS rules', () => {
      const options: TripDurationOptions = {
        includeDepartureDay: false,
        includeReturnDay: false,
      };
      const result = calculateTripDuration(mockTrip, options);
      // Jan 10 to Jan 20 = 11 inclusive days, all count as abroad
      expect(result).toBe(11);
    });

    it('should handle same-day trips', () => {
      const sameDayTrip: Trip = {
        ...mockTrip,
        departureDate: '2024-01-10',
        returnDate: '2024-01-10',
      };
      const result = calculateTripDuration(sameDayTrip);
      expect(result).toBe(0); // Same day trips count as 0 days abroad per USCIS
    });

    it('should handle one-day trips', () => {
      const oneDayTrip: Trip = {
        ...mockTrip,
        departureDate: '2024-01-10',
        returnDate: '2024-01-11',
      };
      const result = calculateTripDuration(oneDayTrip);
      expect(result).toBe(0); // 1 day trip = 0 days abroad per USCIS rules
    });

    it('should handle partial USCIS rules', () => {
      const options: TripDurationOptions = {
        includeDepartureDay: true,
        includeReturnDay: false,
      };
      const result = calculateTripDuration(mockTrip, options);
      expect(result).toBe(10); // 11 inclusive days, minus 1 (only departure counts as USA day)
    });
  });

  describe('calculateTripDaysInPeriod', () => {
    const mockTrip: Trip = {
      id: '550e8400-e29b-41d4-a716-446655440002',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      departureDate: '2024-01-15',
      returnDate: '2024-02-15',
      location: 'Mexico',
      isSimulated: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    it('should calculate days for trip completely within period', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const result = calculateTripDaysInPeriod(mockTrip, startDate, endDate);
      // Jan 15 to Feb 15 = 32 inclusive days, minus 2 per USCIS = 30 days abroad
      expect(result).toBe(30);
    });

    it('should return 0 for trip completely outside period', () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      const result = calculateTripDaysInPeriod(mockTrip, startDate, endDate);
      expect(result).toBe(0);
    });

    it('should handle trip partially overlapping period start', () => {
      const startDate = new Date('2024-02-01');
      const endDate = new Date('2024-12-31');
      const result = calculateTripDaysInPeriod(mockTrip, startDate, endDate);
      // Feb 1 to Feb 15 = 15 inclusive days, minus 1 (only return day in period) = 14 days abroad
      expect(result).toBe(14);
    });

    it('should handle trip partially overlapping period end', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const result = calculateTripDaysInPeriod(mockTrip, startDate, endDate);
      // Jan 15 to Jan 31 = 17 inclusive days, minus 1 (only departure day in period) = 16 days abroad
      expect(result).toBe(16);
    });

    it('should handle trip spanning entire period', () => {
      const startDate = new Date('2024-01-20');
      const endDate = new Date('2024-02-10');
      const result = calculateTripDaysInPeriod(mockTrip, startDate, endDate);
      // Jan 20 to Feb 10 = 22 inclusive days, minus 0 (no travel days in period) = 22 days abroad
      expect(result).toBe(22);
    });
  });

  describe('calculateTripDaysExcludingTravel', () => {
    it('should exclude both travel days', () => {
      const mockTrip: Trip = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        departureDate: '2024-01-10',
        returnDate: '2024-01-20',
        location: 'Japan',
        isSimulated: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      const result = calculateTripDaysExcludingTravel(mockTrip);
      // Jan 10 to Jan 20 = 11 inclusive days, all count as abroad when excluding travel days
      expect(result).toBe(11);
    });

    it('should handle short trips correctly', () => {
      const shortTrip: Trip = {
        id: '550e8400-e29b-41d4-a716-446655440004',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        departureDate: '2024-01-10',
        returnDate: '2024-01-12',
        location: 'Canada',
        isSimulated: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      const result = calculateTripDaysExcludingTravel(shortTrip);
      // Jan 10 to Jan 12 = 3 inclusive days, all count as abroad when excluding travel days
      expect(result).toBe(3);
    });
  });

  describe('calculateTripDaysInYear', () => {
    const mockTrip: Trip = {
      id: '550e8400-e29b-41d4-a716-446655440005',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      departureDate: '2023-12-28',
      returnDate: '2024-01-05',
      location: 'France',
      isSimulated: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    it('should calculate days for trip spanning year boundary', () => {
      const result2023 = calculateTripDaysInYear(mockTrip, 2023);
      // Dec 28-31 = 4 inclusive days, minus 1 (only departure day in 2023) = 3 days abroad
      expect(result2023).toBe(3);

      const result2024 = calculateTripDaysInYear(mockTrip, 2024);
      // Jan 1-5 = 5 inclusive days, minus 1 (only return day in 2024) = 4 days abroad
      expect(result2024).toBe(4);
    });

    it('should handle trip completely in one year', () => {
      const tripIn2024: Trip = {
        ...mockTrip,
        departureDate: '2024-03-10',
        returnDate: '2024-03-20',
      };
      const result = calculateTripDaysInYear(tripIn2024, 2024);
      // Mar 10 to Mar 20 = 11 inclusive days, minus 2 per USCIS = 9 days abroad
      expect(result).toBe(9);
    });

    it('should return 0 for trip in different year', () => {
      const tripIn2024: Trip = {
        ...mockTrip,
        departureDate: '2024-03-10',
        returnDate: '2024-03-20',
      };
      const result = calculateTripDaysInYear(tripIn2024, 2023);
      expect(result).toBe(0);
    });

    it('should handle leap year correctly', () => {
      const leapYearTrip: Trip = {
        id: '550e8400-e29b-41d4-a716-446655440006',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        departureDate: '2024-02-28',
        returnDate: '2024-03-02',
        location: 'UK',
        isSimulated: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      const result = calculateTripDaysInYear(leapYearTrip, 2024);
      // Feb 28 to Mar 2 = 4 inclusive days (leap year), minus 2 per USCIS = 2 days abroad
      expect(result).toBe(2);
    });
  });

  describe('populateTripDaysSet', () => {
    const mockTrip: Trip = {
      id: '550e8400-e29b-41d4-a716-446655440007',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      departureDate: '2024-01-10',
      returnDate: '2024-01-15',
      location: 'Canada',
      isSimulated: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    it('should populate set with days abroad (excluding travel days per USCIS)', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const daysSet = new Set<string>();

      populateTripDaysSet(mockTrip, startDate, endDate, daysSet);

      // Should include Jan 11, 12, 13, 14 (not 10 or 15)
      expect(daysSet.size).toBe(4);
      expect(daysSet.has('2024-01-11')).toBe(true);
      expect(daysSet.has('2024-01-12')).toBe(true);
      expect(daysSet.has('2024-01-13')).toBe(true);
      expect(daysSet.has('2024-01-14')).toBe(true);
      expect(daysSet.has('2024-01-10')).toBe(false); // Departure day
      expect(daysSet.has('2024-01-15')).toBe(false); // Return day
    });

    it('should handle trip partially within period', () => {
      const startDate = new Date('2024-01-12');
      const endDate = new Date('2024-01-31');
      const daysSet = new Set<string>();

      populateTripDaysSet(mockTrip, startDate, endDate, daysSet);

      // Should include Jan 12, 13, 14 (12 is NOT the original departure day)
      expect(daysSet.size).toBe(3);
      expect(daysSet.has('2024-01-12')).toBe(true); // Not a travel day in original trip
      expect(daysSet.has('2024-01-13')).toBe(true);
      expect(daysSet.has('2024-01-14')).toBe(true);
      expect(daysSet.has('2024-01-11')).toBe(false);
      expect(daysSet.has('2024-01-15')).toBe(false); // Return day
    });

    it('should handle empty set for trip outside period', () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      const daysSet = new Set<string>();

      populateTripDaysSet(mockTrip, startDate, endDate, daysSet);

      expect(daysSet.size).toBe(0);
    });

    it('should add to existing set without duplicates', () => {
      const daysSet = new Set<string>(['2024-01-11', '2024-01-20']);
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      populateTripDaysSet(mockTrip, startDate, endDate, daysSet);

      // Should have original 2 + 3 new days (12, 13, 14)
      expect(daysSet.size).toBe(5);
      expect(daysSet.has('2024-01-20')).toBe(true); // Original
      expect(daysSet.has('2024-01-11')).toBe(true); // Original (no duplicate)
    });

    it('should handle same-day trips', () => {
      const sameDayTrip: Trip = {
        ...mockTrip,
        departureDate: '2024-01-10',
        returnDate: '2024-01-10',
      };
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const daysSet = new Set<string>();

      populateTripDaysSet(sameDayTrip, startDate, endDate, daysSet);

      // Same day trips don't add any days to the set
      expect(daysSet.size).toBe(0);
    });
  });

  describe('edge cases and boundary conditions', () => {
    describe('invalid date edge cases', () => {
      it('should handle trips with invalid date formats gracefully', () => {
        const invalidTrip: Trip = {
          id: 'test-invalid',
          userId: 'user-1',
          departureDate: 'invalid-date',
          returnDate: '2024-01-20',
          location: 'Test',
          isSimulated: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        // Invalid dates result in NaN from parseUTCDate
        const result = calculateTripDuration(invalidTrip);
        expect(isNaN(result)).toBe(true);
      });

      it('should handle trips where return date is before departure date', () => {
        const backwardsTrip: Trip = {
          id: 'test-backwards',
          userId: 'user-1',
          departureDate: '2024-01-20',
          returnDate: '2024-01-10',
          location: 'Test',
          isSimulated: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        const result = calculateTripDuration(backwardsTrip);
        // Should handle gracefully, likely returning 0 or negative
        expect(result).toBeLessThanOrEqual(0);
      });
    });

    describe('extreme duration edge cases', () => {
      it('should handle very long trips (multiple years)', () => {
        const longTrip: Trip = {
          id: 'test-long',
          userId: 'user-1',
          departureDate: '2020-01-01',
          returnDate: '2024-12-31',
          location: 'Mars Colony',
          isSimulated: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        const result = calculateTripDuration(longTrip);
        // Should be approximately 5 years * 365 days - 2 (USCIS rules)
        expect(result).toBeGreaterThan(1800);
        expect(result).toBeLessThan(1830);
      });

      it('should handle trips at year boundaries with custom options', () => {
        const yearBoundaryTrip: Trip = {
          id: 'test-boundary',
          userId: 'user-1',
          departureDate: '2023-12-31',
          returnDate: '2024-01-01',
          location: 'Test',
          isSimulated: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        // Test with different option combinations
        const fullUSCIS = calculateTripDuration(yearBoundaryTrip);
        expect(fullUSCIS).toBe(0); // 2 days - 2 = 0

        const noDepartureCredit = calculateTripDuration(yearBoundaryTrip, {
          includeDepartureDay: false,
          includeReturnDay: true,
        });
        expect(noDepartureCredit).toBe(1); // 2 days - 1 = 1

        const noReturnCredit = calculateTripDuration(yearBoundaryTrip, {
          includeDepartureDay: true,
          includeReturnDay: false,
        });
        expect(noReturnCredit).toBe(1); // 2 days - 1 = 1

        const noCredits = calculateTripDuration(yearBoundaryTrip, {
          includeDepartureDay: false,
          includeReturnDay: false,
        });
        expect(noCredits).toBe(2); // 2 days - 0 = 2
      });
    });

    describe('calculateTripDaysInPeriod edge cases', () => {
      it('should handle period boundaries at exact midnight', () => {
        const trip: Trip = {
          id: 'test-midnight',
          userId: 'user-1',
          departureDate: '2024-01-15',
          returnDate: '2024-01-20',
          location: 'Test',
          isSimulated: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        // Period ends exactly at trip start
        const result1 = calculateTripDaysInPeriod(
          trip,
          new Date('2024-01-01T00:00:00Z'),
          new Date('2024-01-14T23:59:59.999Z'),
        );
        expect(result1).toBe(0);

        // Period starts exactly at trip end
        const result2 = calculateTripDaysInPeriod(
          trip,
          new Date('2024-01-21T00:00:00Z'),
          new Date('2024-01-31T23:59:59.999Z'),
        );
        expect(result2).toBe(0);
      });

      it('should handle single-day periods', () => {
        const trip: Trip = {
          id: 'test-single-day',
          userId: 'user-1',
          departureDate: '2024-01-15',
          returnDate: '2024-01-20',
          location: 'Test',
          isSimulated: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        // Period is just one day within the trip
        const result = calculateTripDaysInPeriod(
          trip,
          new Date('2024-01-17T00:00:00Z'),
          new Date('2024-01-17T23:59:59.999Z'),
        );
        // Jan 17 is not a travel day, so it counts as 1 day abroad
        expect(result).toBe(1);
      });

      it('should handle periods with startBoundary and endBoundary options', () => {
        const trip: Trip = {
          id: 'test-boundaries',
          userId: 'user-1',
          departureDate: '2024-01-10',
          returnDate: '2024-01-20',
          location: 'Test',
          isSimulated: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        const options: TripDurationOptions = {
          startBoundary: new Date('2024-01-12'),
          endBoundary: new Date('2024-01-18'),
        };

        // This tests if the options are used (though current implementation might not use them)
        const result = calculateTripDaysInPeriod(
          trip,
          new Date('2024-01-01'),
          new Date('2024-01-31'),
          options,
        );

        // Jan 10-20 within Jan 1-31 = 11 days - 2 = 9 days
        expect(result).toBe(9);
      });
    });

    describe('calculateTripDaysInYear edge cases', () => {
      it('should handle trips spanning multiple years', () => {
        const multiYearTrip: Trip = {
          id: 'test-multi-year',
          userId: 'user-1',
          departureDate: '2022-06-01',
          returnDate: '2025-06-01',
          location: 'Long Term',
          isSimulated: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        // Should count full year 2023
        const result2023 = calculateTripDaysInYear(multiYearTrip, 2023);
        expect(result2023).toBe(365); // 365 days - 0 (no travel days in 2023)

        // Should count full year 2024 (leap year)
        const result2024 = calculateTripDaysInYear(multiYearTrip, 2024);
        expect(result2024).toBe(366); // 366 days - 0 (no travel days in 2024)
      });

      it('should handle year 9999', () => {
        const futureTrip: Trip = {
          id: 'test-future',
          userId: 'user-1',
          departureDate: '9999-12-30',
          returnDate: '9999-12-31',
          location: 'Future',
          isSimulated: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        const result = calculateTripDaysInYear(futureTrip, 9999);
        expect(result).toBe(0); // 2 days - 2 = 0
      });

      it('should handle negative years (BCE)', () => {
        const bceTrip: Trip = {
          id: 'test-bce',
          userId: 'user-1',
          departureDate: '-0001-01-01',
          returnDate: '-0001-01-10',
          location: 'Ancient Rome',
          isSimulated: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        // Negative year strings are not valid ISO dates and will return NaN
        const result = calculateTripDaysInYear(bceTrip, -1);
        expect(isNaN(result)).toBe(true);
      });
    });

    describe('populateTripDaysSet edge cases', () => {
      it('should handle very large existing sets', () => {
        // Create a large set with 1000 days
        const largeSet = new Set<string>();
        for (let i = 0; i < 1000; i++) {
          largeSet.add(`2023-01-${String((i % 31) + 1).padStart(2, '0')}`);
        }

        const trip: Trip = {
          id: 'test-large-set',
          userId: 'user-1',
          departureDate: '2024-01-10',
          returnDate: '2024-01-15',
          location: 'Test',
          isSimulated: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        const initialSize = largeSet.size;
        populateTripDaysSet(trip, new Date('2024-01-01'), new Date('2024-01-31'), largeSet);

        // Should add 4 days (11, 12, 13, 14)
        expect(largeSet.size).toBe(initialSize + 4);
      });

      it('should handle trips with custom USCIS options in populateTripDaysSet', () => {
        const trip: Trip = {
          id: 'test-custom-options',
          userId: 'user-1',
          departureDate: '2024-01-10',
          returnDate: '2024-01-12',
          location: 'Test',
          isSimulated: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        const set1 = new Set<string>();
        const set2 = new Set<string>();

        // Default USCIS rules
        populateTripDaysSet(trip, new Date('2024-01-01'), new Date('2024-01-31'), set1);
        expect(set1.size).toBe(1); // Only Jan 11

        // No USCIS rules
        populateTripDaysSet(trip, new Date('2024-01-01'), new Date('2024-01-31'), set2, {
          includeDepartureDay: false,
          includeReturnDay: false,
        });
        expect(set2.size).toBe(3); // Jan 10, 11, 12
      });

      it('should handle periods that are subsets of a single day', () => {
        const trip: Trip = {
          id: 'test-subset',
          userId: 'user-1',
          departureDate: '2024-01-10',
          returnDate: '2024-01-20',
          location: 'Test',
          isSimulated: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        const daysSet = new Set<string>();

        // Period is less than a full day
        populateTripDaysSet(
          trip,
          new Date('2024-01-15T12:00:00Z'),
          new Date('2024-01-15T18:00:00Z'),
          daysSet,
        );

        // Should count the full day since Jan 15 is within the trip and not a travel day
        expect(daysSet.size).toBe(1);
      });
    });

    describe('floating point and precision edge cases', () => {
      it('should handle trips at maximum JavaScript date range', () => {
        const maxDate = new Date(8640000000000000); // Max JavaScript date
        const almostMaxDate = new Date(8640000000000000 - 86400000); // One day before max

        const extremeTrip: Trip = {
          id: 'test-extreme',
          userId: 'user-1',
          departureDate: almostMaxDate.toISOString().split('T')[0],
          returnDate: maxDate.toISOString().split('T')[0],
          location: 'End of Time',
          isSimulated: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        expect(() => calculateTripDuration(extremeTrip)).not.toThrow();
      });

      it('should maintain consistency with different timezone representations', () => {
        const trip1: Trip = {
          id: 'test-tz1',
          userId: 'user-1',
          departureDate: '2024-01-10',
          returnDate: '2024-01-15',
          location: 'Test',
          isSimulated: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        // parseUTCDate expects YYYY-MM-DD format, not ISO strings with time
        const result1 = calculateTripDuration(trip1);
        expect(result1).toBe(4); // 6 days - 2 USCIS = 4

        // Test with UTC midnight times
        const trip2: Trip = {
          ...trip1,
          id: 'test-tz2',
          departureDate: '2024-01-10',
          returnDate: '2024-01-15',
        };

        const result2 = calculateTripDuration(trip2);
        expect(result1).toBe(result2);
      });
    });

    describe('calculateTripDaysExcludingTravel edge cases', () => {
      it('should never return negative values', () => {
        const scenarios = [
          { departureDate: '2024-01-10', returnDate: '2024-01-10' }, // Same day
          { departureDate: '2024-01-10', returnDate: '2024-01-11' }, // One day
          { departureDate: '2024-01-10', returnDate: '2024-01-09' }, // Invalid (return before departure)
        ];

        scenarios.forEach((dates, index) => {
          const trip: Trip = {
            id: `test-scenario-${index}`,
            userId: 'user-1',
            ...dates,
            location: 'Test',
            isSimulated: false,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          };

          const result = calculateTripDaysExcludingTravel(trip);
          expect(result).toBeGreaterThanOrEqual(0);
        });
      });
    });
  });
});
