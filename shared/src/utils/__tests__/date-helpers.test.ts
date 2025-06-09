/**
 * Tests for Extended Date Helper Functions
 */

import {
  parseDate,
  formatDate,
  addUTCDays,
  startOfUTCDay,
  endOfUTCDay,
  isValidDate,
  parseDateInput,
  getDaysInMonth,
  isLeapYear,
  isValidDateFormat,
} from '../date-helpers';

describe('date-helpers', () => {
  describe('aliases', () => {
    it('should export parseDate as alias for parseISO', () => {
      const result = parseDate('2024-01-15');
      // parseISO parses in local time, result depends on timezone
      expect(result.toISOString()).toMatch(/2024-01-15T\d{2}:00:00\.000Z/);
    });

    it('should export formatDate as alias for formatUTCDate', () => {
      const date = new Date('2024-01-15T12:30:00Z');
      expect(formatDate(date)).toBe('2024-01-15');
    });
  });

  describe('addUTCDays', () => {
    it('should add days correctly', () => {
      const date = new Date('2024-01-15T00:00:00Z');
      const result = addUTCDays(date, 5);
      expect(result.toISOString()).toBe('2024-01-20T00:00:00.000Z');
    });

    it('should subtract days when negative', () => {
      const date = new Date('2024-01-15T00:00:00Z');
      const result = addUTCDays(date, -5);
      expect(result.toISOString()).toBe('2024-01-10T00:00:00.000Z');
    });

    it('should handle month boundaries', () => {
      const date = new Date('2024-01-31T00:00:00Z');
      const result = addUTCDays(date, 1);
      expect(result.toISOString()).toBe('2024-02-01T00:00:00.000Z');
    });

    it('should handle leap years', () => {
      const date = new Date('2024-02-28T00:00:00Z');
      const result = addUTCDays(date, 1);
      expect(result.toISOString()).toBe('2024-02-29T00:00:00.000Z');
    });
  });

  describe('startOfUTCDay', () => {
    it('should return start of day in UTC', () => {
      const date = new Date('2024-01-15T14:30:45.123Z');
      const result = startOfUTCDay(date);
      expect(result.toISOString()).toBe('2024-01-15T00:00:00.000Z');
    });

    it('should handle dates already at start of day', () => {
      const date = new Date('2024-01-15T00:00:00.000Z');
      const result = startOfUTCDay(date);
      expect(result.toISOString()).toBe('2024-01-15T00:00:00.000Z');
    });
  });

  describe('endOfUTCDay', () => {
    it('should return end of day in UTC', () => {
      const date = new Date('2024-01-15T14:30:45.123Z');
      const result = endOfUTCDay(date);
      expect(result.toISOString()).toBe('2024-01-15T23:59:59.999Z');
    });

    it('should handle dates already at end of day', () => {
      const date = new Date('2024-01-15T23:59:59.999Z');
      const result = endOfUTCDay(date);
      expect(result.toISOString()).toBe('2024-01-15T23:59:59.999Z');
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid dates', () => {
      expect(isValidDate(new Date('2024-01-15'))).toBe(true);
      expect(isValidDate(new Date())).toBe(true);
    });

    it('should return false for invalid dates', () => {
      expect(isValidDate(new Date('invalid'))).toBe(false);
      expect(isValidDate(new Date(NaN))).toBe(false);
    });
  });

  describe('parseDateInput', () => {
    it('should parse string dates', () => {
      const result = parseDateInput('2024-01-15');
      // parseISO parses in local time, result depends on timezone
      expect(result.toISOString()).toMatch(/2024-01-15T\d{2}:00:00\.000Z/);
    });

    it('should return Date objects as-is', () => {
      const date = new Date('2024-01-15T00:00:00Z');
      const result = parseDateInput(date);
      expect(result).toBe(date);
    });

    it('should handle invalid strings', () => {
      const result = parseDateInput('invalid');
      expect(isNaN(result.getTime())).toBe(true);
    });
  });

  describe('getDaysInMonth', () => {
    it('should return correct days for regular months', () => {
      expect(getDaysInMonth(2024, 1)).toBe(31); // January
      expect(getDaysInMonth(2024, 4)).toBe(30); // April
      expect(getDaysInMonth(2024, 11)).toBe(30); // November
      expect(getDaysInMonth(2024, 12)).toBe(31); // December
    });

    it('should handle February in non-leap years', () => {
      expect(getDaysInMonth(2023, 2)).toBe(28);
    });

    it('should handle February in leap years', () => {
      expect(getDaysInMonth(2024, 2)).toBe(29);
    });
  });

  describe('isLeapYear', () => {
    it('should identify leap years correctly', () => {
      expect(isLeapYear(2024)).toBe(true); // Divisible by 4
      expect(isLeapYear(2000)).toBe(true); // Divisible by 400
    });

    it('should identify non-leap years correctly', () => {
      expect(isLeapYear(2023)).toBe(false); // Not divisible by 4
      expect(isLeapYear(1900)).toBe(false); // Divisible by 100 but not 400
    });
  });

  describe('edge cases and boundary conditions', () => {
    describe('extreme dates', () => {
      it('should handle year 9999', () => {
        const farFuture = new Date('9999-12-31T23:59:59.999Z');
        expect(isValidDate(farFuture)).toBe(true);
        expect(formatDate(farFuture)).toBe('9999-12-31');
        expect(getDaysInMonth(9999, 12)).toBe(31);
      });

      it('should handle year 1', () => {
        const ancient = new Date('0001-01-01T00:00:00.000Z');
        expect(isValidDate(ancient)).toBe(true);
        expect(formatDate(ancient)).toBe('1-01-01'); // Year is not padded
        expect(getDaysInMonth(1, 1)).toBe(31);
      });

      it('should handle negative years (BCE)', () => {
        const bce = new Date();
        bce.setUTCFullYear(-1);
        expect(isValidDate(bce)).toBe(true);
      });
    });

    describe('daylight saving time edge cases', () => {
      it('should handle DST transitions with addUTCDays', () => {
        // March 10, 2024 is when DST starts in most of US
        const beforeDST = new Date('2024-03-09T12:00:00Z');
        const afterDST = addUTCDays(beforeDST, 2);
        expect(afterDST.toISOString()).toBe('2024-03-11T12:00:00.000Z');
        // UTC operations should not be affected by DST
      });

      it('should handle DST transitions with startOfUTCDay', () => {
        // November 3, 2024 is when DST ends in most of US
        const dstEndDay = new Date('2024-11-03T08:30:00Z');
        const startOfDay = startOfUTCDay(dstEndDay);
        expect(startOfDay.toISOString()).toBe('2024-11-03T00:00:00.000Z');
      });
    });

    describe('month boundary edge cases', () => {
      it('should handle adding days across multiple months', () => {
        const jan31 = new Date('2024-01-31T00:00:00Z');
        const result = addUTCDays(jan31, 60);
        expect(result.toISOString()).toBe('2024-03-31T00:00:00.000Z');
      });

      it('should handle subtracting days across year boundary', () => {
        const jan5 = new Date('2024-01-05T00:00:00Z');
        const result = addUTCDays(jan5, -10);
        expect(result.toISOString()).toBe('2023-12-26T00:00:00.000Z');
      });

      it('should handle February 29 to non-leap year', () => {
        const leapDay = new Date('2024-02-29T00:00:00Z');
        const nextYear = addUTCDays(leapDay, 365);
        expect(nextYear.toISOString()).toBe('2025-02-28T00:00:00.000Z');
      });
    });

    describe('invalid input edge cases', () => {
      it('should handle null/undefined in isValidDate', () => {
        expect(isValidDate(null as unknown as Date)).toBe(false);
        expect(isValidDate(undefined as unknown as Date)).toBe(false);
      });

      it('should handle non-Date objects in isValidDate', () => {
        expect(isValidDate('2024-01-01' as unknown as Date)).toBe(false);
        expect(isValidDate(123456789 as unknown as Date)).toBe(false);
        expect(isValidDate({} as unknown as Date)).toBe(false);
      });

      it('should handle empty string in parseDateInput', () => {
        const result = parseDateInput('');
        expect(isNaN(result.getTime())).toBe(true);
      });

      it('should handle extremely large day additions', () => {
        const date = new Date('2024-01-01T00:00:00Z');
        const result = addUTCDays(date, 365000); // ~1000 years
        expect(result.getUTCFullYear()).toBeGreaterThan(3000);
      });

      it('should handle extremely large negative day additions', () => {
        const date = new Date('2024-01-01T00:00:00Z');
        const result = addUTCDays(date, -365000); // ~1000 years ago
        expect(result.getUTCFullYear()).toBeLessThan(1100);
      });
    });

    describe('getDaysInMonth edge cases', () => {
      it('should handle month 0 (December of previous year)', () => {
        expect(getDaysInMonth(2024, 0)).toBe(31); // December 2023
      });

      it('should handle month 13 (January of next year)', () => {
        expect(getDaysInMonth(2024, 13)).toBe(31); // January 2025
      });

      it('should handle negative months', () => {
        expect(getDaysInMonth(2024, -1)).toBe(30); // November 2023
      });

      it('should handle century leap year rules', () => {
        // Century years divisible by 400 are leap years
        expect(getDaysInMonth(1600, 2)).toBe(29);
        expect(getDaysInMonth(2000, 2)).toBe(29);
        expect(getDaysInMonth(2400, 2)).toBe(29);

        // Century years not divisible by 400 are not leap years
        expect(getDaysInMonth(1700, 2)).toBe(28);
        expect(getDaysInMonth(1800, 2)).toBe(28);
        expect(getDaysInMonth(1900, 2)).toBe(28);
        expect(getDaysInMonth(2100, 2)).toBe(28);
      });
    });

    describe('time precision edge cases', () => {
      it('should handle microsecond precision in endOfUTCDay', () => {
        const date = new Date('2024-01-15T12:00:00.000Z');
        const endOfDay = endOfUTCDay(date);
        expect(endOfDay.getUTCMilliseconds()).toBe(999);
        expect(endOfDay.toISOString()).toBe('2024-01-15T23:59:59.999Z');
      });

      it('should preserve time component when adding days', () => {
        const dateWithTime = new Date('2024-01-15T13:45:30.123Z');
        const result = addUTCDays(dateWithTime, 5);
        expect(result.toISOString()).toBe('2024-01-20T13:45:30.123Z');
      });

      it('should handle dates at exact midnight', () => {
        const midnight = new Date('2024-01-15T00:00:00.000Z');
        expect(startOfUTCDay(midnight).getTime()).toBe(midnight.getTime());

        const almostMidnight = new Date('2024-01-15T23:59:59.999Z');
        expect(endOfUTCDay(almostMidnight).getTime()).toBe(almostMidnight.getTime());
      });
    });

    describe('parseDate timezone edge cases', () => {
      it('should handle ISO strings with timezone offsets', () => {
        const result = parseDate('2024-01-15T12:00:00+05:00');
        expect(result.toISOString()).toBe('2024-01-15T07:00:00.000Z');
      });

      it('should handle partial ISO strings', () => {
        const dateOnly = parseDate('2024-01-15');
        const withTime = parseDate('2024-01-15T12:00');
        const withSeconds = parseDate('2024-01-15T12:00:00');

        expect(isValidDate(dateOnly)).toBe(true);
        expect(isValidDate(withTime)).toBe(true);
        expect(isValidDate(withSeconds)).toBe(true);
      });
    });

    describe('floating point arithmetic edge cases', () => {
      it('should handle adding 0 days', () => {
        const date = new Date('2024-01-15T12:30:45.678Z');
        const result = addUTCDays(date, 0);
        expect(result.getTime()).toBe(date.getTime());
        expect(result).not.toBe(date); // Should return new instance
      });

      it('should handle fractional days (should truncate)', () => {
        const date = new Date('2024-01-15T00:00:00Z');
        const result1 = addUTCDays(date, 1.5);
        const result2 = addUTCDays(date, 1.9);
        const result3 = addUTCDays(date, 1.1);

        // All should add exactly 1 day since setUTCDate truncates
        expect(result1.toISOString()).toBe('2024-01-16T00:00:00.000Z');
        expect(result2.toISOString()).toBe('2024-01-16T00:00:00.000Z');
        expect(result3.toISOString()).toBe('2024-01-16T00:00:00.000Z');
      });
    });

    describe('parseDateInput with Date object edge cases', () => {
      it('should not modify the original Date object', () => {
        const original = new Date('2024-01-15T12:00:00Z');
        const originalTime = original.getTime();
        const result = parseDateInput(original);

        expect(result).toBe(original); // Same reference
        expect(original.getTime()).toBe(originalTime); // Unchanged
      });

      it('should handle Invalid Date objects', () => {
        const invalidDate = new Date('invalid');
        const result = parseDateInput(invalidDate);
        expect(result).toBe(invalidDate);
        expect(isNaN(result.getTime())).toBe(true);
      });
    });
  });

  describe('isValidDateFormat', () => {
    it('should accept valid YYYY-MM-DD format', () => {
      expect(isValidDateFormat('2024-01-15')).toBe(true);
      expect(isValidDateFormat('2024-12-31')).toBe(true);
      expect(isValidDateFormat('2000-01-01')).toBe(true);
      expect(isValidDateFormat('9999-12-31')).toBe(true);
    });

    it('should reject non-YYYY-MM-DD formats', () => {
      expect(isValidDateFormat('01-15-2024')).toBe(false); // MM-DD-YYYY
      expect(isValidDateFormat('15.01.2024')).toBe(false); // DD.MM.YYYY
      expect(isValidDateFormat('2024/01/15')).toBe(false); // Slash separator
      expect(isValidDateFormat('Jan 15, 2024')).toBe(false); // Named month
      expect(isValidDateFormat('2024-1-15')).toBe(false); // No padding
      expect(isValidDateFormat('2024-01-15T00:00:00Z')).toBe(false); // ISO with time
    });

    it('should reject invalid calendar dates', () => {
      expect(isValidDateFormat('2024-13-01')).toBe(false); // Invalid month
      expect(isValidDateFormat('2024-01-32')).toBe(false); // Invalid day
      expect(isValidDateFormat('2023-02-29')).toBe(false); // Not a leap year
      expect(isValidDateFormat('2024-00-01')).toBe(false); // Month 0
      expect(isValidDateFormat('2024-01-00')).toBe(false); // Day 0
    });

    it('should reject non-string inputs', () => {
      expect(isValidDateFormat(null as unknown as string)).toBe(false);
      expect(isValidDateFormat(undefined as unknown as string)).toBe(false);
      expect(isValidDateFormat(123 as unknown as string)).toBe(false);
      expect(isValidDateFormat(new Date() as unknown as string)).toBe(false);
      expect(isValidDateFormat({} as unknown as string)).toBe(false);
    });

    it('should reject empty or whitespace strings', () => {
      expect(isValidDateFormat('')).toBe(false);
      expect(isValidDateFormat(' ')).toBe(false);
      expect(isValidDateFormat('\n')).toBe(false);
      expect(isValidDateFormat('\t')).toBe(false);
    });
  });
});
