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
      // Feb 1 to Feb 15 = 15 inclusive days, minus 2 per USCIS = 13 days abroad
      expect(result).toBe(13);
    });

    it('should handle trip partially overlapping period end', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const result = calculateTripDaysInPeriod(mockTrip, startDate, endDate);
      // Jan 15 to Jan 31 = 17 inclusive days, minus 2 per USCIS = 15 days abroad
      expect(result).toBe(15);
    });

    it('should handle trip spanning entire period', () => {
      const startDate = new Date('2024-01-20');
      const endDate = new Date('2024-02-10');
      const result = calculateTripDaysInPeriod(mockTrip, startDate, endDate);
      // Jan 20 to Feb 10 = 22 inclusive days, minus 2 per USCIS = 20 days abroad
      expect(result).toBe(20);
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
      // Dec 28-31 = 4 inclusive days, minus 2 per USCIS = 2 days abroad
      expect(result2023).toBe(2);

      const result2024 = calculateTripDaysInYear(mockTrip, 2024);
      // Jan 1-5 = 5 inclusive days, minus 2 per USCIS = 3 days abroad
      expect(result2024).toBe(3);
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

      // Should include Jan 13, 14 (not 12 which is the effective start/departure day)
      expect(daysSet.size).toBe(2);
      expect(daysSet.has('2024-01-12')).toBe(false); // Effective departure day
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
});
