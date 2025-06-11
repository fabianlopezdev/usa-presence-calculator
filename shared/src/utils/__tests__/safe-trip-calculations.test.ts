import { isErr, isOk, TripValidationError } from '@errors/index';

import {
  safeCalculateTripDuration,
  safeCalculateTripDaysInPeriod,
  safeCalculateTripDaysInYear,
} from '../safe-trip-calculations';

describe('Safe Trip Calculation Functions', () => {
  const validTrip = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: '123e4567-e89b-12d3-a456-426614174001',
    departureDate: '2023-01-01',
    returnDate: '2023-01-10',
    location: 'Canada',
    isSimulated: false,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  describe('safeCalculateTripDuration', () => {
    it('should return success result for valid trip', () => {
      const result = safeCalculateTripDuration(validTrip);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(8); // 10 days total - 2 travel days (departure + return) = 8 days abroad
      }
    });

    it('should respect includeDepartureDay and includeReturnDay options', () => {
      const result = safeCalculateTripDuration(validTrip, {
        includeDepartureDay: false,
        includeReturnDay: false,
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(10); // No travel day credits, full 10 days abroad
      }
    });

    it('should return error for invalid trip data', () => {
      const result = safeCalculateTripDuration({
        invalidTrip: true,
      });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(TripValidationError);
      }
    });

    it('should return error for invalid date format', () => {
      const invalidTrip = {
        ...validTrip,
        departureDate: '01/01/2023', // Invalid format
      };

      const result = safeCalculateTripDuration(invalidTrip);

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(TripValidationError);
      }
    });

    it('should return error for return date before departure', () => {
      const invalidTrip = {
        ...validTrip,
        departureDate: '2023-01-10',
        returnDate: '2023-01-01',
      };

      const result = safeCalculateTripDuration(invalidTrip);

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(TripValidationError);
      }
    });

    it('should handle null/undefined inputs', () => {
      const result = safeCalculateTripDuration(null);

      expect(isErr(result)).toBe(true);
    });

    it('should handle same day trips', () => {
      const sameDayTrip = {
        ...validTrip,
        departureDate: '2023-01-01',
        returnDate: '2023-01-01',
      };

      const result = safeCalculateTripDuration(sameDayTrip);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(0); // Same day = 0 days duration
      }
    });

    it('should reject invalid options', () => {
      const result = safeCalculateTripDuration(validTrip, {
        includeDepartureDay: 'yes', // Should be boolean
      });

      expect(isErr(result)).toBe(true);
    });
  });

  describe('safeCalculateTripDaysInPeriod', () => {
    it('should return success result for valid inputs', () => {
      const result = safeCalculateTripDaysInPeriod(validTrip, '2022-12-01', '2023-01-31');

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(8); // 10 days - 2 travel days = 8 days abroad
      }
    });

    it('should handle partial overlap at start', () => {
      const result = safeCalculateTripDaysInPeriod(validTrip, '2023-01-05', '2023-01-31');

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(5); // Jan 5-10 = 6 days, minus 1 for return day credit = 5
      }
    });

    it('should handle partial overlap at end', () => {
      const result = safeCalculateTripDaysInPeriod(validTrip, '2022-12-01', '2023-01-05');

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(4); // Jan 1-5 = 5 days, minus 1 for departure day credit = 4
      }
    });

    it('should return 0 for trip outside period', () => {
      const result = safeCalculateTripDaysInPeriod(validTrip, '2023-02-01', '2023-02-28');

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(0);
      }
    });

    it('should return error for invalid date format', () => {
      const result = safeCalculateTripDaysInPeriod(validTrip, 'January 1, 2023', '2023-01-31');

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(TripValidationError);
      }
    });

    it('should handle end date before start date', () => {
      const result = safeCalculateTripDaysInPeriod(validTrip, '2023-01-31', '2023-01-01');

      // The function might handle this gracefully by returning 0
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(0); // No days in invalid period
      }
    });

    it('should handle options correctly', () => {
      const result = safeCalculateTripDaysInPeriod(validTrip, '2022-12-01', '2023-01-31', {
        includeDepartureDay: false,
        includeReturnDay: false,
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(10); // No travel day credits
      }
    });
  });

  describe('safeCalculateTripDaysInYear', () => {
    it('should return success result for valid inputs', () => {
      const result = safeCalculateTripDaysInYear(validTrip, 2023);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(8); // 10 days - 2 travel days = 8 days abroad
      }
    });

    it('should handle trip spanning multiple years', () => {
      const crossYearTrip = {
        ...validTrip,
        departureDate: '2022-12-20',
        returnDate: '2023-01-10',
      };

      const result2022 = safeCalculateTripDaysInYear(crossYearTrip, 2022);
      const result2023 = safeCalculateTripDaysInYear(crossYearTrip, 2023);

      expect(isOk(result2022)).toBe(true);
      expect(isOk(result2023)).toBe(true);

      if (isOk(result2022)) {
        expect(result2022.data).toBe(11); // Dec 20-31 = 12 days, minus 1 for departure day credit = 11
      }
      if (isOk(result2023)) {
        expect(result2023.data).toBe(9); // Jan 1-10 = 10 days, minus 1 for return day credit = 9
      }
    });

    it('should return 0 for trip in different year', () => {
      const result = safeCalculateTripDaysInYear(validTrip, 2022);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(0);
      }
    });

    it('should return error for invalid year', () => {
      const result = safeCalculateTripDaysInYear(validTrip, 'twenty-twenty-three');

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(TripValidationError);
      }
    });

    it('should return error for year out of range', () => {
      const result = safeCalculateTripDaysInYear(validTrip, 1800);

      expect(isErr(result)).toBe(true);
    });

    it('should handle leap years correctly', () => {
      const leapYearTrip = {
        ...validTrip,
        departureDate: '2024-02-25',
        returnDate: '2024-03-05',
      };

      const result = safeCalculateTripDaysInYear(leapYearTrip, 2024);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(8); // 10 days (Feb 25 - Mar 5) - 2 travel days = 8
      }
    });

    it('should handle decimal year values', () => {
      const result = safeCalculateTripDaysInYear(validTrip, 2023.5);

      expect(isErr(result)).toBe(true);
    });
  });

  describe('Edge Cases and Security Tests', () => {
    it('should reject malicious trip data with prototype pollution', () => {
      const maliciousTrip = {
        ...validTrip,
        __proto__: { isAdmin: true },
        extraProperty: 'should-be-rejected',
      };

      const result = safeCalculateTripDuration(maliciousTrip);

      expect(isErr(result)).toBe(true);
    });

    it('should handle XSS attempts in location', () => {
      const xssTrip = {
        ...validTrip,
        location: '<script>alert("XSS")</script>',
      };

      const result = safeCalculateTripDuration(xssTrip);

      expect(isOk(result)).toBe(true); // Location is optional for duration
    });

    it('should handle SQL injection in date strings', () => {
      const sqlTrip = {
        ...validTrip,
        departureDate: "2023-01-01'; DROP TABLE trips; --",
      };

      const result = safeCalculateTripDuration(sqlTrip);

      expect(isErr(result)).toBe(true);
    });

    it('should validate date strings strictly', () => {
      const invalidDateTrip = {
        ...validTrip,
        departureDate: '2023-1-1', // Missing leading zeros
      };

      const result = safeCalculateTripDuration(invalidDateTrip);

      expect(isErr(result)).toBe(true);
    });

    it('should handle extremely long trip durations', () => {
      const centuryTrip = {
        ...validTrip,
        departureDate: '1923-01-01',
        returnDate: '2023-01-01',
      };

      const result = safeCalculateTripDuration(centuryTrip);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBeGreaterThan(36500); // ~100 years
      }
    });

    it('should handle whitespace in date strings', () => {
      const whitespaceTrip = {
        ...validTrip,
        departureDate: ' 2023-01-01 ',
      };

      const result = safeCalculateTripDuration(whitespaceTrip);

      expect(isErr(result)).toBe(true); // Strict validation should reject
    });

    it('should handle array inputs when expecting single values', () => {
      const result = safeCalculateTripDaysInYear(validTrip, [2023, 2024] as unknown as number);

      expect(isErr(result)).toBe(true);
    });

    it('should handle object inputs for primitive parameters', () => {
      const result = safeCalculateTripDaysInYear(validTrip, { year: 2023 } as unknown as number);

      expect(isErr(result)).toBe(true);
    });

    it('should handle trips with missing required fields', () => {
      const incompleteTrip = {
        id: '123',
        departureDate: '2023-01-01',
        // Missing returnDate and other required fields
      };

      const result = safeCalculateTripDuration(incompleteTrip);

      expect(isErr(result)).toBe(true);
    });
  });
});
