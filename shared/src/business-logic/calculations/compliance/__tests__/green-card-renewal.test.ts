/**
 * Tests for Green Card Renewal Tracker
 *
 * Tests the calculation of renewal windows and status tracking for
 * green card expiration and renewal recommendations
 */

// External dependencies
// None needed for tests

// Internal dependencies - Schemas & Types
// None needed for tests

// Internal dependencies - Business Logic
import {
  calculateGreenCardRenewalStatus,
  getMonthsUntilExpiration,
  isInRenewalWindow,
  getRenewalUrgency,
  getRenewalWindowStartDate,
} from '@business-logic/calculations/compliance/green-card-renewal';

describe('Green Card Renewal Tracker', () => {
  describe('calculateGreenCardRenewalStatus', () => {
    it('should calculate valid status when far from expiration', () => {
      const expirationDate = '2030-01-01';
      const currentDate = '2024-01-01';

      const result = calculateGreenCardRenewalStatus(expirationDate, currentDate);

      expect(result.expirationDate).toBe('2030-01-01');
      expect(result.renewalWindowStart).toBe('2029-07-01'); // 6 months before
      expect(result.currentStatus).toBe('valid');
      expect(result.monthsUntilExpiration).toBe(72); // 6 years
      expect(result.isInRenewalWindow).toBe(false);
    });

    it('should identify renewal recommended status', () => {
      const expirationDate = '2024-07-01';
      const currentDate = '2024-02-01'; // Within 6-month window

      const result = calculateGreenCardRenewalStatus(expirationDate, currentDate);

      expect(result.currentStatus).toBe('renewal_recommended');
      expect(result.monthsUntilExpiration).toBe(5);
      expect(result.isInRenewalWindow).toBe(true);
    });

    it('should identify renewal urgent status', () => {
      const expirationDate = '2024-03-01';
      const currentDate = '2024-01-15'; // Less than 2 months

      const result = calculateGreenCardRenewalStatus(expirationDate, currentDate);

      expect(result.currentStatus).toBe('renewal_urgent');
      expect(result.monthsUntilExpiration).toBe(1);
      expect(result.isInRenewalWindow).toBe(true);
    });

    it('should identify expired status', () => {
      const expirationDate = '2023-12-01';
      const currentDate = '2024-01-01';

      const result = calculateGreenCardRenewalStatus(expirationDate, currentDate);

      expect(result.currentStatus).toBe('expired');
      expect(result.monthsUntilExpiration).toBe(-1);
      expect(result.isInRenewalWindow).toBe(true); // Still needs renewal
    });

    it('should handle same-day expiration', () => {
      const expirationDate = '2024-01-01';
      const currentDate = '2024-01-01';

      const result = calculateGreenCardRenewalStatus(expirationDate, currentDate);

      expect(result.currentStatus).toBe('renewal_urgent');
      expect(result.monthsUntilExpiration).toBe(0);
      expect(result.isInRenewalWindow).toBe(true);
    });

    it('should use current date when not provided', () => {
      const expirationDate = '2030-01-01';

      const result = calculateGreenCardRenewalStatus(expirationDate);

      expect(result).toBeDefined();
      expect(result.expirationDate).toBe('2030-01-01');
      expect(result.currentStatus).toBe('valid');
    });
  });

  describe('getMonthsUntilExpiration', () => {
    it('should calculate positive months when before expiration', () => {
      const months = getMonthsUntilExpiration('2025-01-01', '2024-01-01');
      expect(months).toBe(12);
    });

    it('should calculate partial months correctly', () => {
      const months = getMonthsUntilExpiration('2024-03-15', '2024-01-01');
      expect(months).toBe(2); // Jan to March
    });

    it('should return 0 for same month', () => {
      const months = getMonthsUntilExpiration('2024-01-15', '2024-01-01');
      expect(months).toBe(0);
    });

    it('should return negative months when expired', () => {
      const months = getMonthsUntilExpiration('2023-01-01', '2024-01-01');
      expect(months).toBe(-12);
    });

    it('should handle month boundaries correctly', () => {
      const months = getMonthsUntilExpiration('2024-02-01', '2024-01-31');
      expect(months).toBe(0); // Same month boundary
    });
  });

  describe('isInRenewalWindow', () => {
    it('should return false when before renewal window', () => {
      const result = isInRenewalWindow('2025-01-01', '2024-01-01');
      expect(result).toBe(false);
    });

    it('should return true when exactly at window start', () => {
      const result = isInRenewalWindow('2024-07-01', '2024-01-01');
      expect(result).toBe(true); // Exactly 6 months
    });

    it('should return true when within window', () => {
      const result = isInRenewalWindow('2024-06-01', '2024-03-01');
      expect(result).toBe(true);
    });

    it('should return true even after expiration', () => {
      const result = isInRenewalWindow('2023-01-01', '2024-01-01');
      expect(result).toBe(true); // Still need to renew
    });
  });

  describe('getRenewalUrgency', () => {
    it('should return none when more than 6 months away', () => {
      const urgency = getRenewalUrgency('2025-01-01', '2024-01-01');
      expect(urgency).toBe('none');
    });

    it('should return low when 4-6 months away', () => {
      const urgency = getRenewalUrgency('2024-06-01', '2024-01-01');
      expect(urgency).toBe('low');
    });

    it('should return medium when 2-4 months away', () => {
      const urgency = getRenewalUrgency('2024-04-01', '2024-01-01');
      expect(urgency).toBe('medium');
    });

    it('should return high when less than 2 months', () => {
      const urgency = getRenewalUrgency('2024-02-15', '2024-01-01');
      expect(urgency).toBe('high');
    });

    it('should return critical when expired', () => {
      const urgency = getRenewalUrgency('2023-12-01', '2024-01-01');
      expect(urgency).toBe('critical');
    });

    it('should handle exact boundaries', () => {
      // Exactly 6 months
      expect(getRenewalUrgency('2024-07-01', '2024-01-01')).toBe('low');

      // Exactly 4 months
      expect(getRenewalUrgency('2024-05-01', '2024-01-01')).toBe('low');

      // Exactly 2 months
      expect(getRenewalUrgency('2024-03-01', '2024-01-01')).toBe('medium');
    });
  });

  describe('getRenewalWindowStartDate', () => {
    it('should calculate 6 months before expiration', () => {
      const windowStart = getRenewalWindowStartDate('2024-12-31');
      expect(windowStart).toBe('2024-06-30'); // June 30, 6 months before Dec 31
    });

    it('should handle leap year dates', () => {
      const windowStart = getRenewalWindowStartDate('2024-08-29');
      expect(windowStart).toBe('2024-02-29'); // Feb 29 in leap year
    });

    it('should handle non-leap year adjustment', () => {
      const windowStart = getRenewalWindowStartDate('2023-08-29');
      expect(windowStart).toBe('2023-02-28'); // Feb 28 in non-leap year
    });

    it('should handle month boundaries', () => {
      const windowStart = getRenewalWindowStartDate('2024-03-31');
      expect(windowStart).toBe('2023-09-30'); // Sept has 30 days
    });
  });

  describe('Edge Cases', () => {
    it('should handle far future expiration dates', () => {
      const result = calculateGreenCardRenewalStatus('2040-01-01', '2024-01-01');

      expect(result.currentStatus).toBe('valid');
      expect(result.monthsUntilExpiration).toBe(192); // 16 years
    });

    it('should handle very expired cards', () => {
      const result = calculateGreenCardRenewalStatus('2020-01-01', '2024-01-01');

      expect(result.currentStatus).toBe('expired');
      expect(result.monthsUntilExpiration).toBe(-48); // 4 years ago
    });

    it('should handle invalid date formats gracefully', () => {
      // This test expects the function to handle errors appropriately
      expect(() => {
        calculateGreenCardRenewalStatus('invalid-date', '2024-01-01');
      }).toThrow();
    });

    it('should handle renewal window crossing year boundaries', () => {
      const result = calculateGreenCardRenewalStatus('2024-03-01', '2023-10-01');

      expect(result.renewalWindowStart).toBe('2023-09-01');
      expect(result.isInRenewalWindow).toBe(true);
      expect(result.monthsUntilExpiration).toBe(5);
    });
  });
});
