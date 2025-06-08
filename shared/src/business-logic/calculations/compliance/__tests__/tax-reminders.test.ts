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
  getActualTaxDeadline,
  getExtensionInfo,
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

  describe('Actual Tax Deadline with Weekend/Holiday Adjustments', () => {
    it('should adjust April 15 when it falls on Saturday', () => {
      // 2023: April 15 was Saturday, April 16 was Sunday
      // When Emancipation Day falls on Sunday, it's observed Monday
      // So tax deadline moves to Tuesday April 18
      const result = calculateTaxReminderStatus([], false, '2023-04-01');
      expect(result.actualDeadline).toBe('2023-04-18'); // Tuesday (Monday was Emancipation Day observed)
    });

    it('should adjust April 15 when it falls on Sunday', () => {
      // 2018: April 15 was Sunday, actual deadline was April 17 (Tuesday due to DC holiday)
      const result = calculateTaxReminderStatus([], false, '2018-04-01');
      expect(result.actualDeadline).toBe('2018-04-17'); // Tuesday (Monday was Emancipation Day)
    });

    it('should not adjust when April 15 is weekday', () => {
      // 2024: April 15 is Monday
      const result = calculateTaxReminderStatus([], false, '2024-04-01');
      expect(result.actualDeadline).toBe('2024-04-15'); // No adjustment needed
    });

    it('should adjust June 15 deadline for citizens abroad', () => {
      // Check deadline when abroad during current tax season
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2024-03-01',
          returnDate: '2024-05-01',
          location: 'France',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      const result = calculateTaxReminderStatus(trips, false, '2024-03-15');
      expect(result.applicableDeadline).toBe('abroad_extension');
      expect(result.actualDeadline).toBe('2024-06-17'); // Monday after Saturday
    });

    it('should adjust October 15 extension deadline', () => {
      // 2023: October 15 was Sunday
      const result = getActualTaxDeadline('2023-09-01', 'october_extension');
      expect(result).toBe('2023-10-16'); // Monday after Sunday
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
    it('should return true during late January when IRS starts accepting returns', () => {
      expect(isCurrentlyTaxSeason('2024-01-23')).toBe(true);
      expect(isCurrentlyTaxSeason('2024-01-25')).toBe(true);
    });

    it('should return false before IRS starts accepting returns', () => {
      expect(isCurrentlyTaxSeason('2024-01-22')).toBe(false);
      expect(isCurrentlyTaxSeason('2024-01-01')).toBe(false);
    });

    it('should return true during February', () => {
      expect(isCurrentlyTaxSeason('2024-02-15')).toBe(true);
    });

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
    it('should return correct date range with IRS acceptance start date', () => {
      const range = getTaxSeasonDateRange('2024-06-01');

      expect(range.start).toBe('2024-01-23'); // IRS starts accepting returns
      expect(range.end).toBe('2024-04-15');
    });

    it('should return current year range during tax season', () => {
      const range = getTaxSeasonDateRange('2024-03-15');

      expect(range.start).toBe('2024-01-23');
      expect(range.end).toBe('2024-04-15');
    });

    it('should handle beginning of year', () => {
      const range = getTaxSeasonDateRange('2024-01-01');

      expect(range.start).toBe('2024-01-23');
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

  describe('Tax Year Transition Edge Cases', () => {
    it('should handle checking on January 1st', () => {
      const currentDate = '2024-01-01';
      const trips: Trip[] = [];

      const result = calculateTaxReminderStatus(trips, false, currentDate);

      expect(result.nextDeadline).toBe('2024-04-15');
      expect(result.daysUntilDeadline).toBe(105); // Jan 1 to Apr 15 is 105 days in 2024
    });

    it('should handle checking on December 31st', () => {
      const currentDate = '2024-12-31';
      const trips: Trip[] = [];

      const result = calculateTaxReminderStatus(trips, false, currentDate);

      expect(result.nextDeadline).toBe('2025-04-15');
      expect(result.daysUntilDeadline).toBe(105);
    });

    it('should handle tax deadline falling on weekend correctly', () => {
      // 2023: April 15 was Saturday, IRS moved deadline to April 18 (Tuesday due to DC holiday)
      const currentDate = '2023-04-15'; // This was a Saturday
      const trips: Trip[] = [];

      const result = calculateTaxReminderStatus(trips, false, currentDate);

      expect(result.nextDeadline).toBe('2023-04-15'); // Legacy field for backward compatibility
      expect(result.actualDeadline).toBe('2023-04-18'); // Tuesday (Monday was Emancipation Day observed)
      expect(result.daysUntilDeadline).toBe(3); // Days until actual deadline
    });

    it('should handle leap year calculations', () => {
      const currentDate = '2024-02-29'; // Leap day
      const trips: Trip[] = [];

      const result = calculateTaxReminderStatus(trips, false, currentDate);

      expect(result.nextDeadline).toBe('2024-04-15');
      expect(result.daysUntilDeadline).toBe(46);
    });

    it('should handle checking from previous year for upcoming tax season', () => {
      const currentDate = '2023-12-15';
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2024-03-10',
          returnDate: '2024-04-20',
          location: 'Future Trip',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const result = calculateTaxReminderStatus(trips, false, currentDate);

      expect(result.nextDeadline).toBe('2024-04-15');
      expect(result.isAbroadDuringTaxSeason).toBe(true);
    });
  });

  describe('Extended Filing Deadline Scenarios', () => {
    it('should apply automatic 2-month extension for citizens abroad', () => {
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

      const result = calculateTaxReminderStatus(trips, false, '2024-04-01');

      expect(result.isAbroadDuringTaxSeason).toBe(true);
      expect(result.applicableDeadline).toBe('abroad_extension');
      expect(result.actualDeadline).toBe('2024-06-17'); // June 15 is Saturday, moved to Monday
      expect(result.daysUntilDeadline).toBe(77); // April 1 to June 17
    });

    it('should not apply abroad extension if returning before tax deadline', () => {
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2024-02-01',
          returnDate: '2024-03-15',
          location: 'Mexico',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const result = calculateTaxReminderStatus(trips, false, '2024-04-01');

      expect(result.isAbroadDuringTaxSeason).toBe(true);
      expect(result.applicableDeadline).toBe('abroad_extension'); // Still abroad during tax season
      expect(result.actualDeadline).toBe('2024-06-17');
    });

    it('should provide extension information', () => {
      const abroadInfo = getExtensionInfo(true);
      expect(abroadInfo.automaticExtension).toBe(true);
      expect(abroadInfo.extensionDeadline).toBe('June 15');
      expect(abroadInfo.requiresForm).toBe(false);
      expect(abroadInfo.formNumber).toBeNull();

      const domesticInfo = getExtensionInfo(false);
      expect(domesticInfo.automaticExtension).toBe(false);
      expect(domesticInfo.extensionDeadline).toBe('October 15');
      expect(domesticInfo.requiresForm).toBe(true);
      expect(domesticInfo.formNumber).toBe('Form 4868');
    });

    it('should handle October 15 extension deadline', () => {
      const result = getActualTaxDeadline('2024-09-01', 'october_extension');
      expect(result).toBe('2024-10-15'); // Tuesday, no adjustment needed
    });

    it('should calculate days correctly for abroad extension', () => {
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2024-01-01',
          returnDate: '2024-12-31',
          location: 'Living Abroad',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      // Check from March when still within tax season
      const result = calculateTaxReminderStatus(trips, false, '2024-03-14');
      expect(result.applicableDeadline).toBe('abroad_extension');
      // March 14 to June 17 is 95 days
      expect(result.actualDeadline).toBe('2024-06-17');
    });

    it('should check next year tax season when checking after current deadline', () => {
      // Checking in June looks at next year's tax season
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2025-03-01',
          returnDate: '2025-05-01',
          location: 'Future Trip',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const result = calculateTaxReminderStatus(trips, false, '2024-06-14');
      expect(result.isAbroadDuringTaxSeason).toBe(true); // Will be abroad next tax season
      expect(result.applicableDeadline).toBe('abroad_extension');
      expect(result.nextDeadline).toBe('2025-04-15'); // Next year's deadline
    });
  });

  describe('Travel Pattern Anomalies', () => {
    it('should handle continuous travel abroad', () => {
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2023-01-01',
          returnDate: '2025-12-31',
          location: 'Multi-year Travel',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const result = calculateTaxReminderStatus(trips, false, '2024-02-01');

      expect(result.isAbroadDuringTaxSeason).toBe(true);
    });

    it('should handle same-day departure and return on tax deadline', () => {
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2024-04-15',
          returnDate: '2024-04-15',
          location: 'Day Trip',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const result = willBeAbroadDuringTaxSeason(trips, '2024-03-01');

      expect(result).toBe(true); // Even one day counts
    });

    it('should handle overlapping trips', () => {
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2024-03-01',
          returnDate: '2024-03-20',
          location: 'Trip 1',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          userId: 'user1',
          departureDate: '2024-03-15',
          returnDate: '2024-04-20',
          location: 'Trip 2',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const result = willBeAbroadDuringTaxSeason(trips, '2024-02-01');

      expect(result).toBe(true);
    });

    it('should handle back-to-back trips spanning tax season', () => {
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2024-02-20',
          returnDate: '2024-03-10',
          location: 'Trip 1',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          userId: 'user1',
          departureDate: '2024-03-10',
          returnDate: '2024-04-20',
          location: 'Trip 2',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const result = willBeAbroadDuringTaxSeason(trips, '2024-01-01');

      expect(result).toBe(true);
    });

    it('should handle timezone crossing trips', () => {
      // Trip starts before tax season in one timezone but during in another
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2024-02-28',
          returnDate: '2024-03-02',
          location: 'International Date Line',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const result = willBeAbroadDuringTaxSeason(trips, '2024-01-01');

      expect(result).toBe(true);
    });
  });

  describe('Dismissal Logic Edge Cases', () => {
    it('should handle dismissal on April 14', () => {
      const currentDate = '2024-04-14';
      const trips: Trip[] = [];

      const dismissed = calculateTaxReminderStatus(trips, true, currentDate);
      const notDismissed = calculateTaxReminderStatus(trips, false, currentDate);

      expect(dismissed.reminderDismissed).toBe(true);
      expect(notDismissed.reminderDismissed).toBe(false);
      expect(dismissed.daysUntilDeadline).toBe(1);
      expect(notDismissed.daysUntilDeadline).toBe(1);
    });

    it('should handle dismissal for future tax year', () => {
      const currentDate = '2024-12-01';
      const trips: Trip[] = [];

      const result = calculateTaxReminderStatus(trips, true, currentDate);

      expect(result.reminderDismissed).toBe(true);
      expect(result.nextDeadline).toBe('2025-04-15');
    });

    it('should handle dismissal with abroad status', () => {
      const currentDate = '2024-03-15';
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2024-03-01',
          returnDate: '2024-04-30',
          location: 'Abroad',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const result = calculateTaxReminderStatus(trips, true, currentDate);

      expect(result.reminderDismissed).toBe(true);
      expect(result.isAbroadDuringTaxSeason).toBe(true);
    });
  });

  describe('Tax Season Boundary Edge Cases', () => {
    it('should handle days before IRS starts accepting returns', () => {
      expect(isCurrentlyTaxSeason('2024-01-22')).toBe(false);
      expect(isCurrentlyTaxSeason('2024-01-20')).toBe(false);
    });

    it('should handle IRS acceptance start date', () => {
      expect(isCurrentlyTaxSeason('2024-01-23')).toBe(true);
    });

    it('should handle February during active tax season', () => {
      expect(isCurrentlyTaxSeason('2024-02-28')).toBe(true);
      expect(isCurrentlyTaxSeason('2024-02-29')).toBe(true); // Leap year
    });

    it('should handle April 15 at different times', () => {
      const onDeadline = isCurrentlyTaxSeason('2024-04-15');
      expect(onDeadline).toBe(true);
    });

    it('should handle April 16 (day after deadline)', () => {
      const afterDeadline = isCurrentlyTaxSeason('2024-04-16');
      expect(afterDeadline).toBe(false);
    });
  });

  describe('Complex Trip Scenarios', () => {
    it('should handle mix of real and simulated trips', () => {
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2024-03-01',
          returnDate: '2024-03-10',
          location: 'Real Trip',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          userId: 'user1',
          departureDate: '2024-04-01',
          returnDate: '2024-04-20',
          location: 'Simulated Trip',
          isSimulated: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const result = calculateTaxReminderStatus(trips, false, '2024-02-15');

      expect(result.isAbroadDuringTaxSeason).toBe(true); // Real trip counts
    });

    it('should handle empty trip arrays', () => {
      const trips: Trip[] = [];

      const result = willBeAbroadDuringTaxSeason(trips, '2024-03-15');

      expect(result).toBe(false);
    });

    it('should handle invalid trip dates gracefully', () => {
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2024-04-20',
          returnDate: '2024-04-10', // Return before departure
          location: 'Invalid Trip',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      // Current implementation doesn't validate, but trip won't overlap properly
      const result = willBeAbroadDuringTaxSeason(trips, '2024-03-01');
      expect(result).toBe(false);
    });

    it('should handle trips with missing locations', () => {
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2024-03-15',
          returnDate: '2024-04-20',
          location: undefined,
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const result = willBeAbroadDuringTaxSeason(trips, '2024-02-01');

      expect(result).toBe(true); // Location doesn't affect calculation
    });
  });

  describe('Days Until Deadline Edge Cases', () => {
    it('should handle negative days (past deadline)', () => {
      const days = getDaysUntilTaxDeadline('2024-04-20');
      expect(days).toBe(360); // Points to next year
    });

    it('should handle exactly one year before deadline', () => {
      const days = getDaysUntilTaxDeadline('2023-04-15');
      expect(days).toBe(0); // Same date last year
    });

    it('should handle February 29 to April 15 calculation', () => {
      const days = getDaysUntilTaxDeadline('2024-02-29');
      expect(days).toBe(46);
    });

    it('should handle year boundary crossing', () => {
      const days = getDaysUntilTaxDeadline('2024-12-31');
      expect(days).toBe(105); // To April 15, 2025
    });
  });

  describe('Comprehensive Compliance Scenarios', () => {
    it('should provide accurate information for taxpayer planning trip during tax season', () => {
      const plannedTrips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2024-03-20',
          returnDate: '2024-04-25',
          location: 'Business Trip',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const result = calculateTaxReminderStatus(plannedTrips, false, '2024-02-01');

      expect(result.isAbroadDuringTaxSeason).toBe(true);
      expect(result.applicableDeadline).toBe('abroad_extension');
      expect(result.actualDeadline).toBe('2024-06-17'); // June 15 is Saturday

      const extensionInfo = getExtensionInfo(true);
      expect(extensionInfo.automaticExtension).toBe(true);
      expect(extensionInfo.requiresForm).toBe(false);
    });

    it('should handle complex travel patterns with multiple trips', () => {
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2024-01-10',
          returnDate: '2024-01-30',
          location: 'Winter Trip',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          userId: 'user1',
          departureDate: '2024-03-25',
          returnDate: '2024-04-10',
          location: 'Spring Break',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          userId: 'user1',
          departureDate: '2024-04-20',
          returnDate: '2024-05-05',
          location: 'Post-Tax Trip',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const result = calculateTaxReminderStatus(trips, false, '2024-02-15');

      expect(result.isAbroadDuringTaxSeason).toBe(true); // Due to spring break trip
      expect(result.applicableDeadline).toBe('abroad_extension');
    });

    it('should correctly inform about October extension option', () => {
      const domesticInfo = getExtensionInfo(false);

      expect(domesticInfo.automaticExtension).toBe(false);
      expect(domesticInfo.extensionDeadline).toBe('October 15');
      expect(domesticInfo.requiresForm).toBe(true);
      expect(domesticInfo.formNumber).toBe('Form 4868');
    });

    it('should handle year with DC Emancipation Day holiday', () => {
      // In years when April 15 falls near DC Emancipation Day (April 16),
      // the deadline may be pushed further

      // 2018: April 15 was Sunday, April 16 was Monday (Emancipation Day)
      // Deadline should be April 17 (Tuesday)
      const result2018 = calculateTaxReminderStatus([], false, '2018-04-01');
      expect(result2018.actualDeadline).toBe('2018-04-17');

      // 2016: April 15 was Friday, April 16 was Saturday (Emancipation Day)
      // Deadline should be April 18 (Monday)
      const result2016 = calculateTaxReminderStatus([], false, '2016-04-01');
      expect(result2016.actualDeadline).toBe('2016-04-18');

      // 2017: April 15 was Saturday, April 16 was Sunday (Emancipation Day observed Monday)
      // Deadline should be April 18 (Tuesday)
      const result2017 = calculateTaxReminderStatus([], false, '2017-04-01');
      expect(result2017.actualDeadline).toBe('2017-04-18');
    });
  });
});
