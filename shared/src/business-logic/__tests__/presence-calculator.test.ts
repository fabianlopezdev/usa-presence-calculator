import {
  calculateDaysOfPhysicalPresence,
  calculatePresenceStatus,
  checkContinuousResidence,
  calculateEligibilityDates,
  isEligibleForEarlyFiling,
} from '@business-logic/calculations/presence-calculator';
import { Trip } from '@schemas/trip';

describe('Presence Calculator', () => {
  describe('calculateDaysOfPhysicalPresence', () => {
    it('should calculate total days correctly with no trips', () => {
      const greenCardDate = '2020-01-01';
      const trips: Trip[] = [];
      const asOfDate = '2023-01-01';

      const result = calculateDaysOfPhysicalPresence(trips, greenCardDate, asOfDate);

      // 3 years = 1096 days (2020 was leap year)
      // Jan 1, 2020 to Jan 1, 2023 inclusive = 1097 days
      expect(result.totalDaysInUSA).toBe(1097);
      expect(result.totalDaysAbroad).toBe(0);
    });

    it('should count departure and return days as present in USA per USCIS rules', () => {
      const greenCardDate = '2022-01-01';
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2022-03-01',
          returnDate: '2022-03-10',
          location: 'Mexico',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      const asOfDate = '2022-12-31';

      const result = calculateDaysOfPhysicalPresence(trips, greenCardDate, asOfDate);

      // Total days from Jan 1 to Dec 31 = 365
      // Days abroad = March 2-9 (8 days, not counting departure/return)
      expect(result.totalDaysAbroad).toBe(8);
      expect(result.totalDaysInUSA).toBe(357);
    });

    it('should handle multiple trips correctly', () => {
      const greenCardDate = '2022-01-01';
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2022-02-01',
          returnDate: '2022-02-05',
          location: 'Canada',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          userId: 'user1',
          departureDate: '2022-06-15',
          returnDate: '2022-06-25',
          location: 'Spain',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      const asOfDate = '2022-12-31';

      const result = calculateDaysOfPhysicalPresence(trips, greenCardDate, asOfDate);

      // Trip 1: Feb 2-4 = 3 days abroad
      // Trip 2: Jun 16-24 = 9 days abroad
      // Total days abroad = 12
      expect(result.totalDaysAbroad).toBe(12);
      expect(result.totalDaysInUSA).toBe(353); // 365 - 12
    });

    it('should only count days after green card date', () => {
      const greenCardDate = '2022-06-01';
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2022-05-01', // Before green card
          returnDate: '2022-05-15',
          location: 'Mexico',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          userId: 'user1',
          departureDate: '2022-07-01',
          returnDate: '2022-07-10',
          location: 'Canada',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      const asOfDate = '2022-12-31';

      const result = calculateDaysOfPhysicalPresence(trips, greenCardDate, asOfDate);

      // Only count from June 1 to Dec 31 = 214 days
      // Only second trip counts: Jul 2-9 = 8 days abroad
      expect(result.totalDaysAbroad).toBe(8);
      expect(result.totalDaysInUSA).toBe(206);
    });

    it('should handle trips that overlap green card date', () => {
      const greenCardDate = '2022-06-15';
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2022-06-10', // Before green card
          returnDate: '2022-06-20', // After green card
          location: 'Mexico',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      const asOfDate = '2022-07-31';

      const result = calculateDaysOfPhysicalPresence(trips, greenCardDate, asOfDate);

      // From June 15 to July 31 = 47 days total
      // Trip days abroad from June 15-19 = 5 days (June 20 is return, counts as present)
      expect(result.totalDaysAbroad).toBe(5);
      expect(result.totalDaysInUSA).toBe(42);
    });

    // Edge cases
    it('should handle same-day trips (departure and return on same day)', () => {
      const greenCardDate = '2022-01-01';
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2022-06-15',
          returnDate: '2022-06-15', // Same day
          location: 'Canada',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      const asOfDate = '2022-12-31';

      const result = calculateDaysOfPhysicalPresence(trips, greenCardDate, asOfDate);

      // Same day trip = 0 days abroad (both departure and return count as present)
      expect(result.totalDaysAbroad).toBe(0);
      expect(result.totalDaysInUSA).toBe(365);
    });

    it('should handle overlapping trips', () => {
      const greenCardDate = '2022-01-01';
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2022-06-01',
          returnDate: '2022-06-20',
          location: 'Spain',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          userId: 'user1',
          departureDate: '2022-06-10', // Overlaps with first trip
          returnDate: '2022-06-25',
          location: 'France',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      const asOfDate = '2022-12-31';

      const result = calculateDaysOfPhysicalPresence(trips, greenCardDate, asOfDate);

      // Should handle overlapping days correctly
      // Combined period: June 1-25 = 24 days total, minus departure/return = 23 days abroad
      expect(result.totalDaysAbroad).toBe(23);
      expect(result.totalDaysInUSA).toBe(342);
    });

    it('should handle trip extending beyond asOfDate', () => {
      const greenCardDate = '2022-01-01';
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2022-12-20',
          returnDate: '2023-01-10', // Beyond asOfDate
          location: 'India',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      const asOfDate = '2022-12-31';

      const result = calculateDaysOfPhysicalPresence(trips, greenCardDate, asOfDate);

      // Should only count days up to asOfDate
      // Dec 21-31 = 11 days abroad
      expect(result.totalDaysAbroad).toBe(11);
      expect(result.totalDaysInUSA).toBe(354);
    });

    it('should handle asOfDate before green card date', () => {
      const greenCardDate = '2022-06-01';
      const trips: Trip[] = [];
      const asOfDate = '2022-05-01'; // Before green card

      const result = calculateDaysOfPhysicalPresence(trips, greenCardDate, asOfDate);

      // Should return 0 days for both
      expect(result.totalDaysInUSA).toBe(0);
      expect(result.totalDaysAbroad).toBe(0);
    });

    it('should handle leap years correctly', () => {
      const greenCardDate = '2020-01-01'; // Leap year
      const trips: Trip[] = [];
      const asOfDate = '2020-12-31';

      const result = calculateDaysOfPhysicalPresence(trips, greenCardDate, asOfDate);

      // 2020 is leap year, so 366 days
      expect(result.totalDaysInUSA).toBe(366);
      expect(result.totalDaysAbroad).toBe(0);
    });

    it('should filter out simulated trips', () => {
      const greenCardDate = '2022-01-01';
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2022-06-01',
          returnDate: '2022-06-10',
          location: 'Canada',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          userId: 'user1',
          departureDate: '2022-08-01',
          returnDate: '2022-08-15',
          location: 'Mexico',
          isSimulated: true, // Should be ignored
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      const asOfDate = '2022-12-31';

      const result = calculateDaysOfPhysicalPresence(trips, greenCardDate, asOfDate);

      // Only first trip should count: Jun 2-9 = 8 days
      expect(result.totalDaysAbroad).toBe(8);
      expect(result.totalDaysInUSA).toBe(357);
    });
  });

  describe('calculatePresenceStatus', () => {
    it('should calculate correct status for 5-year path', () => {
      const totalDaysInUSA = 913; // Exactly 2.5 years
      const eligibilityCategory = 'five_year';

      const result = calculatePresenceStatus(totalDaysInUSA, eligibilityCategory);

      expect(result.requiredDays).toBe(913);
      expect(result.percentageComplete).toBe(100);
      expect(result.daysRemaining).toBe(0);
      expect(result.status).toBe('requirement_met');
    });

    it('should calculate correct status for 3-year path', () => {
      const totalDaysInUSA = 400;
      const eligibilityCategory = 'three_year';

      const result = calculatePresenceStatus(totalDaysInUSA, eligibilityCategory);

      expect(result.requiredDays).toBe(548); // 1.5 years
      expect(result.percentageComplete).toBeCloseTo(73.0, 1);
      expect(result.daysRemaining).toBe(148);
      expect(result.status).toBe('on_track');
    });

    it('should cap percentage at 100% when over requirement', () => {
      const totalDaysInUSA = 1000;
      const eligibilityCategory = 'five_year';

      const result = calculatePresenceStatus(totalDaysInUSA, eligibilityCategory);

      expect(result.percentageComplete).toBe(100);
      expect(result.daysRemaining).toBe(0);
      expect(result.status).toBe('requirement_met');
    });

    it('should handle zero days correctly', () => {
      const totalDaysInUSA = 0;
      const eligibilityCategory = 'five_year';

      const result = calculatePresenceStatus(totalDaysInUSA, eligibilityCategory);

      expect(result.percentageComplete).toBe(0);
      expect(result.daysRemaining).toBe(913);
      expect(result.status).toBe('on_track');
    });

    it('should handle negative days as zero', () => {
      const totalDaysInUSA = -10;
      const eligibilityCategory = 'five_year';

      const result = calculatePresenceStatus(totalDaysInUSA, eligibilityCategory);

      expect(result.percentageComplete).toBe(0);
      expect(result.daysRemaining).toBe(913);
      expect(result.status).toBe('on_track');
    });
  });

  describe('checkContinuousResidence', () => {
    it('should return no warnings for short trips', () => {
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2022-06-01',
          returnDate: '2022-06-30',
          location: 'Canada',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const warnings = checkContinuousResidence(trips);

      expect(warnings).toHaveLength(0);
    });

    it('should warn about trips approaching 180 days', () => {
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2022-01-01',
          returnDate: '2022-06-25', // 175 days
          location: 'India',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const warnings = checkContinuousResidence(trips);

      expect(warnings).toHaveLength(1);
      expect(warnings[0].tripId).toBe('1');
      expect(warnings[0].daysAbroad).toBe(175);
      expect(warnings[0].severity).toBe('medium');
    });

    it('should warn with high severity for trips over 180 days', () => {
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2022-01-01',
          returnDate: '2022-07-10', // 190 days
          location: 'India',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const warnings = checkContinuousResidence(trips);

      expect(warnings).toHaveLength(1);
      expect(warnings[0].severity).toBe('high');
      expect(warnings[0].daysAbroad).toBe(190);
    });

    it('should warn about trips exactly at 150 days threshold', () => {
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2022-01-01',
          returnDate: '2022-05-31', // Exactly 150 days
          location: 'Brazil',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const warnings = checkContinuousResidence(trips);

      expect(warnings).toHaveLength(1);
      expect(warnings[0].daysAbroad).toBe(150);
      expect(warnings[0].severity).toBe('medium');
    });

    it('should handle multiple long trips', () => {
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2022-01-01',
          returnDate: '2022-06-01', // 151 days
          location: 'India',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          userId: 'user1',
          departureDate: '2022-07-01',
          returnDate: '2023-01-10', // 193 days
          location: 'China',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const warnings = checkContinuousResidence(trips);

      expect(warnings).toHaveLength(2);
      expect(warnings[0].tripId).toBe('1');
      expect(warnings[0].severity).toBe('medium');
      expect(warnings[1].tripId).toBe('2');
      expect(warnings[1].severity).toBe('high');
    });

    it('should warn about trips over 365 days', () => {
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2022-01-01',
          returnDate: '2023-01-10', // 374 days
          location: 'Remote work abroad',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const warnings = checkContinuousResidence(trips);

      expect(warnings).toHaveLength(1);
      expect(warnings[0].severity).toBe('high');
      expect(warnings[0].message).toContain('exceeds 180 days');
    });

    it('should ignore simulated trips', () => {
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2022-01-01',
          returnDate: '2022-07-01', // 181 days
          location: 'Future trip',
          isSimulated: true, // Should be ignored
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const warnings = checkContinuousResidence(trips);

      expect(warnings).toHaveLength(0);
    });
  });

  describe('calculateEligibilityDates', () => {
    it('should calculate eligibility dates for 5-year path', () => {
      const greenCardDate = '2020-01-15';
      const eligibilityCategory = 'five_year';

      const result = calculateEligibilityDates(greenCardDate, eligibilityCategory);

      expect(result.eligibilityDate).toBe('2025-01-14'); // 5 years - 1 day
      expect(result.earliestFilingDate).toBe('2024-10-16'); // 90 days before
    });

    it('should calculate eligibility dates for 3-year path', () => {
      const greenCardDate = '2021-06-20';
      const eligibilityCategory = 'three_year';

      const result = calculateEligibilityDates(greenCardDate, eligibilityCategory);

      expect(result.eligibilityDate).toBe('2024-06-19'); // 3 years - 1 day
      expect(result.earliestFilingDate).toBe('2024-03-21'); // 90 days before
    });

    it('should handle leap year in calculation', () => {
      const greenCardDate = '2020-02-29'; // Leap year date
      const eligibilityCategory = 'five_year';

      const result = calculateEligibilityDates(greenCardDate, eligibilityCategory);

      // Should handle leap year correctly
      expect(result.eligibilityDate).toBe('2025-02-28'); // No Feb 29 in 2025
      expect(result.earliestFilingDate).toBe('2024-11-30');
    });

    it('should handle end of year dates', () => {
      const greenCardDate = '2020-12-31';
      const eligibilityCategory = 'three_year';

      const result = calculateEligibilityDates(greenCardDate, eligibilityCategory);

      expect(result.eligibilityDate).toBe('2023-12-30');
      expect(result.earliestFilingDate).toBe('2023-10-01');
    });
  });

  describe('isEligibleForEarlyFiling', () => {
    it('should return true when within 90-day window', () => {
      const greenCardDate = '2020-01-15';
      const eligibilityCategory = 'five_year';
      const asOfDate = '2024-11-01'; // Within 90 days of Jan 14, 2025

      const result = isEligibleForEarlyFiling(greenCardDate, eligibilityCategory, asOfDate);

      expect(result).toBe(true);
    });

    it('should return false when not yet in 90-day window', () => {
      const greenCardDate = '2020-01-15';
      const eligibilityCategory = 'five_year';
      const asOfDate = '2024-09-01'; // More than 90 days before

      const result = isEligibleForEarlyFiling(greenCardDate, eligibilityCategory, asOfDate);

      expect(result).toBe(false);
    });

    it('should return true after eligibility date', () => {
      const greenCardDate = '2020-01-15';
      const eligibilityCategory = 'five_year';
      const asOfDate = '2025-02-01'; // After eligibility

      const result = isEligibleForEarlyFiling(greenCardDate, eligibilityCategory, asOfDate);

      expect(result).toBe(true);
    });

    it('should return true exactly on earliest filing date', () => {
      const greenCardDate = '2020-01-15';
      const eligibilityCategory = 'five_year';
      const asOfDate = '2024-10-16'; // Exactly 90 days before

      const result = isEligibleForEarlyFiling(greenCardDate, eligibilityCategory, asOfDate);

      expect(result).toBe(true);
    });

    it('should return false one day before earliest filing date', () => {
      const greenCardDate = '2020-01-15';
      const eligibilityCategory = 'five_year';
      const asOfDate = '2024-10-15'; // One day too early

      const result = isEligibleForEarlyFiling(greenCardDate, eligibilityCategory, asOfDate);

      expect(result).toBe(false);
    });

    it('should handle future asOfDate correctly', () => {
      const greenCardDate = '2025-01-01'; // Future green card
      const eligibilityCategory = 'three_year';
      const asOfDate = '2025-06-01'; // Still not eligible

      const result = isEligibleForEarlyFiling(greenCardDate, eligibilityCategory, asOfDate);

      expect(result).toBe(false);
    });
  });
});
