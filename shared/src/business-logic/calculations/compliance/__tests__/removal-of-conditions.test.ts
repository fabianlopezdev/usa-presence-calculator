/**
 * Tests for Removal of Conditions (Form I-751) Calculator
 *
 * Tests the calculation of filing windows and status tracking for
 * conditional permanent residents who need to file Form I-751
 */

// External dependencies
// None needed for tests

// Internal dependencies - Schemas & Types
// None needed for tests

// Internal dependencies - Business Logic
import {
  calculateRemovalOfConditionsStatus,
  getDaysUntilFilingWindow,
  isInFilingWindow,
  getFilingWindowDates,
  getRemovalOfConditionsDeadline,
} from '@business-logic/calculations/compliance/removal-of-conditions';

describe('Removal of Conditions Calculator', () => {
  describe('calculateRemovalOfConditionsStatus', () => {
    it('should return null for permanent residents', () => {
      const result = calculateRemovalOfConditionsStatus(
        false, // not conditional
        '2022-01-01',
        '2023-06-01',
      );

      expect(result).toBeNull();
    });

    it('should calculate correct status when before filing window', () => {
      const greenCardDate = '2022-01-01';
      const currentDate = '2023-06-01'; // 1.5 years later

      const result = calculateRemovalOfConditionsStatus(true, greenCardDate, currentDate);

      expect(result).toBeDefined();
      expect(result?.applies).toBe(true);
      expect(result?.currentStatus).toBe('not_yet');
      expect(result?.filingWindowStart).toBe('2023-10-03'); // 90 days before 2-year anniversary
      expect(result?.filingWindowEnd).toBe('2024-01-01'); // 2-year anniversary
      expect(result?.daysUntilWindow).toBe(124); // Days from June 1 to Oct 3
      expect(result?.daysUntilDeadline).toBe(214); // Days from June 1 to Jan 1
    });

    it('should identify when in filing window', () => {
      const greenCardDate = '2022-01-01';
      const currentDate = '2023-11-01'; // Within 90-day window

      const result = calculateRemovalOfConditionsStatus(true, greenCardDate, currentDate);

      expect(result?.currentStatus).toBe('in_window');
      expect(result?.daysUntilWindow).toBeNull(); // Already in window
      expect(result?.daysUntilDeadline).toBe(61); // Days until Jan 1, 2024
    });

    it('should identify overdue cases', () => {
      const greenCardDate = '2022-01-01';
      const currentDate = '2024-02-01'; // Past 2-year anniversary

      const result = calculateRemovalOfConditionsStatus(true, greenCardDate, currentDate);

      expect(result?.currentStatus).toBe('overdue');
      expect(result?.daysUntilWindow).toBeNull();
      expect(result?.daysUntilDeadline).toBeNull(); // Past deadline
    });

    it('should handle filed status', () => {
      const result = calculateRemovalOfConditionsStatus(
        true,
        '2022-01-01',
        '2023-11-01',
        'filed', // Optional status parameter
      );

      expect(result?.currentStatus).toBe('filed');
    });

    it('should handle approved status', () => {
      const result = calculateRemovalOfConditionsStatus(
        true,
        '2022-01-01',
        '2024-06-01',
        'approved',
      );

      expect(result?.currentStatus).toBe('approved');
    });
  });

  describe('getDaysUntilFilingWindow', () => {
    it('should return positive days when before window', () => {
      const greenCardDate = '2022-01-01';
      const currentDate = '2023-06-01';

      const days = getDaysUntilFilingWindow(greenCardDate, currentDate);

      expect(days).toBe(124); // June 1 to Oct 3
    });

    it('should return 0 when in filing window', () => {
      const greenCardDate = '2022-01-01';
      const currentDate = '2023-11-01';

      const days = getDaysUntilFilingWindow(greenCardDate, currentDate);

      expect(days).toBe(0);
    });

    it('should return 0 when past filing window', () => {
      const greenCardDate = '2022-01-01';
      const currentDate = '2024-02-01';

      const days = getDaysUntilFilingWindow(greenCardDate, currentDate);

      expect(days).toBe(0);
    });
  });

  describe('isInFilingWindow', () => {
    it('should return false when before window', () => {
      const result = isInFilingWindow('2022-01-01', '2023-06-01');
      expect(result).toBe(false);
    });

    it('should return true when exactly at window start', () => {
      const result = isInFilingWindow('2022-01-01', '2023-10-03');
      expect(result).toBe(true);
    });

    it('should return true when in middle of window', () => {
      const result = isInFilingWindow('2022-01-01', '2023-11-15');
      expect(result).toBe(true);
    });

    it('should return true when on deadline', () => {
      const result = isInFilingWindow('2022-01-01', '2024-01-01');
      expect(result).toBe(true);
    });

    it('should return false when past deadline', () => {
      const result = isInFilingWindow('2022-01-01', '2024-01-02');
      expect(result).toBe(false);
    });
  });

  describe('getFilingWindowDates', () => {
    it('should calculate correct window dates', () => {
      const dates = getFilingWindowDates('2022-03-15');

      expect(dates.windowStart).toBe('2023-12-16'); // 90 days before anniversary
      expect(dates.windowEnd).toBe('2024-03-15'); // 2-year anniversary
    });

    it('should handle leap year green card dates', () => {
      const dates = getFilingWindowDates('2020-02-29');

      // 2-year anniversary falls on non-leap year, so Feb 28
      expect(dates.windowEnd).toBe('2022-02-28');
      expect(dates.windowStart).toBe('2021-11-30'); // 90 days before
    });

    it('should handle end of year dates', () => {
      const dates = getFilingWindowDates('2022-12-31');

      expect(dates.windowEnd).toBe('2024-12-31');
      expect(dates.windowStart).toBe('2024-10-02'); // 90 days before
    });
  });

  describe('getRemovalOfConditionsDeadline', () => {
    it('should return 2-year anniversary date', () => {
      const deadline = getRemovalOfConditionsDeadline('2022-06-15');
      expect(deadline).toBe('2024-06-15');
    });

    it('should handle leap year edge cases', () => {
      const deadline = getRemovalOfConditionsDeadline('2020-02-29');
      expect(deadline).toBe('2022-02-28'); // Non-leap year
    });
  });

  describe('Edge Cases', () => {
    it('should handle green card obtained on Feb 29 with filing window', () => {
      const greenCardDate = '2020-02-29';
      const currentDate = '2021-12-01'; // In filing window

      const result = calculateRemovalOfConditionsStatus(true, greenCardDate, currentDate);

      expect(result?.currentStatus).toBe('in_window');
      expect(result?.filingWindowEnd).toBe('2022-02-28');
    });

    it('should handle filing window spanning year boundary', () => {
      const greenCardDate = '2022-11-15';
      const currentDate = '2024-09-01'; // Before window

      const result = calculateRemovalOfConditionsStatus(true, greenCardDate, currentDate);

      expect(result?.filingWindowStart).toBe('2024-08-17'); // 90 days before Nov 15
      expect(result?.filingWindowEnd).toBe('2024-11-15');
    });

    it('should handle same-day calculations', () => {
      const greenCardDate = '2022-01-01';

      // Test on window start date
      const onWindowStart = calculateRemovalOfConditionsStatus(true, greenCardDate, '2023-10-03');
      expect(onWindowStart?.currentStatus).toBe('in_window');
      expect(onWindowStart?.daysUntilWindow).toBeNull(); // In window, so null

      // Test on deadline
      const onDeadline = calculateRemovalOfConditionsStatus(true, greenCardDate, '2024-01-01');
      expect(onDeadline?.currentStatus).toBe('in_window');
      expect(onDeadline?.daysUntilDeadline).toBe(0);
    });

    it('should handle future green card dates gracefully', () => {
      const futureDate = '2025-01-01';
      const currentDate = '2024-01-01';

      const result = calculateRemovalOfConditionsStatus(true, futureDate, currentDate);

      // Should calculate based on future date
      expect(result?.currentStatus).toBe('not_yet');
      expect(result?.filingWindowStart).toBe('2026-10-03');
    });

    it('should use current date when not provided', () => {
      // This test will use the actual current date
      const result = calculateRemovalOfConditionsStatus(
        true,
        '2022-01-01',
        // currentDate omitted - should use today
      );

      expect(result).toBeDefined();
      expect(result?.greenCardDate).toBe('2022-01-01');
    });
  });
});
