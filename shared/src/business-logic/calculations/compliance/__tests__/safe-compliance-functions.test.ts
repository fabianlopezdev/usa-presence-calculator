import { DateRangeError, isErr, isOk } from '@errors/index';

import {
  safeCalculateRemovalOfConditionsStatus,
  safeCalculateGreenCardRenewalStatus,
  safeCalculateSelectiveServiceStatus,
  safeCalculateTaxReminderStatus,
} from '../safe-compliance-functions';

describe('Safe Compliance Functions', () => {
  describe('safeCalculateRemovalOfConditionsStatus', () => {
    it('should return success result for valid conditional resident', () => {
      const result = safeCalculateRemovalOfConditionsStatus(true, '2022-01-01', '2023-12-31');

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toHaveProperty('applies');
        expect(result.data).toHaveProperty('filingWindowStart');
        expect(result.data).toHaveProperty('filingWindowEnd');
        expect(result.data).toHaveProperty('currentStatus');
      }
    });

    it('should return success for non-conditional resident', () => {
      const result = safeCalculateRemovalOfConditionsStatus(false, '2022-01-01');

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.applies).toBe(false);
      }
    });

    it('should return error for invalid date format', () => {
      const result = safeCalculateRemovalOfConditionsStatus(
        true,
        '01/01/2022', // Invalid format
      );

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(DateRangeError);
      }
    });

    it('should return error for invalid boolean value', () => {
      const result = safeCalculateRemovalOfConditionsStatus(
        'yes', // Should be boolean
        '2022-01-01',
      );

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(DateRangeError);
      }
    });

    it('should handle null/undefined inputs', () => {
      const result = safeCalculateRemovalOfConditionsStatus(null, undefined);

      expect(isErr(result)).toBe(true);
    });

    it('should reject malicious input with extra properties', () => {
      const maliciousInput = {
        isConditionalResident: true,
        __proto__: { isAdmin: true },
        extraProperty: 'should-be-rejected',
      };

      const result = safeCalculateRemovalOfConditionsStatus(maliciousInput, '2022-01-01');

      expect(isErr(result)).toBe(true);
    });
  });

  describe('safeCalculateGreenCardRenewalStatus', () => {
    it('should return success result for valid inputs', () => {
      const result = safeCalculateGreenCardRenewalStatus('2020-01-01', '2023-12-31');

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toHaveProperty('currentStatus');
        expect(result.data).toHaveProperty('expirationDate');
        expect(result.data).toHaveProperty('renewalWindowStart');
        expect(result.data).toHaveProperty('monthsUntilExpiration');
        expect(result.data).toHaveProperty('isInRenewalWindow');
      }
    });

    it('should return error for invalid date format', () => {
      const result = safeCalculateGreenCardRenewalStatus(
        'January 1, 2020', // Invalid format
      );

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(DateRangeError);
      }
    });

    it('should handle future green card date', () => {
      const result = safeCalculateGreenCardRenewalStatus('2025-01-01', '2023-12-31');

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.currentStatus).toBe('valid');
      }
    });

    it('should handle whitespace-only strings', () => {
      const result = safeCalculateGreenCardRenewalStatus('   ', '2023-12-31');

      expect(isErr(result)).toBe(true);
    });

    it('should handle date range (current date before expiration date)', () => {
      const result = safeCalculateGreenCardRenewalStatus(
        '2023-01-01',
        '2022-01-01', // Current date before expiration date
      );

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.currentStatus).toBe('valid');
        expect(result.data.monthsUntilExpiration).toBeGreaterThan(0);
      }
    });
  });

  describe('safeCalculateSelectiveServiceStatus', () => {
    it('should return success result for valid male user', () => {
      const result = safeCalculateSelectiveServiceStatus(
        '2000-01-01',
        'male',
        false, // isSelectiveServiceRegistered
        '2023-12-31',
      );

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toHaveProperty('currentStatus');
        expect(result.data).toHaveProperty('registrationRequired');
        expect(result.data).toHaveProperty('applies');
      }
    });

    it('should return success result for female user', () => {
      const result = safeCalculateSelectiveServiceStatus('2000-01-01', 'female');

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.currentStatus).toBe('not_applicable');
        expect(result.data.registrationRequired).toBe(false);
      }
    });

    it('should return error for invalid date format', () => {
      const result = safeCalculateSelectiveServiceStatus(
        '2000-01-01T00:00:00Z', // Invalid format (should be YYYY-MM-DD)
        'male',
      );

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(DateRangeError);
      }
    });

    it('should return error for invalid gender', () => {
      const result = safeCalculateSelectiveServiceStatus(
        '2000-01-01',
        'unknown', // Invalid gender
      );

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(DateRangeError);
      }
    });

    it('should handle non-string gender values', () => {
      const result = safeCalculateSelectiveServiceStatus(
        '2000-01-01',
        123, // Should be string
      );

      expect(isErr(result)).toBe(true);
    });

    it('should validate age calculations for edge cases', () => {
      // Test someone who just turned 18
      const result = safeCalculateSelectiveServiceStatus(
        '2005-12-31',
        'male',
        false, // isSelectiveServiceRegistered
        '2024-01-01', // Just turned 18 yesterday
      );

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.currentStatus).toBe('must_register');
        expect(result.data.registrationRequired).toBe(true);
      }
    });
  });

  describe('safeCalculateTaxReminderStatus', () => {
    it('should return success result for valid inputs', () => {
      const validTrips = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          userId: '123e4567-e89b-12d3-a456-426614174001',
          departureDate: '2024-03-01',
          returnDate: '2024-05-01',
          location: 'Canada',
          isSimulated: false,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
      ];

      const result = safeCalculateTaxReminderStatus(validTrips, false, '2023-12-31');

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toHaveProperty('nextDeadline');
        expect(result.data).toHaveProperty('daysUntilDeadline');
        expect(result.data).toHaveProperty('isAbroadDuringTaxSeason');
        expect(result.data).toHaveProperty('reminderDismissed');
        expect(result.data).toHaveProperty('applicableDeadline');
        expect(result.data).toHaveProperty('actualDeadline');
      }
    });

    it('should handle dismissed reminders', () => {
      const result = safeCalculateTaxReminderStatus(
        [],
        true, // dismissed
        '2023-12-31',
      );

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.reminderDismissed).toBe(true);
      }
    });

    it('should return error for invalid trips', () => {
      const result = safeCalculateTaxReminderStatus(
        'not-an-array', // Invalid trips
        false,
      );

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(DateRangeError);
      }
    });

    it('should return error for invalid date format', () => {
      const result = safeCalculateTaxReminderStatus(
        [],
        false,
        '2020/01/01', // Invalid format
      );

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(DateRangeError);
      }
    });

    it('should handle SQL injection attempts', () => {
      const maliciousTrips = [
        {
          id: "'; DROP TABLE users; --",
          userId: '123',
          departureDate: '2023-01-01',
          returnDate: '2023-01-10',
          location: 'Canada',
          isSimulated: false,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
      ];

      const result = safeCalculateTaxReminderStatus(maliciousTrips, false);

      expect(isErr(result)).toBe(true);
    });

    it('should handle invalid boolean for dismissed', () => {
      const result = safeCalculateTaxReminderStatus(
        [],
        'yes', // Should be boolean
        '2023-12-31',
      );

      expect(isErr(result)).toBe(true);
    });
  });

  describe('Edge Cases and Security Tests', () => {
    it('should handle prototype pollution attempts', () => {
      const maliciousGreenCardDate = Object.create(null);
      maliciousGreenCardDate.toString = () => '2020-01-01';
      maliciousGreenCardDate.__proto__ = { isAdmin: true };

      const result = safeCalculateGreenCardRenewalStatus(maliciousGreenCardDate, '2023-12-31');

      expect(isErr(result)).toBe(true);
    });

    it('should handle XSS attempts in string inputs', () => {
      const xssAttempt = '<script>alert("XSS")</script>2020-01-01';

      const result = safeCalculateGreenCardRenewalStatus(xssAttempt, '2023-12-31');

      expect(isErr(result)).toBe(true);
    });

    it('should handle extremely large dates', () => {
      const result = safeCalculateGreenCardRenewalStatus('9999-12-31', '2023-12-31');

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.currentStatus).toBe('valid');
        expect(result.data.monthsUntilExpiration).toBeGreaterThan(0);
      }
    });

    it('should handle negative years', () => {
      const result = safeCalculateSelectiveServiceStatus('-2000-01-01', 'male');

      expect(isErr(result)).toBe(true);
    });

    it('should handle object inputs when expecting primitives', () => {
      const result = safeCalculateRemovalOfConditionsStatus({ valueOf: () => true }, '2022-01-01');

      expect(isErr(result)).toBe(true);
    });

    it('should handle array inputs when expecting single values', () => {
      const result = safeCalculateTaxReminderStatus(['five_year', 'three_year'], '2020-01-01');

      expect(isErr(result)).toBe(true);
    });
  });
});
