import { Trip } from '@schemas/trip';

import { assessRiskOfLosingPermanentResidentStatus } from '@business-logic/calculations/lpr-status/calculator';
import { calculateMaximumTripDurationToMaintainAllStatuses } from '@business-logic/calculations/lpr-status/duration-calculator';
import { determineIfReentryPermitProvidesProtection } from '@business-logic/calculations/lpr-status/permit-helpers';

describe('LPR Status Calculator', () => {
  describe('assessRiskOfLosingPermanentResidentStatus', () => {
    const createTrip = (departureDate: string, returnDate: string, id = '1'): Trip => ({
      id,
      departureDate,
      returnDate,
      userId: 'user1',
      isSimulated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    it('should return no risk for short trips under 150 days', () => {
      const trips: Trip[] = [
        createTrip('2025-01-01', '2025-02-15', '1'), // 44 days abroad (USCIS rule)
        createTrip('2025-06-01', '2025-07-30', '2'), // 58 days abroad (USCIS rule)
      ];

      const result = assessRiskOfLosingPermanentResidentStatus(trips, '2023-01-01');

      expect(result).toEqual({
        overallRisk: 'none',
        longestTrip: {
          trip: trips[1],
          daysAbroad: 58,
          riskLevel: 'none',
        },
        currentYearTrips: 1,
        totalDaysAbroadCurrentYear: 58,
        recommendations: [],
        requiresReentryPermit: false,
      });
    });

    it('should flag warning for trips 150-179 days', () => {
      const trips: Trip[] = [
        createTrip('2025-01-01', '2025-06-05'), // 154 days abroad (USCIS rule)
      ];

      const result = assessRiskOfLosingPermanentResidentStatus(trips, '2023-01-01');

      expect(result).toEqual({
        overallRisk: 'warning',
        longestTrip: {
          trip: trips[0],
          daysAbroad: 154,
          riskLevel: 'warning',
        },
        currentYearTrips: 0,
        totalDaysAbroadCurrentYear: 0,
        recommendations: [
          'Maintain strong ties to the U.S. (employment, home, family)',
          'Keep documentation of your U.S. connections',
          'Consider shorter trips in the future',
        ],
        requiresReentryPermit: false,
      });
    });

    it('should flag presumption of abandonment for trips 180-329 days', () => {
      const trips: Trip[] = [
        createTrip('2025-01-01', '2025-07-15'), // 194 days abroad (USCIS rule)
      ];

      const result = assessRiskOfLosingPermanentResidentStatus(trips, '2023-01-01');

      expect(result).toEqual({
        overallRisk: 'presumption_of_abandonment',
        longestTrip: {
          trip: trips[0],
          daysAbroad: 194,
          riskLevel: 'presumption_of_abandonment',
        },
        currentYearTrips: 0,
        totalDaysAbroadCurrentYear: 0,
        recommendations: [
          'Prepare evidence to overcome presumption of abandonment',
          'Consult with an immigration attorney immediately',
          'Consider applying for a reentry permit for future travel',
          'Document all ties to the United States',
        ],
        requiresReentryPermit: true,
      });
    });

    it('should flag high risk for trips 330-364 days', () => {
      const trips: Trip[] = [
        createTrip('2025-01-01', '2025-11-30'), // 332 days abroad (USCIS rule)
      ];

      const result = assessRiskOfLosingPermanentResidentStatus(trips, '2023-01-01');

      expect(result).toEqual({
        overallRisk: 'high_risk',
        longestTrip: {
          trip: trips[0],
          daysAbroad: 332,
          riskLevel: 'high_risk',
        },
        currentYearTrips: 0,
        totalDaysAbroadCurrentYear: 0,
        recommendations: [
          'URGENT: Return to the U.S. immediately',
          'Risk of automatic loss of green card is imminent',
          'Seek legal representation before attempting reentry',
          'Apply for a reentry permit if you must travel again',
        ],
        requiresReentryPermit: true,
      });
    });

    it('should flag automatic loss for trips 365+ days', () => {
      const trips: Trip[] = [
        createTrip('2023-01-01', '2024-01-10'), // 373 days abroad (USCIS rule)
      ];

      const result = assessRiskOfLosingPermanentResidentStatus(trips, '2022-01-01');

      expect(result).toEqual({
        overallRisk: 'automatic_loss',
        longestTrip: {
          trip: trips[0],
          daysAbroad: 373,
          riskLevel: 'automatic_loss',
        },
        currentYearTrips: 0, // Trip was in previous year
        totalDaysAbroadCurrentYear: 0,
        recommendations: [
          'Your green card is likely considered abandoned',
          'You will need to apply for a returning resident visa (SB-1)',
          'Consult with an immigration attorney before attempting to return',
          'Prepare extensive documentation of ties to the U.S.',
        ],
        requiresReentryPermit: true,
      });
    });

    it('should consider cumulative risk from multiple trips', () => {
      const trips: Trip[] = [
        createTrip('2025-01-01', '2025-05-01', '1'), // 119 days abroad (USCIS rule)
        createTrip('2025-05-01', '2025-06-05', '2'), // 34 days abroad (USCIS rule)
        createTrip('2024-10-01', '2024-12-20', '3'), // 79 days abroad in previous year
      ];

      const result = assessRiskOfLosingPermanentResidentStatus(trips, '2023-01-01');

      expect(result).toEqual({
        overallRisk: 'none',
        longestTrip: {
          trip: trips[0],
          daysAbroad: 119,
          riskLevel: 'none',
        },
        currentYearTrips: 1,
        totalDaysAbroadCurrentYear: 34,
        recommendations: [],
        requiresReentryPermit: false,
      });
    });
  });

  describe('calculateMaximumTripDurationToMaintainAllStatuses', () => {
    it('should calculate safe duration based on physical presence requirement', () => {
      const existingTrips: Trip[] = [
        {
          id: '1',
          departureDate: '2023-06-01',
          returnDate: '2023-07-15',
          userId: 'user1',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const result = calculateMaximumTripDurationToMaintainAllStatuses(
        existingTrips,
        '2021-01-01', // Green card date
        'five_year',
        new Date('2024-01-01'),
      );

      expect(result).toEqual({
        maximumDays: 149, // To stay under 150-day warning
        limitingFactor: 'continuous_residence_approaching',
        physicalPresenceSafetyDays: expect.any(Number) as number,
        continuousResidenceSafetyDays: 149,
        lprStatusSafetyDays: 149,
        warnings: [],
      });
    });

    it('should warn when approaching physical presence limits', () => {
      const manyTrips: Trip[] = [];
      // Create many trips totaling close to the 5-year limit (913 days required presence = 912 days allowed absence)
      // Create trips totaling ~850 days to trigger physical presence warning
      for (let i = 0; i < 35; i++) {
        const year = 2020 + Math.floor(i / 12);
        const month = (i % 12) + 1;
        manyTrips.push({
          id: `trip-${i}`,
          departureDate: `${year}-${String(month).padStart(2, '0')}-01`,
          returnDate: `${year}-${String(month).padStart(2, '0')}-25`,
          userId: 'user1',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      const result = calculateMaximumTripDurationToMaintainAllStatuses(
        manyTrips,
        '2020-01-01',
        'five_year',
        new Date('2024-01-01'),
      );

      expect(result.limitingFactor).toBe('physical_presence');
      expect(result.warnings).toContain(
        'You are approaching your physical presence limit for naturalization',
      );
    });

    it('should handle reentry permit holders differently', () => {
      const existingTrips: Trip[] = [];

      const result = calculateMaximumTripDurationToMaintainAllStatuses(
        existingTrips,
        '2021-01-01',
        'five_year',
        new Date('2024-01-01'),
        {
          hasReentryPermit: true,
          permitExpiryDate: '2025-12-31',
        },
      );

      expect(result).toEqual({
        maximumDays: 149, // Limited by continuous residence even with permit
        limitingFactor: 'continuous_residence_approaching',
        physicalPresenceSafetyDays: expect.any(Number) as number,
        continuousResidenceSafetyDays: 149, // Still affects naturalization
        lprStatusSafetyDays: 669,
        warnings: [
          'Reentry permit protects LPR status but does not protect continuous residence for naturalization',
        ],
      });
    });

    it('should return 0 when already at risk', () => {
      const existingTrips: Trip[] = [
        {
          id: '1',
          departureDate: '2023-01-01',
          returnDate: '2023-12-31',
          userId: 'user1',
          isSimulated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const result = calculateMaximumTripDurationToMaintainAllStatuses(
        existingTrips,
        '2021-01-01',
        'five_year',
        new Date('2024-01-01'),
      );

      expect(result).toEqual({
        maximumDays: 0,
        limitingFactor: 'already_at_risk',
        physicalPresenceSafetyDays: expect.any(Number) as number,
        continuousResidenceSafetyDays: 0,
        lprStatusSafetyDays: 0,
        warnings: [
          'You already have trips that put your continuous residence at risk',
          'Consult with an immigration attorney before any additional travel',
        ],
      });
    });
  });

  describe('determineIfReentryPermitProvidesProtection', () => {
    it('should return true for valid permit within duration limits', () => {
      const result = determineIfReentryPermitProvidesProtection(
        500, // days abroad
        {
          hasPermit: true,
          permitExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        },
      );

      expect(result).toEqual({
        providesProtection: true,
        daysProtected: 730,
        daysUntilExpiry: expect.any(Number) as number,
        warnings: [],
      });
    });

    it('should warn when permit is expiring soon', () => {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30); // 30 days from now

      const result = determineIfReentryPermitProvidesProtection(200, {
        hasPermit: true,
        permitExpiryDate: expiryDate.toISOString(),
      });

      expect(result).toEqual({
        providesProtection: true,
        daysProtected: 730,
        daysUntilExpiry: 30,
        warnings: ['Reentry permit expires in 30 days. Plan your return accordingly.'],
      });
    });

    it('should not protect beyond 730 days', () => {
      const result = determineIfReentryPermitProvidesProtection(750, {
        hasPermit: true,
        permitExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(result).toEqual({
        providesProtection: false,
        daysProtected: 730,
        daysUntilExpiry: expect.any(Number) as number,
        warnings: ['Trip duration exceeds maximum 2-year reentry permit protection'],
      });
    });

    it('should handle expired permits', () => {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 10); // 10 days ago

      const result = determineIfReentryPermitProvidesProtection(100, {
        hasPermit: true,
        permitExpiryDate: expiredDate.toISOString(),
      });

      expect(result).toEqual({
        providesProtection: false,
        daysProtected: 0,
        daysUntilExpiry: -10,
        warnings: ['Reentry permit has expired. It no longer provides protection.'],
      });
    });

    it('should return false when no permit', () => {
      const result = determineIfReentryPermitProvidesProtection(200, {
        hasPermit: false,
      });

      expect(result).toEqual({
        providesProtection: false,
        daysProtected: 0,
        daysUntilExpiry: 0,
        warnings: ['No reentry permit on file'],
      });
    });
  });
});
