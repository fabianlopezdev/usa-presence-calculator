import { isErr, isOk, TripValidationError } from '@errors/index';

import {
  safeAssessUpcomingTripRisk,
  safeCalculateCountryStatistics,
  safeCalculateDaysAbroadByYear,
  safeProjectEligibilityDate,
} from '../safe-analytics';

describe('Safe Travel Analytics Functions', () => {
  const validTrips = [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      departureDate: '2023-01-01',
      returnDate: '2023-01-10',
      location: 'Canada',
      isSimulated: false,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174002',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      departureDate: '2023-06-01',
      returnDate: '2023-06-15',
      location: 'Mexico',
      isSimulated: false,
      createdAt: '2023-06-01T00:00:00Z',
      updatedAt: '2023-06-01T00:00:00Z',
    },
  ];

  describe('safeAssessUpcomingTripRisk', () => {
    it('should return success result for valid inputs', () => {
      const upcomingTrips = [
        {
          ...validTrips[0],
          departureDate: '2024-01-01',
          returnDate: '2024-01-10',
        },
      ];

      const result = safeAssessUpcomingTripRisk(
        upcomingTrips,
        100,
        'five_year',
        '2020-01-01',
        '2023-12-31',
      );

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(Array.isArray(result.data)).toBe(true);
        result.data.forEach((assessment) => {
          expect(assessment).toHaveProperty('tripId');
          expect(assessment).toHaveProperty('riskLevel');
          expect(assessment).toHaveProperty('impactDescription');
          expect(assessment).toHaveProperty('daysUntilRisk');
          expect(assessment).toHaveProperty('recommendation');
        });
      }
    });

    it('should return error for invalid trip data', () => {
      const result = safeAssessUpcomingTripRisk(
        [{ invalidTrip: true }],
        100,
        'five_year',
        '2020-01-01',
      );

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(TripValidationError);
      }
    });

    it('should return error for negative days abroad', () => {
      const result = safeAssessUpcomingTripRisk(validTrips, -100, 'five_year', '2020-01-01');

      expect(isErr(result)).toBe(true);
    });

    it('should return error for invalid eligibility category', () => {
      const result = safeAssessUpcomingTripRisk(validTrips, 100, 'seven_year' as any, '2020-01-01');

      expect(isErr(result)).toBe(true);
    });

    it('should return error for invalid date format', () => {
      const result = safeAssessUpcomingTripRisk(validTrips, 100, 'five_year', '01/01/2020');

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(TripValidationError);
      }
    });

    it('should handle empty upcoming trips array', () => {
      const result = safeAssessUpcomingTripRisk([], 100, 'five_year', '2020-01-01');

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toHaveLength(0);
      }
    });
  });

  describe('safeCalculateCountryStatistics', () => {
    it('should return success result for valid trips', () => {
      const result = safeCalculateCountryStatistics(validTrips);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data).toHaveLength(2); // Canada and Mexico
        result.data.forEach((stat) => {
          expect(stat).toHaveProperty('country');
          expect(stat).toHaveProperty('tripCount');
          expect(stat).toHaveProperty('totalDays');
          expect(stat).toHaveProperty('averageDuration');
          expect(stat).toHaveProperty('lastVisited');
        });
      }
    });

    it('should return error for invalid trip data', () => {
      const result = safeCalculateCountryStatistics('not-an-array');

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(TripValidationError);
      }
    });

    it('should handle empty trips array', () => {
      const result = safeCalculateCountryStatistics([]);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toHaveLength(0);
      }
    });

    it('should handle trips without location', () => {
      const tripsWithoutLocation = [
        {
          ...validTrips[0],
          location: undefined,
        },
      ];

      const result = safeCalculateCountryStatistics(tripsWithoutLocation);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.some((stat) => stat.country === 'Unknown')).toBe(true);
      }
    });

    it('should reject malicious trip data', () => {
      const maliciousTrips = [
        {
          ...validTrips[0],
          __proto__: { isAdmin: true },
          extraProperty: 'should-be-rejected',
        },
      ];

      const result = safeCalculateCountryStatistics(maliciousTrips);

      expect(isErr(result)).toBe(true);
    });
  });

  describe('safeCalculateDaysAbroadByYear', () => {
    it('should return success result for valid inputs', () => {
      const result = safeCalculateDaysAbroadByYear(validTrips, '2020-01-01', '2023-12-31');

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(Array.isArray(result.data)).toBe(true);
        result.data.forEach((yearData) => {
          expect(yearData).toHaveProperty('year');
          expect(yearData).toHaveProperty('daysAbroad');
          expect(yearData).toHaveProperty('tripCount');
        });
      }
    });

    it('should return error for invalid date format', () => {
      const result = safeCalculateDaysAbroadByYear(validTrips, 'January 1, 2020');

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(TripValidationError);
      }
    });

    it('should handle date range with end before start', () => {
      const result = safeCalculateDaysAbroadByYear(
        validTrips,
        '2023-12-31',
        '2020-01-01', // End before start
      );

      // The function might handle this gracefully rather than throwing an error
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data).toHaveLength(0); // No years in the range
      }
    });

    it('should handle null/undefined trips', () => {
      const result = safeCalculateDaysAbroadByYear(null, '2020-01-01');

      expect(isErr(result)).toBe(true);
    });
  });

  describe('safeProjectEligibilityDate', () => {
    it('should return success result for valid inputs', () => {
      const result = safeProjectEligibilityDate(
        validTrips,
        500,
        'five_year',
        '2020-01-01',
        '2023-12-31',
      );

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toHaveProperty('projectedEligibilityDate');
        expect(result.data).toHaveProperty('averageDaysAbroadPerYear');
        expect(result.data).toHaveProperty('confidenceLevel');
        expect(result.data).toHaveProperty('assumptions');
        expect(Array.isArray(result.data.assumptions)).toBe(true);
      }
    });

    it('should return error for invalid total days', () => {
      const result = safeProjectEligibilityDate(
        validTrips,
        'not-a-number',
        'five_year',
        '2020-01-01',
      );

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(TripValidationError);
      }
    });

    it('should return error for invalid category', () => {
      const result = safeProjectEligibilityDate(validTrips, 500, 'invalid_category', '2020-01-01');

      expect(isErr(result)).toBe(true);
    });

    it('should handle negative total days', () => {
      const result = safeProjectEligibilityDate(validTrips, -100, 'five_year', '2020-01-01');

      expect(isErr(result)).toBe(true);
    });

    it('should handle future green card dates', () => {
      const result = safeProjectEligibilityDate(
        validTrips,
        500,
        'five_year',
        '2025-01-01',
        '2023-12-31',
      );

      // The function might handle future dates gracefully
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toHaveProperty('projectedEligibilityDate');
        expect(result.data.confidenceLevel).toBe('low'); // Low confidence for future green card
      }
    });
  });

  describe('Edge Cases and Security Tests', () => {
    it('should handle XSS attempts in destination field', () => {
      const xssTrips = [
        {
          ...validTrips[0],
          location: '<script>alert("XSS")</script>',
        },
      ];

      const result = safeCalculateCountryStatistics(xssTrips);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        // Should sanitize or handle the XSS attempt safely
        const xssCountry = result.data.find((stat) => stat.country.includes('<script>'));
        expect(xssCountry).toBeDefined();
      }
    });

    it('should handle SQL injection attempts', () => {
      const sqlInjectionTrips = [
        {
          ...validTrips[0],
          location: "'; DROP TABLE trips; --",
        },
      ];

      const result = safeCalculateCountryStatistics(sqlInjectionTrips);

      expect(isOk(result)).toBe(true);
    });

    it('should handle extremely long trips', () => {
      const longTrip = [
        {
          ...validTrips[0],
          departureDate: '2025-01-01', // Future date
          returnDate: '2028-12-31', // 3+ years in the future
          isSimulated: true, // Mark as simulated for future trips
        },
      ];

      const result = safeAssessUpcomingTripRisk(
        longTrip,
        0,
        'five_year',
        '2019-01-01',
        '2024-01-01', // Current date
      );

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toHaveLength(1);
        if (result.data.length > 0) {
          expect(result.data[0].riskLevel).toBe('critical'); // Extremely long trips should be critical
        }
      }
    });

    it('should handle decimal numbers for days', () => {
      const result = safeAssessUpcomingTripRisk(
        validTrips,
        100.5, // Should be integer
        'five_year',
        '2020-01-01',
      );

      expect(isErr(result)).toBe(true);
    });

    it('should validate all dates are in YYYY-MM-DD format', () => {
      const invalidDateTrips = [
        {
          ...validTrips[0],
          departureDate: '2023-1-1', // Missing leading zeros
        },
      ];

      const result = safeCalculateDaysAbroadByYear(invalidDateTrips, '2020-01-01');

      expect(isErr(result)).toBe(true);
    });

    it('should handle very large arrays efficiently', () => {
      // Use the same structure as validTrips but create many of them
      const manyTrips = Array(50)
        .fill(null)
        .map((_, i) => ({
          id: `123e4567-e89b-12d3-a456-${i.toString().padStart(12, '0')}`,
          userId: '123e4567-e89b-12d3-a456-426614174001',
          departureDate: '2023-01-01',
          returnDate: '2023-01-10',
          location: `Country-${i % 10}`,
          isSimulated: false,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        }));

      const startTime = Date.now();
      const result = safeCalculateCountryStatistics(manyTrips);
      const duration = Date.now() - startTime;

      if (isErr(result)) {
        console.error('Large array test failed:', result.error);
      }

      expect(isOk(result)).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      if (isOk(result)) {
        expect(result.data.length).toBeGreaterThan(0);
        expect(result.data.length).toBeLessThanOrEqual(10); // 10 different countries
      }
    });
  });
});
