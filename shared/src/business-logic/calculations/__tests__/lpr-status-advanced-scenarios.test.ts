// External dependencies (alphabetical)
// None needed

// Internal dependencies - Schemas & Types (alphabetical)
import { LPRStatusInput, N470Exemption } from '@schemas/lpr-status';
import { Trip } from '@schemas/trip';

// Internal dependencies - Business Logic (alphabetical)
import { calculateRebuttablePresumption } from '@business-logic/calculations/lpr-status-advanced-helpers';
import {
  assessRiskOfLosingPermanentResidentStatus,
  assessRiskOfLosingPermanentResidentStatusAdvanced,
  calculateMaximumTripDurationWithExemptions,
} from '@business-logic/calculations/lpr-status-calculator';
import { calculateMaximumTripDurationToMaintainAllStatuses } from '@business-logic/calculations/lpr-status-duration-calculator';
import { analyzePatternOfNonResidence } from '@business-logic/calculations/lpr-status-pattern-analysis';
import { determineIfReentryPermitProvidesProtectionAdvanced } from '@business-logic/calculations/lpr-status-permit-helpers';

// Internal dependencies - Constants (alphabetical)
// None needed

// Internal dependencies - Utilities (alphabetical)
// None needed

describe('LPR Status Calculator - Advanced Legal Scenarios', () => {
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

  describe('1. Rebuttable Presumption Scenarios (180+ days but under 1 year)', () => {
    it('should distinguish between rebuttable presumption and hard reset of continuous residence', () => {
      // 200-day trip - presumption that CAN be rebutted with evidence
      const trips200Days: Trip[] = [createTrip('2022-01-01', '2022-07-20')];

      // Test with basic function
      const basicResult = assessRiskOfLosingPermanentResidentStatus(trips200Days, '2020-01-01');
      expect(basicResult.overallRisk).toBe('presumption_of_abandonment');
      expect(basicResult.longestTrip.daysAbroad).toBe(199); // USCIS rule

      // Test with advanced function
      const input: LPRStatusInput = {
        trips: [
          {
            departureDate: '2022-01-01',
            arrivalDate: '2022-07-20',
            destinationCountry: 'Unknown',
          },
        ],
        lprStartDate: '2020-01-01',
        currentDate: '2024-01-01',
      };

      const advancedResult = assessRiskOfLosingPermanentResidentStatusAdvanced(input);

      expect(advancedResult.rebuttablePresumption.applies).toBe(true);
      expect(advancedResult.rebuttablePresumption.maxDaysAbroad).toBe(199);
      expect(advancedResult.currentStatus).toBe('presumed_abandoned');
      expect(advancedResult.suggestions).toContain(
        'Prepare strong evidence to overcome presumption of abandonment',
      );
      expect(advancedResult.suggestions).toContain(
        'Document all US ties: property, employment, family, taxes',
      );
      expect(advancedResult.suggestions).toContain(
        'Consider hiring an immigration attorney before your next entry',
      );
    });

    it('should provide different guidance for trips over 365 days (harder to overcome)', () => {
      const trips400Days: Trip[] = [createTrip('2022-01-01', '2023-02-05')];
      const result400 = assessRiskOfLosingPermanentResidentStatus(trips400Days, '2020-01-01');

      expect(result400.overallRisk).toBe('automatic_loss');
      expect(result400.recommendations).toContain('Your green card is likely considered abandoned');
      expect(result400.recommendations).toContain(
        'You will need to apply for a returning resident visa (SB-1)',
      );

      // Test with advanced function for 365+ day trip
      const input: LPRStatusInput = {
        trips: [
          {
            departureDate: '2022-01-01',
            arrivalDate: '2023-02-05',
            destinationCountry: 'Unknown',
          },
        ],
        lprStartDate: '2020-01-01',
        currentDate: '2024-01-01',
      };

      const advancedResult = assessRiskOfLosingPermanentResidentStatusAdvanced(input);

      // Over 365 days does not trigger rebuttable presumption (it's automatic loss)
      expect(advancedResult.rebuttablePresumption.applies).toBe(false);
      expect(advancedResult.currentStatus).toBe('abandoned');
      expect(advancedResult.suggestions).toContain('Your LPR status appears to be abandoned');
      expect(advancedResult.suggestions).toContain(
        'Apply for SB-1 Returning Resident Visa before attempting to return',
      );
    });

    it('should handle calculateMaximumTripDuration with past rebuttable presumption trip', () => {
      // User had a 250-day trip in the past
      const pastTrips: Trip[] = [createTrip('2022-01-01', '2022-09-08')]; // 250 days total

      const result = calculateMaximumTripDurationToMaintainAllStatuses(
        pastTrips,
        '2020-01-01',
        'five_year',
        new Date('2024-01-01'),
      );

      expect(result.maximumDays).toBe(0);
      expect(result.limitingFactor).toBe('already_at_risk');
      expect(result.warnings).toContain(
        'You already have trips that put your continuous residence at risk',
      );
      // Should suggest legal consultation for rebuttable presumption
      expect(result.warnings).toContain(
        'Consult with an immigration attorney before any additional travel',
      );
    });
  });

  describe('2. Reentry Permit Lifecycle - Pending Status', () => {
    it('should handle pending reentry permit status with appropriate warnings', () => {
      const trips: Trip[] = [
        createTrip('2025-07-01', '2026-06-01'), // Planning 335-day trip
      ];

      // Test basic function behavior
      const result = assessRiskOfLosingPermanentResidentStatus(trips, '2023-01-01');
      expect(result.overallRisk).toBe('high_risk');
      expect(result.requiresReentryPermit).toBe(true);

      // Test advanced function with pending permit
      const input: LPRStatusInput = {
        trips: [
          {
            departureDate: '2025-07-01',
            arrivalDate: '2026-06-01',
            destinationCountry: 'Unknown',
          },
        ],
        lprStartDate: '2023-01-01',
        currentDate: '2025-06-01',
        reentryPermit: {
          status: 'pending',
          applicationDate: '2025-05-01',
        },
      };

      const advancedResult = assessRiskOfLosingPermanentResidentStatusAdvanced(input);

      // With pending permit, still at risk
      expect(advancedResult.reentryPermit.status).toBe('pending');
      expect(advancedResult.riskFactors.totalRiskScore).toBeGreaterThan(0);

      // Test permit protection check
      const permitProtection = determineIfReentryPermitProvidesProtectionAdvanced(
        335,
        { status: 'pending', applicationDate: '2025-05-01' },
        '2025-06-01',
      );

      expect(permitProtection.providesProtection).toBe(false);
      expect(permitProtection.warnings).toContain('Reentry permit is pending approval');
      expect(permitProtection.warnings).toContain('Protection not guaranteed until approved');
    });

    it('should calculate different maximum durations for pending vs approved permits', () => {
      // With approved permit
      const resultApproved = calculateMaximumTripDurationToMaintainAllStatuses(
        [],
        '2021-01-01',
        'five_year',
        new Date('2024-01-01'),
        {
          hasReentryPermit: true,
          permitExpiryDate: '2026-01-01',
        },
      );

      expect(resultApproved.lprStatusSafetyDays).toBe(669); // Protected up to 670 days

      // Without permit (similar to pending, since pending doesn't provide protection)
      const resultNoPemit = calculateMaximumTripDurationToMaintainAllStatuses(
        [],
        '2021-01-01',
        'five_year',
        new Date('2024-01-01'),
        {
          hasReentryPermit: false,
        },
      );

      expect(resultNoPemit.lprStatusSafetyDays).toBe(149); // Conservative without permit

      // Test advanced function with specific permit status
      const permitProtectionApproved = determineIfReentryPermitProvidesProtectionAdvanced(
        600,
        {
          status: 'approved',
          approvalDate: '2024-01-01',
          expirationDate: '2026-01-01',
        },
        '2024-06-01',
      );

      expect(permitProtectionApproved.providesProtection).toBe(true);
      expect(permitProtectionApproved.daysProtected).toBeGreaterThan(500); // Days until expiry

      const permitProtectionPending = determineIfReentryPermitProvidesProtectionAdvanced(
        600,
        {
          status: 'pending',
          applicationDate: '2024-01-01',
        },
        '2024-06-01',
      );

      expect(permitProtectionPending.providesProtection).toBe(false);
      expect(permitProtectionPending.warnings).toContain('Reentry permit is pending approval');
    });
  });

  describe('3. Conditional Permanent Residence (CPR) Scenarios', () => {
    it('should flag extreme risk for CPR traveling during I-751 filing window', () => {
      // Conditional resident with 2-year card expiring soon
      const lprStartDate = '2023-03-15';
      const currentDate = '2024-12-20'; // Within 90-day filing window

      // Trip that overlaps with filing window
      const trips: Trip[] = [
        createTrip('2024-11-01', '2025-02-01'), // Covers filing window - 91 days
      ];

      // Basic function doesn't distinguish conditional residents
      const result = assessRiskOfLosingPermanentResidentStatus(trips, lprStartDate);
      expect(result.overallRisk).toBe('none'); // Only 91 days, below warning threshold

      // Advanced function with conditional resident status
      const input: LPRStatusInput = {
        trips: [
          {
            departureDate: '2024-11-01',
            arrivalDate: '2025-02-01',
            destinationCountry: 'Unknown',
          },
        ],
        lprStartDate,
        currentDate,
        lprType: 'conditional',
        i751Status: 'not_applicable', // Haven't filed yet
      };

      const advancedResult = assessRiskOfLosingPermanentResidentStatusAdvanced(input);

      // Should identify CPR status and filing window
      expect(advancedResult.lprType).toBe('conditional');
      expect(advancedResult.i751Status).toBe('not_applicable');
      expect(advancedResult.suggestions).toContain('You are within the I-751 filing window');
      expect(advancedResult.suggestions).toContain(
        'File Form I-751 to remove conditions on your green card',
      );

      // Risk factors should include pending I-751
      expect(advancedResult.riskFactors.hasPendingI751).toBe(false); // Not filed yet
    });

    it('should calculate zero safe days for CPR approaching expiry without filed I-751', () => {
      // Test CPR past expiry date without I-751
      const input: LPRStatusInput = {
        trips: [],
        lprStartDate: '2023-03-15', // Got conditional GC 2 years ago
        currentDate: '2025-04-01', // Past expiry
        lprType: 'conditional',
        i751Status: 'not_applicable',
      };

      const advancedResult = assessRiskOfLosingPermanentResidentStatusAdvanced(input);

      // Should urgently recommend I-751 filing
      expect(advancedResult.lprType).toBe('conditional');
      expect(advancedResult.suggestions).toContain(
        'URGENT: Your conditional green card may have expired',
      );
      expect(advancedResult.suggestions).toContain(
        'Consult an immigration attorney about late I-751 filing',
      );

      // Test with pending I-751
      const inputWithPending: LPRStatusInput = {
        trips: [],
        lprStartDate: '2023-03-15',
        currentDate: '2025-01-01',
        lprType: 'conditional',
        i751Status: 'pending',
      };

      const resultWithPending = assessRiskOfLosingPermanentResidentStatusAdvanced(inputWithPending);
      expect(resultWithPending.riskFactors.hasPendingI751).toBe(true);
      expect(resultWithPending.riskFactors.totalRiskScore).toBeGreaterThan(0);
    });
  });

  describe('4. Pattern of Non-Residence Analysis', () => {
    it('should detect concerning patterns even without single long trips', () => {
      const trips: Trip[] = [];

      // Create pattern: 6 trips of ~4.5 months each over 3 years
      // Each individual trip is under 150 days (no single trip warning)
      for (let year = 2022; year <= 2024; year++) {
        trips.push(
          createTrip(`${year}-01-01`, `${year}-05-20`), // ~139 days
          createTrip(`${year}-07-01`, `${year}-11-18`), // ~139 days
        );
      }

      const result = assessRiskOfLosingPermanentResidentStatus(trips, '2020-01-01');

      // Basic function only looks at individual trips
      expect(result.overallRisk).toBe('none'); // No single trip triggers warning

      // Test pattern analysis function directly
      const patternAnalysis = analyzePatternOfNonResidence(trips, '2020-01-01', '2024-12-31');

      expect(patternAnalysis.hasPattern).toBe(true);
      expect(patternAnalysis.percentageTimeAbroad).toBeGreaterThan(45); // ~278 days per year abroad
      expect(patternAnalysis.avgDaysAbroadPerYear).toBeGreaterThan(165); // Average over 5 years
      expect(patternAnalysis.numberOfTrips).toBe(6);

      // Test with advanced function
      const input: LPRStatusInput = {
        trips: trips.map((t) => ({
          departureDate: t.departureDate,
          arrivalDate: t.returnDate,
          destinationCountry: 'Unknown',
        })),
        lprStartDate: '2020-01-01',
        currentDate: '2024-12-31',
      };

      const advancedResult = assessRiskOfLosingPermanentResidentStatusAdvanced(input);

      expect(advancedResult.patternAnalysis.hasPattern).toBe(true);
      expect(advancedResult.riskFactors.hasPatternOfNonResidence).toBe(true);
      expect(advancedResult.riskFactors.totalRiskScore).toBeGreaterThan(0);
      expect(advancedResult.suggestions).toContain('Your travel pattern suggests non-residence');
      expect(advancedResult.suggestions).toContain('Spend more continuous time in the US');
    });

    it('should calculate rolling window statistics for officer discretion risks', () => {
      // Create trips showing high percentage of time abroad
      const trips: Trip[] = [
        createTrip('2021-01-01', '2021-06-01'), // 150 days
        createTrip('2021-07-01', '2021-11-01'), // 122 days
        createTrip('2022-01-01', '2022-05-01'), // 119 days
        createTrip('2022-06-01', '2022-10-01'), // 121 days
        createTrip('2023-01-01', '2023-05-01'), // 119 days
        createTrip('2023-06-01', '2023-10-01'), // 121 days
      ];

      const patternAnalysis = analyzePatternOfNonResidence(trips, '2020-01-01', '2023-12-31');

      // Verify pattern detection
      expect(patternAnalysis.percentageTimeAbroad).toBeGreaterThan(40);
      expect(patternAnalysis.totalDaysAbroad).toBeGreaterThan(700);
      expect(patternAnalysis.hasPattern).toBe(true);
      expect(patternAnalysis.longestStayInUSA).toBeLessThanOrEqual(91);

      // Test with advanced function
      const input: LPRStatusInput = {
        trips: trips.map((t) => ({
          departureDate: t.departureDate,
          arrivalDate: t.returnDate,
          destinationCountry: 'Unknown',
        })),
        lprStartDate: '2020-01-01',
        currentDate: '2023-12-31',
      };

      const advancedResult = assessRiskOfLosingPermanentResidentStatusAdvanced(input);

      expect(advancedResult.patternAnalysis.hasPattern).toBe(true);
      expect(advancedResult.suggestions).toContain('Your travel pattern suggests non-residence');
      expect(advancedResult.suggestions).toContain('Maintain stronger US ties and documentation');
    });
  });

  describe('5. Government Service Exemptions (N-470)', () => {
    it('should handle approved N-470 for qualifying employment abroad', () => {
      // User with 3-year assignment abroad for qualifying US company
      const trips: Trip[] = [
        createTrip('2022-01-01', '2025-01-01'), // 3 years abroad
      ];

      // Basic function treats this as automatic loss
      const currentResult = assessRiskOfLosingPermanentResidentStatus(trips, '2020-01-01');
      expect(currentResult.overallRisk).toBe('automatic_loss');

      // Test with N-470 exemption using advanced function
      const input: LPRStatusInput = {
        trips: [
          {
            departureDate: '2022-01-01',
            arrivalDate: '2025-01-01',
            destinationCountry: 'Unknown',
          },
        ],
        lprStartDate: '2020-01-01',
        currentDate: '2024-06-01',
        n470Exemption: {
          status: 'approved',
          approvalDate: '2021-12-01',
          endDate: '2025-12-31',
          type: 'us_government',
        },
        reentryPermit: {
          status: 'approved',
          approvalDate: '2021-12-01',
          expirationDate: '2023-12-01',
        },
      };

      const advancedResult = assessRiskOfLosingPermanentResidentStatusAdvanced(input);

      expect(advancedResult.n470Exemption.status).toBe('approved');
      expect(advancedResult.suggestions).toContain(
        'N-470 exemption protects your continuous residence',
      );

      // Test calculateMaximumTripDurationWithExemptions
      const n470Exemption: N470Exemption = {
        status: 'approved',
        approvalDate: '2021-12-01',
        endDate: '2025-12-31',
        type: 'us_government',
      };

      const maxTripResult = calculateMaximumTripDurationWithExemptions(
        [],
        '2020-01-01',
        'five_year',
        new Date('2024-01-01'),
        { hasReentryPermit: true, permitExpiryDate: '2026-01-01' },
        n470Exemption,
      );

      // N-470 protects continuous residence
      expect(maxTripResult.continuousResidenceSafetyDays).toBe(730);
      expect(maxTripResult.warnings).toContain(
        'N-470 exemption protects continuous residence but not physical presence',
      );
      expect(maxTripResult.warnings).toContain(
        'You must still meet physical presence requirements for naturalization',
      );
    });

    it('should calculate naturalization eligibility correctly with N-470', () => {
      const longTrips: Trip[] = [
        createTrip('2021-01-01', '2021-05-01'), // 119 days
        createTrip('2022-01-01', '2022-05-01'), // 119 days
      ];

      // Test without N-470
      const resultWithoutN470 = calculateMaximumTripDurationToMaintainAllStatuses(
        longTrips,
        '2019-01-01',
        'five_year',
        new Date('2024-06-01'),
        { hasReentryPermit: true, permitExpiryDate: '2025-01-01' },
      );

      // Without N-470, should have limited days remaining
      expect(resultWithoutN470.limitingFactor).not.toBe('already_at_risk');
      expect(resultWithoutN470.continuousResidenceSafetyDays).toBe(149); // Can take another 149 days

      // Test with N-470 exemption
      const n470Exemption: N470Exemption = {
        status: 'approved',
        approvalDate: '2020-12-01',
        endDate: '2025-12-31',
        type: 'qualifying_organization',
      };

      const resultWithN470 = calculateMaximumTripDurationWithExemptions(
        longTrips,
        '2019-01-01',
        'five_year',
        new Date('2024-06-01'),
        { hasReentryPermit: true, permitExpiryDate: '2025-01-01' },
        n470Exemption,
      );

      // With N-470, continuous residence is protected
      expect(resultWithN470.continuousResidenceSafetyDays).toBe(730);
      expect(resultWithN470.limitingFactor).toBe('physical_presence');
      expect(resultWithN470.warnings).toContain(
        'N-470 exemption protects continuous residence but not physical presence',
      );

      // Physical presence is still constrained
      expect(resultWithN470.physicalPresenceSafetyDays).toBeLessThan(
        resultWithN470.continuousResidenceSafetyDays,
      );
    });
  });

  describe('6. Complex Combined Scenarios', () => {
    it('should handle CPR with pending permit and pattern concerns', () => {
      // Conditional resident with:
      // - Multiple short trips showing pattern
      // - Pending reentry permit
      // - Approaching I-751 window

      const trips: Trip[] = [
        createTrip('2024-01-01', '2024-04-20'), // 109 days
        createTrip('2024-05-01', '2024-08-15'), // 105 days
        createTrip('2024-09-01', '2024-12-10'), // 99 days
      ];

      // Basic function only sees individual trips
      const result = assessRiskOfLosingPermanentResidentStatus(trips, '2023-06-01');
      expect(result.overallRisk).toBe('none');

      // Enhanced version provides comprehensive risk assessment
      const input: LPRStatusInput = {
        trips: trips.map((t) => ({
          departureDate: t.departureDate,
          arrivalDate: t.returnDate,
          destinationCountry: 'Unknown',
        })),
        lprStartDate: '2023-06-01',
        currentDate: '2025-04-01', // Within I-751 window
        lprType: 'conditional',
        i751Status: 'not_applicable',
        reentryPermit: {
          status: 'pending',
          applicationDate: '2024-11-01',
        },
      };

      const advancedResult = assessRiskOfLosingPermanentResidentStatusAdvanced(input);

      // Complex assessment considering all factors
      expect(advancedResult.lprType).toBe('conditional');
      expect(advancedResult.reentryPermit.status).toBe('pending');
      expect(advancedResult.patternAnalysis.numberOfTrips).toBe(3);
      expect(advancedResult.suggestions).toContain('You are within the I-751 filing window');

      // Multiple risk factors contribute to overall score
      expect(advancedResult.riskFactors.totalRiskScore).toBeGreaterThan(0);
    });

    it('should prioritize risks appropriately (I-751 > LPR abandonment > naturalization)', () => {
      // Test that the system properly prioritizes different types of risks
      // when multiple issues are present

      // Scenario with multiple risks
      const input: LPRStatusInput = {
        trips: [
          {
            departureDate: '2024-01-01',
            arrivalDate: '2024-08-01', // 211 days - rebuttable presumption
            destinationCountry: 'Unknown',
          },
        ],
        lprStartDate: '2023-01-01', // Conditional resident
        currentDate: '2025-01-15', // Past I-751 window
        lprType: 'conditional',
        i751Status: 'not_applicable', // Haven't filed!
      };

      const result = assessRiskOfLosingPermanentResidentStatusAdvanced(input);

      // System should prioritize expired conditional GC over rebuttable presumption
      expect(result.suggestions[0]).toContain(
        'URGENT: Your conditional green card may have expired',
      );
      expect(result.suggestions[1]).toContain(
        'Consult an immigration attorney about late I-751 filing',
      );

      // Only after addressing I-751 should it mention rebuttable presumption
      const hasRebuttablePresumptionSuggestion = result.suggestions.some((s) =>
        s.includes('presumption of abandonment'),
      );
      expect(hasRebuttablePresumptionSuggestion).toBe(true);

      // Test another scenario: LPR abandonment vs naturalization
      const input2: LPRStatusInput = {
        trips: [
          {
            departureDate: '2023-01-01',
            arrivalDate: '2024-02-01', // 395 days - automatic loss
            destinationCountry: 'Unknown',
          },
        ],
        lprStartDate: '2020-01-01',
        currentDate: '2024-06-01',
        lprType: 'permanent',
      };

      const result2 = assessRiskOfLosingPermanentResidentStatusAdvanced(input2);

      // Should prioritize LPR abandonment over naturalization concerns
      expect(result2.currentStatus).toBe('abandoned');
      expect(result2.suggestions[0]).toContain('Your LPR status appears to be abandoned');
      expect(result2.suggestions[1]).toContain('Apply for SB-1 Returning Resident Visa');
    });
  });

  describe('7. Rebuttable Presumption Helper Function', () => {
    it('should correctly calculate rebuttable presumption for trips between 180-364 days', () => {
      // Test direct function
      const trips179Days: Trip[] = [createTrip('2024-01-01', '2024-06-29')]; // 178 days abroad
      const trips200Days: Trip[] = [createTrip('2024-01-01', '2024-07-20')]; // 199 days abroad
      const trips365Days: Trip[] = [createTrip('2024-01-01', '2025-01-01')]; // 364 days abroad

      const result179 = calculateRebuttablePresumption(trips179Days, new Date('2024-12-31'));
      const result200 = calculateRebuttablePresumption(trips200Days, new Date('2024-12-31'));
      const result365 = calculateRebuttablePresumption(trips365Days, new Date('2024-12-31'));

      // 179 days - no presumption (just under 180 threshold)
      expect(result179.applies).toBe(false);
      expect(result179.maxDaysAbroad).toBe(179);

      // 200 days - presumption applies
      expect(result200.applies).toBe(true);
      expect(result200.maxDaysAbroad).toBe(200);
      expect(result200.reason).toContain('creates rebuttable presumption of abandonment');

      // 364 days - no presumption (it's automatic loss at 365+)
      expect(result365.applies).toBe(false);
    });
  });
});
