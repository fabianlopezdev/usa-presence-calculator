/**
 * Tests for Tax Filing Reminder Calculator
 *
 * Tests the calculation of tax filing reminders and travel-aware notifications
 * for LPRs who must file US taxes on worldwide income
 */

// External dependencies
// None needed for tests

// Internal dependencies - Schemas & Types
import { Trip } from '@schemas/trip';

// Internal dependencies - Business Logic
import {
  calculateTaxReminderStatus,
  getNextTaxDeadline,
  getDaysUntilTaxDeadline,
  isCurrentlyTaxSeason,
  willBeAbroadDuringTaxSeason,
  getTaxSeasonDateRange,
} from '@business-logic/calculations/compliance/tax-reminders';

describe('Tax Filing Reminder Calculator', () => {
  describe('calculateTaxReminderStatus', () => {
    it('should calculate status during tax season', () => {
      const currentDate = '2024-03-15'; // During tax season
      const trips: Trip[] = [];

      const result = calculateTaxReminderStatus(trips, false, currentDate);

      expect(result.nextDeadline).toBe('2024-04-15');
      expect(result.daysUntilDeadline).toBe(31);
      expect(result.isAbroadDuringTaxSeason).toBe(false);
      expect(result.reminderDismissed).toBe(false);
    });

    it('should calculate status outside tax season', () => {
      const currentDate = '2024-06-01'; // After tax season
      const trips: Trip[] = [];

      const result = calculateTaxReminderStatus(trips, false, currentDate);

      expect(result.nextDeadline).toBe('2025-04-15'); // Next year
      expect(result.daysUntilDeadline).toBe(318);
      expect(result.isAbroadDuringTaxSeason).toBe(false);
    });

    it('should detect when abroad during tax season', () => {
      const currentDate = '2024-02-01';
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2024-03-01',
          returnDate: '2024-05-01',
          location: 'Japan',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const result = calculateTaxReminderStatus(trips, false, currentDate);

      expect(result.isAbroadDuringTaxSeason).toBe(true);
    });

    it('should handle dismissed reminders', () => {
      const currentDate = '2024-03-15';
      const trips: Trip[] = [];

      const result = calculateTaxReminderStatus(trips, true, currentDate);

      expect(result.reminderDismissed).toBe(true);
    });

    it('should ignore simulated trips', () => {
      const currentDate = '2024-02-01';
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2024-03-01',
          returnDate: '2024-05-01',
          location: 'Japan',
          isSimulated: true, // Simulated trip
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const result = calculateTaxReminderStatus(trips, false, currentDate);

      expect(result.isAbroadDuringTaxSeason).toBe(false);
    });

    it('should use current date when not provided', () => {
      const trips: Trip[] = [];

      const result = calculateTaxReminderStatus(trips, false);

      expect(result).toBeDefined();
      expect(result.nextDeadline).toBeDefined();
    });
  });

  describe('getNextTaxDeadline', () => {
    it('should return current year deadline during tax season', () => {
      const deadline = getNextTaxDeadline('2024-03-01');
      expect(deadline).toBe('2024-04-15');
    });

    it('should return next year deadline after tax season', () => {
      const deadline = getNextTaxDeadline('2024-05-01');
      expect(deadline).toBe('2025-04-15');
    });

    it('should handle exact deadline date', () => {
      const deadline = getNextTaxDeadline('2024-04-15');
      expect(deadline).toBe('2024-04-15');
    });

    it('should handle day after deadline', () => {
      const deadline = getNextTaxDeadline('2024-04-16');
      expect(deadline).toBe('2025-04-15');
    });

    it('should handle beginning of year', () => {
      const deadline = getNextTaxDeadline('2024-01-01');
      expect(deadline).toBe('2024-04-15');
    });

    it('should handle end of year', () => {
      const deadline = getNextTaxDeadline('2024-12-31');
      expect(deadline).toBe('2025-04-15');
    });
  });

  describe('getDaysUntilTaxDeadline', () => {
    it('should calculate days correctly', () => {
      const days = getDaysUntilTaxDeadline('2024-04-01');
      expect(days).toBe(14); // April 1 to April 15
    });

    it('should return 0 on deadline day', () => {
      const days = getDaysUntilTaxDeadline('2024-04-15');
      expect(days).toBe(0);
    });

    it('should calculate days to next year', () => {
      const days = getDaysUntilTaxDeadline('2024-04-16');
      expect(days).toBe(364); // Day after deadline to next year
    });

    it('should handle leap years', () => {
      const days = getDaysUntilTaxDeadline('2024-04-16'); // 2024 is leap year
      expect(days).toBe(364); // 366 - 2 days
    });
  });

  describe('isCurrentlyTaxSeason', () => {
    it('should return true during March', () => {
      expect(isCurrentlyTaxSeason('2024-03-15')).toBe(true);
    });

    it('should return true during early April', () => {
      expect(isCurrentlyTaxSeason('2024-04-10')).toBe(true);
    });

    it('should return true on tax deadline', () => {
      expect(isCurrentlyTaxSeason('2024-04-15')).toBe(true);
    });

    it('should return false after tax deadline', () => {
      expect(isCurrentlyTaxSeason('2024-04-16')).toBe(false);
    });

    it('should return false before March', () => {
      expect(isCurrentlyTaxSeason('2024-02-28')).toBe(false);
    });

    it('should handle March 1st', () => {
      expect(isCurrentlyTaxSeason('2024-03-01')).toBe(true);
    });
  });

  describe('willBeAbroadDuringTaxSeason', () => {
    it('should return false with no trips', () => {
      const trips: Trip[] = [];
      const result = willBeAbroadDuringTaxSeason(trips, '2024-01-01');
      expect(result).toBe(false);
    });

    it('should detect trip during tax season', () => {
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2024-03-15',
          returnDate: '2024-04-20',
          location: 'Mexico',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const result = willBeAbroadDuringTaxSeason(trips, '2024-01-01');
      expect(result).toBe(true);
    });

    it('should detect trip overlapping start of tax season', () => {
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2024-02-15',
          returnDate: '2024-03-15',
          location: 'Canada',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const result = willBeAbroadDuringTaxSeason(trips, '2024-01-01');
      expect(result).toBe(true);
    });

    it('should detect trip overlapping end of tax season', () => {
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2024-04-10',
          returnDate: '2024-04-30',
          location: 'France',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const result = willBeAbroadDuringTaxSeason(trips, '2024-01-01');
      expect(result).toBe(true);
    });

    it('should ignore trips outside tax season', () => {
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2024-05-01',
          returnDate: '2024-06-01',
          location: 'Spain',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const result = willBeAbroadDuringTaxSeason(trips, '2024-01-01');
      expect(result).toBe(false);
    });

    it('should handle trip spanning entire tax season', () => {
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2024-01-01',
          returnDate: '2024-12-31',
          location: 'Digital Nomad',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const result = willBeAbroadDuringTaxSeason(trips, '2024-01-01');
      expect(result).toBe(true);
    });

    it('should check current year tax season', () => {
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2024-03-15',
          returnDate: '2024-04-20',
          location: 'Mexico',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      // Check from December of previous year
      const result = willBeAbroadDuringTaxSeason(trips, '2023-12-01');
      expect(result).toBe(true); // Should check 2024 tax season
    });
  });

  describe('getTaxSeasonDateRange', () => {
    it('should return correct date range for current year', () => {
      const range = getTaxSeasonDateRange('2024-06-01');

      expect(range.start).toBe('2024-03-01');
      expect(range.end).toBe('2024-04-15');
    });

    it('should return current year range during tax season', () => {
      const range = getTaxSeasonDateRange('2024-03-15');

      expect(range.start).toBe('2024-03-01');
      expect(range.end).toBe('2024-04-15');
    });

    it('should handle beginning of year', () => {
      const range = getTaxSeasonDateRange('2024-01-01');

      expect(range.start).toBe('2024-03-01');
      expect(range.end).toBe('2024-04-15');
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple trips during tax season', () => {
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2024-03-01',
          returnDate: '2024-03-10',
          location: 'Canada',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          userId: 'user1',
          departureDate: '2024-04-01',
          returnDate: '2024-04-10',
          location: 'Mexico',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const result = calculateTaxReminderStatus(trips, false, '2024-02-15');
      expect(result.isAbroadDuringTaxSeason).toBe(true);
    });

    it('should handle trips in past years', () => {
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2023-03-15',
          returnDate: '2023-04-20',
          location: 'Old Trip',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const result = willBeAbroadDuringTaxSeason(trips, '2024-03-01');
      expect(result).toBe(false); // Should only check current year
    });

    it('should handle exact boundary dates', () => {
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2024-03-01', // Start of tax season
          returnDate: '2024-04-15', // Tax deadline
          location: 'Exact Boundaries',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const result = willBeAbroadDuringTaxSeason(trips, '2024-01-01');
      expect(result).toBe(true);
    });
  });
});
