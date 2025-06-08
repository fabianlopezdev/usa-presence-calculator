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

  describe('Expiration Date Anomalies', () => {
    it('should handle never-expiring green cards (far future dates)', () => {
      const result = calculateGreenCardRenewalStatus('9999-12-31', '2024-01-01');

      expect(result.currentStatus).toBe('valid');
      expect(result.monthsUntilExpiration).toBeGreaterThan(90000); // Very far future (7500+ years)
      expect(result.isInRenewalWindow).toBe(false);
    });

    it('should handle green card already expired at current date', () => {
      const expirationDate = '2023-01-01';
      const currentDate = '2024-01-01';

      const result = calculateGreenCardRenewalStatus(expirationDate, currentDate);

      expect(result.currentStatus).toBe('expired');
      expect(result.monthsUntilExpiration).toBe(-12);
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

    it('should handle expiration date before renewal window calculation', () => {
      const expirationDate = '2024-03-01';
      const currentDate = '2024-02-15';

      const result = calculateGreenCardRenewalStatus(expirationDate, currentDate);

      expect(result.currentStatus).toBe('renewal_urgent');
      expect(result.monthsUntilExpiration).toBe(0);
      expect(result.renewalWindowStart).toBe('2023-09-01');
    });
  });

  describe('Renewal Window Edge Cases', () => {
    it('should handle renewal window start on Feb 29', () => {
      const expirationDate = '2024-08-29'; // 6 months before is Feb 29
      const currentDate = '2024-02-29';

      const result = calculateGreenCardRenewalStatus(expirationDate, currentDate);

      expect(result.renewalWindowStart).toBe('2024-02-29');
      expect(result.isInRenewalWindow).toBe(true);
      expect(result.currentStatus).toBe('renewal_recommended');
    });

    it('should handle renewal window start on non-leap year Feb 29', () => {
      const expirationDate = '2023-08-29'; // 6 months before would be Feb 29 (non-leap)
      const currentDate = '2023-02-28';

      const result = calculateGreenCardRenewalStatus(expirationDate, currentDate);

      expect(result.renewalWindowStart).toBe('2023-02-28'); // Adjusted to Feb 28
      expect(result.isInRenewalWindow).toBe(true);
    });

    it('should handle multiple renewal scenarios', () => {
      const expirationDate = '2024-12-31';

      // Check different points in time
      const beforeWindow = calculateGreenCardRenewalStatus(expirationDate, '2024-06-30');
      expect(beforeWindow.isInRenewalWindow).toBe(true); // Actually in window (6 months = June 30)
      expect(beforeWindow.currentStatus).toBe('renewal_recommended');

      const atWindowStart = calculateGreenCardRenewalStatus(expirationDate, '2024-07-01');
      expect(atWindowStart.isInRenewalWindow).toBe(true);
      expect(atWindowStart.currentStatus).toBe('renewal_recommended');

      const nearExpiration = calculateGreenCardRenewalStatus(expirationDate, '2024-11-01');
      expect(nearExpiration.isInRenewalWindow).toBe(true);
      expect(nearExpiration.currentStatus).toBe('renewal_urgent');
    });

    it('should handle 2-year conditional card renewal', () => {
      // Conditional cards are valid for 2 years instead of 10
      const twoYearCard = '2024-06-01';
      const currentDate = '2024-01-01';

      const result = calculateGreenCardRenewalStatus(twoYearCard, currentDate);

      expect(result.isInRenewalWindow).toBe(true);
      expect(result.currentStatus).toBe('renewal_recommended');
      expect(result.monthsUntilExpiration).toBe(5);
    });
  });

  describe('Date Calculation Extremes', () => {
    it('should handle month-end anomalies for Jan 31', () => {
      const expirationDate = '2024-01-31';
      const currentDate = '2023-07-31'; // Exactly 6 months

      const result = calculateGreenCardRenewalStatus(expirationDate, currentDate);

      expect(result.renewalWindowStart).toBe('2023-07-31');
      expect(result.isInRenewalWindow).toBe(true);
      expect(result.monthsUntilExpiration).toBe(6);
    });

    it('should handle February 28/29 renewal calculations', () => {
      // Expiring on Aug 31, window starts Feb 28/29
      const expirationDate = '2024-08-31';
      const currentDate = '2024-02-29'; // Leap year

      const result = calculateGreenCardRenewalStatus(expirationDate, currentDate);

      expect(result.renewalWindowStart).toBe('2024-02-29');
      expect(result.monthsUntilExpiration).toBe(6);
    });

    it('should handle fractional month calculations at boundaries', () => {
      // Test 5.99 months (still medium urgency)
      const expirationDate = '2024-07-01';
      const currentDate = '2024-01-02'; // Just over 5 months

      const result = calculateGreenCardRenewalStatus(expirationDate, currentDate);

      expect(result.monthsUntilExpiration).toBe(5);
      expect(result.currentStatus).toBe('renewal_recommended');
    });

    it('should handle exact urgency thresholds', () => {
      const expirationDate = '2024-03-01';

      // Exactly 2 months - should be medium urgency
      const twoMonths = calculateGreenCardRenewalStatus(expirationDate, '2024-01-01');
      expect(twoMonths.monthsUntilExpiration).toBe(2);
      expect(twoMonths.currentStatus).toBe('renewal_recommended');

      // Less than 2 months - should be high urgency
      const lessThanTwo = calculateGreenCardRenewalStatus(expirationDate, '2024-01-02');
      expect(lessThanTwo.monthsUntilExpiration).toBe(1);
      expect(lessThanTwo.currentStatus).toBe('renewal_urgent');
    });
  });

  describe('Urgency Calculation Edge Cases', () => {
    it('should handle urgency transitions correctly', () => {
      const expirationDate = '2024-07-15';

      // Test urgency at different time points
      expect(getRenewalUrgency(expirationDate, '2024-01-15')).toBe('low');
      expect(getRenewalUrgency(expirationDate, '2024-03-15')).toBe('low');
      expect(getRenewalUrgency(expirationDate, '2024-05-15')).toBe('medium');
      expect(getRenewalUrgency(expirationDate, '2024-06-15')).toBe('high');
      expect(getRenewalUrgency(expirationDate, '2024-08-15')).toBe('critical');
    });

    it('should handle negative months correctly', () => {
      const expirationDate = '2020-01-01';
      const currentDate = '2024-01-01';

      const months = getMonthsUntilExpiration(expirationDate, currentDate);
      expect(months).toBe(-48); // 4 years expired

      const urgency = getRenewalUrgency(expirationDate, currentDate);
      expect(urgency).toBe('critical');
    });
  });

  describe('Renewal Window Start Date Edge Cases', () => {
    it('should handle window start crossing year boundaries', () => {
      const expirationDate = '2024-03-15';

      const windowStart = getRenewalWindowStartDate(expirationDate);
      expect(windowStart).toBe('2023-09-15'); // Previous year
    });

    it('should handle window start on month boundaries', () => {
      // March 31 - 6 months = Sept 30
      const march31 = getRenewalWindowStartDate('2024-03-31');
      expect(march31).toBe('2023-09-30');

      // May 31 - 6 months = Nov 30 (not 31)
      const may31 = getRenewalWindowStartDate('2024-05-31');
      expect(may31).toBe('2023-11-30');

      // Aug 31 - 6 months = Feb 28/29
      const aug31Leap = getRenewalWindowStartDate('2024-08-31');
      expect(aug31Leap).toBe('2024-02-29'); // Leap year

      const aug31NonLeap = getRenewalWindowStartDate('2023-08-31');
      expect(aug31NonLeap).toBe('2023-02-28'); // Non-leap year
    });
  });

  describe('System Clock and Timezone Edge Cases', () => {
    it('should handle calculations at year boundaries', () => {
      const expirationDate = '2025-01-01';
      const currentDate = '2024-12-31';

      const result = calculateGreenCardRenewalStatus(expirationDate, currentDate);

      expect(result.monthsUntilExpiration).toBe(0);
      expect(result.currentStatus).toBe('renewal_urgent');
      expect(result.isInRenewalWindow).toBe(true);
    });

    it('should handle calculations during DST transitions', () => {
      // Test during spring forward (March 2024)
      const expirationDate = '2024-09-10';
      const currentDate = '2024-03-10'; // DST starts

      const result = calculateGreenCardRenewalStatus(expirationDate, currentDate);

      expect(result.isInRenewalWindow).toBe(true);
      expect(result.monthsUntilExpiration).toBe(6);
    });
  });

  describe('Invalid Input Handling', () => {
    it('should handle null or undefined dates gracefully', () => {
      expect(() => {
        calculateGreenCardRenewalStatus(null as unknown as string, '2024-01-01');
      }).toThrow();

      // The function uses a default current date when undefined is passed
      const result = calculateGreenCardRenewalStatus('2024-01-01', undefined as unknown as string);
      expect(result).toBeDefined();
      expect(result.expirationDate).toBe('2024-01-01');
    });

    it('should handle malformed date strings', () => {
      expect(() => {
        calculateGreenCardRenewalStatus('2024-13-01', '2024-01-01'); // Invalid month
      }).toThrow();

      expect(() => {
        calculateGreenCardRenewalStatus('2024-02-30', '2024-01-01'); // Invalid day
      }).toThrow();
    });

    it('should handle empty string dates', () => {
      expect(() => {
        calculateGreenCardRenewalStatus('', '2024-01-01');
      }).toThrow();
    });
  });
});
