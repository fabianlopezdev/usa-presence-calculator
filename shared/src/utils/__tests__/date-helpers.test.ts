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
} from '../date-helpers';

describe('date-helpers', () => {
  describe('aliases', () => {
    it('should export parseDate as alias for parseUTCDate', () => {
      const result = parseDate('2024-01-15');
      expect(result.toISOString()).toBe('2024-01-15T00:00:00.000Z');
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
      expect(result.toISOString()).toBe('2024-01-15T00:00:00.000Z');
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
});
