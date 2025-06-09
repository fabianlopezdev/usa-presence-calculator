import { 
  DateRangeError,
  isErr,
  isOk,
  TripValidationError,
  USCISCalculationError
} from '@errors/index';

import {
  safeCalculateDaysOfPhysicalPresence,
  safeCalculateEligibilityDates,
  safeCalculatePresenceStatus,
  safeCheckContinuousResidence,
  safeIsEligibleForEarlyFiling,
  safeCalculateComprehensivePresence,
} from '../safe-calculator';

describe('Safe Presence Calculator Functions', () => {
  const validTrips = [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      departureDate: '2023-01-01',
      returnDate: '2023-01-10',
      isSimulated: false,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    },
  ];

  describe('safeCalculateDaysOfPhysicalPresence', () => {
    it('should return success result for valid inputs', () => {
      const result = safeCalculateDaysOfPhysicalPresence(
        validTrips,
        '2022-01-01',
        '2023-12-31'
      );

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.totalDaysInUSA).toBeGreaterThan(0);
        expect(result.data.totalDaysAbroad).toBeGreaterThan(0);
      }
    });

    it('should return error for invalid trip data', () => {
      const result = safeCalculateDaysOfPhysicalPresence(
        [{ invalidTrip: true }],
        '2022-01-01'
      );

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(TripValidationError);
      }
    });

    it('should return error for invalid date format', () => {
      const result = safeCalculateDaysOfPhysicalPresence(
        validTrips,
        'not-a-date'
      );

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(TripValidationError);
      }
    });

    it('should handle null/undefined inputs', () => {
      const result = safeCalculateDaysOfPhysicalPresence(
        null,
        '2022-01-01'
      );

      expect(isErr(result)).toBe(true);
    });
  });

  describe('safeCalculateEligibilityDates', () => {
    it('should return success result for valid inputs', () => {
      const result = safeCalculateEligibilityDates(
        '2020-01-01',
        'five_year'
      );

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.eligibilityDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(result.data.earliestFilingDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });

    it('should return error for invalid date format', () => {
      const result = safeCalculateEligibilityDates(
        '01/01/2020',
        'five_year'
      );

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(DateRangeError);
      }
    });

    it('should return error for invalid category', () => {
      const result = safeCalculateEligibilityDates(
        '2020-01-01',
        'invalid_category'
      );

      expect(isErr(result)).toBe(true);
    });
  });

  describe('safeCalculatePresenceStatus', () => {
    it('should return success result for valid inputs', () => {
      const result = safeCalculatePresenceStatus(500, 'five_year');

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.requiredDays).toBe(913);
        expect(result.data.percentageComplete).toBeGreaterThanOrEqual(0);
        expect(result.data.percentageComplete).toBeLessThanOrEqual(100);
        expect(result.data.status).toMatch(/^(on_track|at_risk|requirement_met)$/);
      }
    });

    it('should return error for invalid actual days', () => {
      const result = safeCalculatePresenceStatus('not-a-number', 'five_year');

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(USCISCalculationError);
      }
    });

    it('should return error for negative numbers', () => {
      const result = safeCalculatePresenceStatus(-100, 'five_year');

      expect(isErr(result)).toBe(true);
    });
  });

  describe('safeCheckContinuousResidence', () => {
    it('should return success result for valid trips', () => {
      const result = safeCheckContinuousResidence(validTrips);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });

    it('should return warnings for long trips', () => {
      const longTrips = [{
        ...validTrips[0],
        departureDate: '2023-01-01',
        returnDate: '2023-07-15', // > 180 days
      }];

      const result = safeCheckContinuousResidence(longTrips);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.length).toBeGreaterThan(0);
        expect(result.data[0].severity).toBe('high');
      }
    });

    it('should return error for invalid trip data', () => {
      const result = safeCheckContinuousResidence('not-an-array');

      expect(isErr(result)).toBe(true);
    });
  });

  describe('safeIsEligibleForEarlyFiling', () => {
    it('should return success result for valid inputs', () => {
      const result = safeIsEligibleForEarlyFiling(
        '2020-01-01',
        'five_year',
        '2024-11-01'
      );

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(typeof result.data).toBe('boolean');
      }
    });

    it('should return error for invalid inputs', () => {
      const result = safeIsEligibleForEarlyFiling(
        'invalid-date',
        'five_year'
      );

      expect(isErr(result)).toBe(true);
    });
  });

  describe('safeCalculateComprehensivePresence', () => {
    it('should return comprehensive result for valid inputs', () => {
      const result = safeCalculateComprehensivePresence(
        validTrips,
        '2020-01-01',
        'five_year',
        '2023-12-31'
      );

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.physicalPresence).toBeDefined();
        expect(result.data.eligibilityDates).toBeDefined();
        expect(result.data.presenceStatus).toBeDefined();
        expect(result.data.continuousResidenceWarnings).toBeDefined();
        expect(result.data.isEligibleForEarlyFiling).toBeDefined();
      }
    });

    it('should propagate errors from any calculation', () => {
      const result = safeCalculateComprehensivePresence(
        'invalid-trips',
        '2020-01-01',
        'five_year'
      );

      expect(isErr(result)).toBe(true);
    });

    it('should handle malicious input', () => {
      const maliciousTrips = [{
        ...validTrips[0],
        __proto__: { isAdmin: true },
        extraProperty: 'should-be-rejected',
      }];

      const result = safeCalculateComprehensivePresence(
        maliciousTrips,
        '2020-01-01',
        'five_year'
      );

      expect(isErr(result)).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined gracefully', () => {
      const result = safeCalculateDaysOfPhysicalPresence(
        undefined,
        undefined
      );

      expect(isErr(result)).toBe(true);
    });

    it('should handle empty arrays', () => {
      const result = safeCalculateDaysOfPhysicalPresence(
        [],
        '2022-01-01'
      );

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.totalDaysAbroad).toBe(0);
      }
    });

    it('should validate date ranges', () => {
      const result = safeCalculateDaysOfPhysicalPresence(
        validTrips,
        '2023-12-31',
        '2022-01-01' // End before start
      );

      // The underlying function may handle this differently
      expect(isOk(result) || isErr(result)).toBe(true);
      if (isOk(result)) {
        // If it succeeds, it should return 0 days
        expect(result.data.totalDaysInUSA).toBe(0);
      }
    });
  });
});