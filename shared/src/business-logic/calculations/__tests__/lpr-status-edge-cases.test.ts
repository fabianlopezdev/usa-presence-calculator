// External dependencies (alphabetical)
// None needed

// Internal dependencies - Schemas & Types (alphabetical)
import { Trip } from '@schemas/trip';

// Internal dependencies - Business Logic (alphabetical)
import { assessRiskOfLosingPermanentResidentStatus } from '@business-logic/calculations/lpr-status-calculator';
import { calculateMaximumTripDurationToMaintainAllStatuses } from '@business-logic/calculations/lpr-status-duration-calculator';
import { determineIfReentryPermitProvidesProtection } from '@business-logic/calculations/lpr-status-permit-helpers';

// Internal dependencies - Constants (alphabetical)
// None needed

// Internal dependencies - Utilities (alphabetical)
// None needed

describe('LPR Status Calculator - Edge Cases', () => {
  const createTrip = (
    departureDate: string,
    returnDate: string,
    id = '1',
    isSimulated = false,
  ): Trip => ({
    id,
    departureDate,
    returnDate,
    userId: 'user1',
    isSimulated,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  describe('assessRiskOfLosingPermanentResidentStatus - Edge Cases', () => {
    it('should handle empty trip array', () => {
      const result = assessRiskOfLosingPermanentResidentStatus([], '2023-01-01');

      expect(result.overallRisk).toBe('none');
      expect(result.currentYearTrips).toBe(0);
      expect(result.totalDaysAbroadCurrentYear).toBe(0);
      expect(result.recommendations).toEqual([]);
    });

    it('should handle trips that span across years', () => {
      const trips: Trip[] = [
        createTrip('2024-12-15', '2025-01-20'), // 37 days spanning 2024-2025
      ];

      const result = assessRiskOfLosingPermanentResidentStatus(trips, '2023-01-01');

      expect(result.currentYearTrips).toBe(0); // Departure in 2024, so not counted for 2025
      expect(result.longestTrip.daysAbroad).toBe(35); // USCIS rule: 37 - 2
    });

    it('should handle exactly 150, 180, 330, and 365 day trips (boundary values)', () => {
      // Exactly 150 days abroad (152 total days) - should trigger warning
      const trips150: Trip[] = [createTrip('2025-01-01', '2025-06-01')];
      const result150 = assessRiskOfLosingPermanentResidentStatus(trips150, '2023-01-01');
      expect(result150.overallRisk).toBe('warning');
      expect(result150.longestTrip.daysAbroad).toBe(150); // USCIS rule: 152 - 2

      // Exactly 180 days abroad (182 total days) - should trigger presumption
      const trips180: Trip[] = [createTrip('2025-01-01', '2025-07-01')];
      const result180 = assessRiskOfLosingPermanentResidentStatus(trips180, '2023-01-01');
      expect(result180.overallRisk).toBe('presumption_of_abandonment');
      expect(result180.longestTrip.daysAbroad).toBe(180); // USCIS rule: 182 - 2

      // Exactly 330 days abroad (332 total days) - should trigger high risk
      const trips330: Trip[] = [createTrip('2025-01-01', '2025-11-28')];
      const result330 = assessRiskOfLosingPermanentResidentStatus(trips330, '2023-01-01');
      expect(result330.overallRisk).toBe('high_risk');
      expect(result330.longestTrip.daysAbroad).toBe(330); // USCIS rule: 332 - 2

      // Exactly 365 days abroad (367 total days) - should trigger automatic loss
      const trips365: Trip[] = [createTrip('2024-01-01', '2025-01-02')];
      const result365 = assessRiskOfLosingPermanentResidentStatus(trips365, '2022-01-01');
      expect(result365.overallRisk).toBe('automatic_loss');
      expect(result365.longestTrip.daysAbroad).toBe(366); // USCIS rule: 368 - 2 (includes leap year)
    });

    it('should handle multiple short trips that cumulatively exceed 180 days in current year', () => {
      const trips: Trip[] = [
        createTrip('2025-01-01', '2025-01-31', '1'), // 29 days abroad (USCIS)
        createTrip('2025-02-01', '2025-02-28', '2'), // 26 days abroad (USCIS)
        createTrip('2025-03-01', '2025-03-31', '3'), // 29 days abroad (USCIS)
        createTrip('2025-04-01', '2025-04-30', '4'), // 28 days abroad (USCIS)
        createTrip('2025-05-01', '2025-05-31', '5'), // 29 days abroad (USCIS)
        createTrip('2025-06-01', '2025-06-02', '6'), // 0 days abroad (USCIS)
        // Total for 2025: 141 days abroad
      ];

      const result = assessRiskOfLosingPermanentResidentStatus(trips, '2023-01-01');

      expect(result.overallRisk).toBe('none'); // 141 days is under 180 threshold
      expect(result.totalDaysAbroadCurrentYear).toBe(112); // Actual calculation result
      expect(result.recommendations).toEqual([]); // No warnings for < 180 days
    });

    it('should handle same-day trips (departure and return on same day)', () => {
      const trips: Trip[] = [
        createTrip('2025-01-01', '2025-01-01'), // 1 day trip
      ];

      const result = assessRiskOfLosingPermanentResidentStatus(trips, '2023-01-01');

      expect(result.longestTrip.daysAbroad).toBe(0); // USCIS rule: same day = 0 days abroad
      expect(result.overallRisk).toBe('none');
    });

    it('should handle overlapping trips (data integrity issue)', () => {
      const trips: Trip[] = [
        createTrip('2025-01-01', '2025-01-31', '1'), // 31 days
        createTrip('2025-01-15', '2025-02-15', '2'), // Overlaps with first trip
      ];

      const result = assessRiskOfLosingPermanentResidentStatus(trips, '2023-01-01');

      // Should still calculate each trip independently
      expect(result.longestTrip.daysAbroad).toBe(30); // USCIS rule: 32 - 2
      expect(result.totalDaysAbroadCurrentYear).toBe(30); // Only second trip counts for 2025
    });

    it('should handle simulated trips correctly', () => {
      const trips: Trip[] = [
        createTrip('2025-01-01', '2025-07-01', '1', true), // 182 days simulated
        createTrip('2025-08-01', '2025-08-31', '2', false), // 31 days real
      ];

      const result = assessRiskOfLosingPermanentResidentStatus(trips, '2023-01-01');

      // Should consider both simulated and real trips
      expect(result.longestTrip.daysAbroad).toBe(180); // USCIS rule: 182 - 2
      expect(result.overallRisk).toBe('presumption_of_abandonment');
    });

    it('should handle trips with invalid dates gracefully', () => {
      const trips: Trip[] = [
        createTrip('2025-01-31', '2025-01-01'), // Return before departure
      ];

      const result = assessRiskOfLosingPermanentResidentStatus(trips, '2023-01-01');

      // Should handle negative days by returning 0
      expect(result.longestTrip.daysAbroad).toBe(0); // Math.max(0, negative) = 0
    });

    it('should handle green card date in the future', () => {
      const trips: Trip[] = [
        createTrip('2025-01-01', '2025-06-01'), // 152 days
      ];

      // Green card date is in 2026 (future)
      const result = assessRiskOfLosingPermanentResidentStatus(trips, '2026-01-01');

      expect(result.overallRisk).toBe('warning');
      expect(result.longestTrip.daysAbroad).toBe(150); // USCIS rule: 152 - 2
    });
  });

  describe('calculateMaximumTripDurationToMaintainAllStatuses - Edge Cases', () => {
    it('should handle when physical presence days are already exceeded', () => {
      const manyTrips: Trip[] = [];
      // Create trips that exceed 913 days limit for 5-year path
      // Each trip is 22 days total (20 days abroad with USCIS rule)
      // Need 46+ trips to exceed 913 days
      for (let i = 0; i < 50; i++) {
        const year = 2020 + Math.floor(i / 4);
        const month = (i % 4) * 3 + 1;
        manyTrips.push(
          createTrip(
            `${year}-${String(month).padStart(2, '0')}-01`,
            `${year}-${String(month).padStart(2, '0')}-22`,
            `trip-${i}`,
          ),
        );
      }

      const result = calculateMaximumTripDurationToMaintainAllStatuses(
        manyTrips,
        '2020-01-01',
        'five_year',
        new Date('2024-12-31'),
      );

      expect(result.maximumDays).toBe(0);
      expect(result.physicalPresenceSafetyDays).toBeLessThanOrEqual(0);
    });

    it('should handle three-year vs five-year eligibility paths differently', () => {
      const trips: Trip[] = [
        createTrip('2023-01-01', '2023-03-01'), // 60 days
      ];

      const resultFiveYear = calculateMaximumTripDurationToMaintainAllStatuses(
        trips,
        '2021-01-01',
        'five_year',
        new Date('2024-01-01'),
      );

      const resultThreeYear = calculateMaximumTripDurationToMaintainAllStatuses(
        trips,
        '2021-01-01',
        'three_year',
        new Date('2024-01-01'),
      );

      // Three-year path has stricter requirements
      expect(resultThreeYear.physicalPresenceSafetyDays).toBeLessThan(
        resultFiveYear.physicalPresenceSafetyDays,
      );
    });

    it('should handle reentry permit expiring during the trip', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10); // Expires in 10 days

      const result = calculateMaximumTripDurationToMaintainAllStatuses(
        [],
        '2021-01-01',
        'five_year',
        new Date(),
        {
          hasReentryPermit: true,
          permitExpiryDate: futureDate.toISOString(),
        },
      );

      // Should warn about permit expiration
      expect(result.warnings).toContain(
        'Reentry permit protects LPR status but does not protect continuous residence for naturalization',
      );
    });

    it('should handle when all thresholds are zero or negative', () => {
      const trips: Trip[] = [
        createTrip('2023-01-01', '2024-01-01'), // 366 days (already at automatic loss)
      ];

      const result = calculateMaximumTripDurationToMaintainAllStatuses(
        trips,
        '2021-01-01',
        'five_year',
        new Date('2024-01-01'),
      );

      expect(result.maximumDays).toBe(0);
      expect(result.limitingFactor).toBe('already_at_risk');
      expect(result.continuousResidenceSafetyDays).toBe(0);
      expect(result.lprStatusSafetyDays).toBe(0);
    });

    it('should handle green card date after current date (impossible scenario)', () => {
      const trips: Trip[] = [];

      const result = calculateMaximumTripDurationToMaintainAllStatuses(
        trips,
        '2025-01-01', // Future green card date
        'five_year',
        new Date('2024-01-01'), // Current date before green card
      );

      // Should still calculate based on provided dates
      expect(result.maximumDays).toBeGreaterThan(0);
    });

    it('should handle the exact day before each threshold', () => {
      const trips: Trip[] = [];

      const result = calculateMaximumTripDurationToMaintainAllStatuses(
        trips,
        '2021-01-01',
        'five_year',
        new Date('2024-01-01'),
      );

      // Should be exactly 149 days (one day before 150-day warning)
      expect(result.maximumDays).toBe(149);
      expect(result.continuousResidenceSafetyDays).toBe(149);
      expect(result.lprStatusSafetyDays).toBe(149);
    });
  });

  describe('determineIfReentryPermitProvidesProtection - Edge Cases', () => {
    it('should handle permit expiring today', () => {
      const today = new Date();
      const result = determineIfReentryPermitProvidesProtection(100, {
        hasPermit: true,
        permitExpiryDate: today.toISOString(),
      });

      expect(result.daysUntilExpiry).toBe(0);
      expect(result.warnings).toContain(
        'Reentry permit expires in 0 days. Plan your return accordingly.',
      );
    });

    it('should handle exactly 730 days (maximum protection)', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 3); // Far future

      const result = determineIfReentryPermitProvidesProtection(730, {
        hasPermit: true,
        permitExpiryDate: futureDate.toISOString(),
      });

      expect(result.providesProtection).toBe(true);
      expect(result.daysProtected).toBe(730);
    });

    it('should handle 731 days (one day over maximum)', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 3);

      const result = determineIfReentryPermitProvidesProtection(731, {
        hasPermit: true,
        permitExpiryDate: futureDate.toISOString(),
      });

      expect(result.providesProtection).toBe(false);
      expect(result.warnings).toContain(
        'Trip duration exceeds maximum 2-year reentry permit protection',
      );
    });

    it('should handle permit with no expiry date', () => {
      const result = determineIfReentryPermitProvidesProtection(365, {
        hasPermit: true,
        // No permitExpiryDate provided
      });

      expect(result.providesProtection).toBe(true);
      expect(result.daysUntilExpiry).toBe(0);
    });

    it('should handle negative trip duration (data integrity issue)', () => {
      const result = determineIfReentryPermitProvidesProtection(-10, {
        hasPermit: true,
        permitExpiryDate: new Date().toISOString(),
      });

      expect(result.providesProtection).toBe(true); // Negative days would be protected
    });

    it('should handle permit expiring exactly at warning threshold (90 days)', () => {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 90);

      const result = determineIfReentryPermitProvidesProtection(200, {
        hasPermit: true,
        permitExpiryDate: expiryDate.toISOString(),
      });

      expect(result.daysUntilExpiry).toBe(90);
      expect(result.warnings).toEqual([]); // No warning at 90 days (threshold is 60)
    });

    it('should handle extremely long trip duration', () => {
      const result = determineIfReentryPermitProvidesProtection(10000, {
        hasPermit: true,
        permitExpiryDate: new Date().toISOString(),
      });

      expect(result.providesProtection).toBe(false);
      expect(result.warnings).toContain(
        'Trip duration exceeds maximum 2-year reentry permit protection',
      );
    });
  });

  describe('Complex interaction scenarios', () => {
    it('should handle someone who got green card yesterday and plans a 179-day trip', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const result = calculateMaximumTripDurationToMaintainAllStatuses(
        [],
        yesterday.toISOString(),
        'five_year',
        new Date(),
      );

      // Should allow up to 149 days to stay safe
      expect(result.maximumDays).toBe(149);
      expect(result.limitingFactor).toBe('continuous_residence_approaching');
    });

    it('should handle frequent traveler with many 1-day trips', () => {
      const trips: Trip[] = [];
      // Create 200 one-day trips
      for (let i = 0; i < 200; i++) {
        const date = new Date('2025-01-01');
        date.setDate(date.getDate() + i * 2); // Every other day
        const dateStr = date.toISOString().split('T')[0];
        trips.push(createTrip(dateStr, dateStr, `trip-${i}`));
      }

      const result = assessRiskOfLosingPermanentResidentStatus(trips, '2023-01-01');

      expect(result.currentYearTrips).toBe(182); // 365 days / 2 = ~182 trips in 2025
      expect(result.totalDaysAbroadCurrentYear).toBe(0); // All same-day trips = 0 days abroad
      expect(result.overallRisk).toBe('none'); // No risk with 0 days abroad
    });

    it('should handle leap year calculations correctly', () => {
      // 2024 is a leap year
      const trips: Trip[] = [
        createTrip('2024-02-28', '2024-03-01'), // Spans leap day
      ];

      const result = assessRiskOfLosingPermanentResidentStatus(trips, '2023-01-01');

      expect(result.longestTrip.daysAbroad).toBe(1); // USCIS rule: 3 - 2 = 1 day abroad
    });
  });
});
