import {
  calculateDaysOfPhysicalPresence,
  calculatePresenceStatus,
  checkContinuousResidence,
  calculateEligibilityDates,
  isEligibleForEarlyFiling,
} from '../presence-calculator';
import { Trip } from '@schemas/trip';

describe('USCIS Presence Calculator - Edge Cases', () => {
  describe('Complex Trip Scenarios', () => {
    it('should handle multiple overlapping trips correctly', () => {
      const greenCardDate = '2022-01-01';
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2022-06-01',
          returnDate: '2022-06-30',
          location: 'Spain',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          userId: 'user1',
          departureDate: '2022-06-15', // Overlaps with first trip
          returnDate: '2022-07-15',
          location: 'France',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          userId: 'user1',
          departureDate: '2022-06-20', // Overlaps with both
          returnDate: '2022-06-25',
          location: 'Italy',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      const asOfDate = '2022-12-31';

      const result = calculateDaysOfPhysicalPresence(trips, greenCardDate, asOfDate);

      // Combined period: June 1-July 15
      // June 1 and July 15 count as present (departure/return)
      // Days abroad: June 2-July 14 = 43 days
      expect(result.totalDaysAbroad).toBe(43);
    });

    it('should handle back-to-back trips with no gap', () => {
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
          departureDate: '2022-06-10', // Same day as previous return
          returnDate: '2022-06-20',
          location: 'Mexico',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      const asOfDate = '2022-12-31';

      const result = calculateDaysOfPhysicalPresence(trips, greenCardDate, asOfDate);

      // June 1: departure (present)
      // June 2-9: abroad (8 days)
      // June 10: return from trip 1 AND departure for trip 2 (present)
      // June 11-19: abroad (9 days)
      // June 20: return (present)
      // Total days abroad: 17
      expect(result.totalDaysAbroad).toBe(17);
    });

    it('should handle trip spanning multiple years', () => {
      const greenCardDate = '2021-01-01';
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2021-12-15',
          returnDate: '2022-01-15',
          location: 'India',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      const asOfDate = '2022-12-31';

      const result = calculateDaysOfPhysicalPresence(trips, greenCardDate, asOfDate);

      // Dec 16-31, 2021: 16 days
      // Jan 1-14, 2022: 14 days
      // Total: 30 days abroad
      expect(result.totalDaysAbroad).toBe(30);
    });

    it('should handle trips with dates at year boundaries', () => {
      const greenCardDate = '2022-01-01';
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2022-12-31', // Last day of year
          returnDate: '2023-01-01', // First day of next year
          location: 'Canada',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      const asOfDate = '2023-01-01';

      const result = calculateDaysOfPhysicalPresence(trips, greenCardDate, asOfDate);

      // Dec 31 and Jan 1 both count as present
      // No days abroad
      expect(result.totalDaysAbroad).toBe(0);
      expect(result.totalDaysInUSA).toBe(366); // 2022 had 365 days + Jan 1, 2023
    });
  });

  describe('Green Card Date Edge Cases', () => {
    it('should handle green card obtained on Feb 29 (leap year)', () => {
      const greenCardDate = '2020-02-29';
      const trips: Trip[] = [];
      const asOfDate = '2021-02-28'; // No Feb 29 in 2021

      const result = calculateDaysOfPhysicalPresence(trips, greenCardDate, asOfDate);

      // From Feb 29, 2020 to Feb 28, 2021 inclusive = 366 days
      expect(result.totalDaysInUSA).toBe(366);
    });

    it('should handle green card obtained during ongoing trip', () => {
      const greenCardDate = '2022-06-15';
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2022-06-01', // Before green card
          returnDate: '2022-06-30', // After green card
          location: 'Mexico',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      const asOfDate = '2022-12-31';

      const result = calculateDaysOfPhysicalPresence(trips, greenCardDate, asOfDate);

      // June 15 (green card date while abroad) counts as abroad
      // June 16-29: 14 days
      // June 30: return (present)
      // Total: 15 days abroad
      expect(result.totalDaysAbroad).toBe(15);
    });
  });

  describe('Continuous Residence Edge Cases', () => {
    it('should handle trips exactly at warning thresholds', () => {
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2022-01-01',
          returnDate: '2022-05-30', // 148 days abroad (150 total - 2 travel days)
          location: 'Canada',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          userId: 'user1',
          departureDate: '2022-07-01',
          returnDate: '2022-11-27', // 148 days abroad (150 total - 2 travel days)
          location: 'Mexico',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const warnings = checkContinuousResidence(trips);

      // Both trips are 148 days abroad (150 total - 2 travel days)
      // This is just under the 150-day warning threshold
      expect(warnings).toHaveLength(0);
    });

    it('should warn about trips over 1 year', () => {
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2022-01-01',
          returnDate: '2023-01-10', // 373 days abroad (375 total - 2 travel days)
          location: 'Remote work abroad',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const warnings = checkContinuousResidence(trips);

      expect(warnings).toHaveLength(1);
      expect(warnings[0].severity).toBe('high');
      expect(warnings[0].daysAbroad).toBe(373);
    });
  });

  describe('Early Filing Eligibility Edge Cases', () => {
    it('should handle eligibility exactly 90 days before', () => {
      const greenCardDate = '2020-01-15';
      const eligibilityCategory = 'five_year';

      // Eligibility date: Jan 14, 2025 (5 years - 1 day)
      // 90 days before: Oct 17, 2024
      const asOfDate = '2024-10-17';

      const result = isEligibleForEarlyFiling(greenCardDate, eligibilityCategory, asOfDate);

      expect(result).toBe(true);
    });

    it('should handle 3-year eligibility with leap year', () => {
      const greenCardDate = '2020-02-29'; // Leap year
      const eligibilityCategory = 'three_year';

      const dates = calculateEligibilityDates(greenCardDate, eligibilityCategory);

      // 3 years from Feb 29, 2020 should be Feb 28, 2023 (no leap year)
      expect(dates.eligibilityDate).toBe('2023-02-28');
    });
  });

  describe('Data Validation Edge Cases', () => {
    it('should handle trips with date-only strings (USCIS standard)', () => {
      const greenCardDate = '2022-01-01';
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2022-06-01',
          returnDate: '2022-06-10',
          location: 'UK',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      const asOfDate = '2022-12-31';

      const result = calculateDaysOfPhysicalPresence(trips, greenCardDate, asOfDate);

      // USCIS uses date-only format (YYYY-MM-DD)
      // June 1: departure (present)
      // June 2-9: abroad (8 days)
      // June 10: return (present)
      expect(result.totalDaysAbroad).toBe(8);
    });

    it('should handle presence status at exact requirement threshold', () => {
      // 5-year requirement: 913 days
      const result5Year = calculatePresenceStatus(913, 'five_year');
      expect(result5Year.status).toBe('requirement_met');
      expect(result5Year.percentageComplete).toBe(100);
      expect(result5Year.daysRemaining).toBe(0);

      // 3-year requirement: 548 days
      const result3Year = calculatePresenceStatus(548, 'three_year');
      expect(result3Year.status).toBe('requirement_met');
      expect(result3Year.percentageComplete).toBe(100);
      expect(result3Year.daysRemaining).toBe(0);
    });

    it('should handle presence status one day short of requirement', () => {
      const result5Year = calculatePresenceStatus(912, 'five_year');
      expect(result5Year.status).toBe('on_track');
      expect(result5Year.daysRemaining).toBe(1);

      const result3Year = calculatePresenceStatus(547, 'three_year');
      expect(result3Year.status).toBe('on_track');
      expect(result3Year.daysRemaining).toBe(1);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle frequent business traveler pattern', () => {
      const greenCardDate = '2022-01-01';
      const trips: Trip[] = [];

      // Generate weekly 2-day trips for business
      for (let week = 0; week < 52; week++) {
        const monday = new Date(2022, 0, 3 + week * 7); // Start from first Monday
        const tuesday = new Date(2022, 0, 4 + week * 7);

        trips.push({
          id: `trip-${week}`,
          userId: 'user1',
          departureDate: monday.toISOString().split('T')[0],
          returnDate: tuesday.toISOString().split('T')[0],
          location: 'Business Trip',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      const asOfDate = '2022-12-31';
      const result = calculateDaysOfPhysicalPresence(trips, greenCardDate, asOfDate);

      // 52 trips, each with 0 days abroad (departure and return days don't count)
      expect(result.totalDaysAbroad).toBe(0);

      // Should not trigger continuous residence warnings
      const warnings = checkContinuousResidence(trips);
      expect(warnings).toHaveLength(0);
    });

    it('should handle student abroad scenario', () => {
      const greenCardDate = '2020-08-01';
      const trips: Trip[] = [
        {
          id: '1',
          userId: 'user1',
          departureDate: '2020-09-01',
          returnDate: '2020-12-20', // Fall semester
          location: 'UK - Study Abroad',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          userId: 'user1',
          departureDate: '2021-01-15',
          returnDate: '2021-05-15', // Spring semester
          location: 'UK - Study Abroad',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      const asOfDate = '2021-12-31';

      const result = calculateDaysOfPhysicalPresence(trips, greenCardDate, asOfDate);
      const warnings = checkContinuousResidence(trips);

      // First trip: 109 days abroad, Second trip: 119 days abroad
      expect(warnings).toHaveLength(0); // Both under 150 days

      // Check if eligible for naturalization after studies
      const status = calculatePresenceStatus(result.totalDaysInUSA, 'five_year');
      expect(status.status).toBe('on_track'); // Still building presence
    });
  });
});
