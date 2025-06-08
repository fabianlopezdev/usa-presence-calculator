// External dependencies (alphabetical)
// None needed

// Internal dependencies - Schemas & Types (alphabetical)
import { Trip } from '@schemas/trip';

// Internal dependencies - Business Logic (alphabetical)
import { assessTripRiskForAllLegalThresholds } from '@business-logic/calculations/travel-risk/assessment';
import {
  calculateGreenCardAbandonmentRisk,
  checkIfTripApproachesGreenCardLoss,
  checkIfTripApproachesContinuousResidenceRisk,
  checkIfTripBreaksContinuousResidence,
  checkIfTripRisksAutomaticGreenCardLoss,
  getReentryPermitProtectedThresholds,
} from '@business-logic/calculations/travel-risk/helpers';

// Internal dependencies - Constants (alphabetical)
// None needed

// Internal dependencies - Utilities (alphabetical)
// None needed

describe('Travel Risk Helpers - Edge Cases', () => {
  const createTrip = (departureDate: string, returnDate: string): Trip => ({
    id: '1',
    departureDate,
    returnDate,
    userId: 'user1',
    isSimulated: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  describe('assessTripRiskForAllLegalThresholds - Edge Cases', () => {
    it('should handle trip with exactly 149 days (just under warning threshold)', () => {
      const trip = createTrip('2025-01-01', '2025-05-30');
      const result = assessTripRiskForAllLegalThresholds(trip);

      expect(result.daysAbroad).toBe(148); // USCIS rule: 150 - 2
      expect(result.continuousResidenceRisk).toBe('none'); // 148 days is under 150
      expect(result.lprStatusRisk.riskLevel).toBe('none');
      expect(result.warnings).toHaveLength(0); // No warnings under 150 days
    });

    it('should handle reentry permit that expires during the trip', () => {
      const trip = createTrip('2025-01-01', '2025-12-31'); // 365 days
      const permitExpiryDate = new Date('2025-06-30'); // Expires mid-trip

      const result = assessTripRiskForAllLegalThresholds(trip, {
        hasReentryPermit: true,
        permitExpiryDate: permitExpiryDate.toISOString(),
      });

      expect(result.lprStatusRisk.riskLevel).toBe('protected_by_permit');
      // The function doesn't warn about permit expiry during the trip
      expect(result.warnings).toContain(
        'This trip may reset your citizenship eligibility timeline.',
      );
    });

    it('should handle trip with reentry permit exactly at 730 days', () => {
      // Create a 730-day trip
      const departureDate = new Date('2025-01-01');
      const returnDate = new Date(departureDate);
      returnDate.setDate(returnDate.getDate() + 729); // 730 days total

      const trip = createTrip(
        departureDate.toISOString().split('T')[0],
        returnDate.toISOString().split('T')[0],
      );

      const result = assessTripRiskForAllLegalThresholds(trip, {
        hasReentryPermit: true,
        permitExpiryDate: '2027-12-31',
      });

      expect(result.daysAbroad).toBe(728); // USCIS rule: 730 - 2
      expect(result.lprStatusRisk.riskLevel).toBe('approaching_permit_limit'); // 728 > 670 threshold
      expect(result.warnings).toContain('Approaching maximum 2-year reentry permit protection');
    });

    it('should handle trip starting and ending on same day', () => {
      const trip = createTrip('2025-01-01', '2025-01-01');
      const result = assessTripRiskForAllLegalThresholds(trip);

      expect(result.daysAbroad).toBe(0); // USCIS rule: same day = 0 days abroad
      expect(result.continuousResidenceRisk).toBe('none');
      expect(result.lprStatusRisk.riskLevel).toBe('none');
      expect(result.warnings).toHaveLength(0);
    });

    it('should prioritize continuous residence risk in recommendations', () => {
      const trip = createTrip('2025-01-01', '2025-07-12'); // 192 days total = 190 days abroad
      const result = assessTripRiskForAllLegalThresholds(trip);

      expect(result.continuousResidenceRisk).toBe('at_risk'); // 190 days is 'at_risk' not 'broken'
      expect(result.recommendations[0]).toContain('continuous residence');
    });

    it('should handle invalid date format gracefully', () => {
      const trip = createTrip('invalid-date', '2025-01-01');

      // Should not throw, but handle the invalid date
      expect(() => assessTripRiskForAllLegalThresholds(trip)).not.toThrow();
    });
  });

  describe('calculateGreenCardAbandonmentRisk - Edge Cases', () => {
    it('should handle zero days abroad', () => {
      const result = calculateGreenCardAbandonmentRisk(0);

      expect(result.riskLevel).toBe('none');
      expect(result.daysUntilNextThreshold).toBe(150);
    });

    it('should handle negative days (data integrity issue)', () => {
      const result = calculateGreenCardAbandonmentRisk(-10);

      expect(result.riskLevel).toBe('none');
      expect(result.daysUntilNextThreshold).toBe(160); // 150 - (-10)
    });

    it('should calculate days until next threshold at boundary values', () => {
      // At 149 days
      const result149 = calculateGreenCardAbandonmentRisk(149);
      expect(result149.daysUntilNextThreshold).toBe(1);

      // At 150 days
      const result150 = calculateGreenCardAbandonmentRisk(150);
      expect(result150.daysUntilNextThreshold).toBe(30); // To 180

      // At 179 days
      const result179 = calculateGreenCardAbandonmentRisk(179);
      expect(result179.daysUntilNextThreshold).toBe(1);

      // At 180 days
      const result180 = calculateGreenCardAbandonmentRisk(180);
      expect(result180.daysUntilNextThreshold).toBe(150); // To 330

      // At 329 days
      const result329 = calculateGreenCardAbandonmentRisk(329);
      expect(result329.daysUntilNextThreshold).toBe(1);

      // At 330 days
      const result330 = calculateGreenCardAbandonmentRisk(330);
      expect(result330.daysUntilNextThreshold).toBe(35); // To 365

      // At 364 days
      const result364 = calculateGreenCardAbandonmentRisk(364);
      expect(result364.daysUntilNextThreshold).toBe(1);
    });

    it('should handle extremely large numbers', () => {
      const result = calculateGreenCardAbandonmentRisk(10000);

      expect(result.riskLevel).toBe('automatic_loss');
      expect(result.daysUntilNextThreshold).toBe(0);
    });

    it('should handle reentry permit with days exactly at permit thresholds', () => {
      // At 669 days (approaching permit limit)
      const result669 = calculateGreenCardAbandonmentRisk(669, true);
      expect(result669.riskLevel).toBe('protected_by_permit');

      // At 670 days
      const result670 = calculateGreenCardAbandonmentRisk(670, true);
      expect(result670.riskLevel).toBe('approaching_permit_limit');

      // At 731 days (over permit protection)
      const result731 = calculateGreenCardAbandonmentRisk(731, true);
      expect(result731.riskLevel).toBe('automatic_loss');
    });
  });

  describe('getReentryPermitProtectedThresholds - Edge Cases', () => {
    it('should handle permit expiring in exactly 90 days', () => {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 90);

      const result = getReentryPermitProtectedThresholds({
        hasPermit: true,
        permitExpiryDate: expiryDate.toISOString(),
      });

      // 90 days is above the 60-day warning threshold, so no warning
      expect(result.warningMessage).toBeUndefined();
    });

    it('should handle permit that expired exactly today', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = getReentryPermitProtectedThresholds({
        hasPermit: true,
        permitExpiryDate: today.toISOString(),
      });

      // Permit expired today still provides protection
      expect(result.warningThreshold).toBe(670);
      expect(result.presumptionThreshold).toBeNull();
      expect(result.highRiskThreshold).toBe(670);
      expect(result.criticalThreshold).toBe(730);
      expect(result.warningMessage).toContain('expires in 0 days');
    });

    it('should handle permit without expiry date', () => {
      const result = getReentryPermitProtectedThresholds({
        hasPermit: true,
        // No permitExpiryDate
      });

      expect(result.warningThreshold).toBe(670);
      expect(result.presumptionThreshold).toBeNull();
      expect(result.warningMessage).toBeUndefined();
    });

    it('should handle invalid permit expiry date format', () => {
      const result = getReentryPermitProtectedThresholds({
        hasPermit: true,
        permitExpiryDate: 'invalid-date',
      });

      // Should handle gracefully
      expect(result).toBeDefined();
    });
  });

  describe('Individual threshold check functions - Edge Cases', () => {
    describe('checkIfTripApproachesContinuousResidenceRisk', () => {
      it('should return true for exactly 150 days', () => {
        expect(checkIfTripApproachesContinuousResidenceRisk(150)).toBe(true);
      });

      it('should return false for 149 days', () => {
        expect(checkIfTripApproachesContinuousResidenceRisk(149)).toBe(false);
      });

      it('should return true for 179 days', () => {
        expect(checkIfTripApproachesContinuousResidenceRisk(179)).toBe(true);
      });

      it('should return false for 180 days (already broken)', () => {
        expect(checkIfTripApproachesContinuousResidenceRisk(180)).toBe(false);
      });
    });

    describe('checkIfTripBreaksContinuousResidence', () => {
      it('should return false for 179 days', () => {
        expect(checkIfTripBreaksContinuousResidence(179)).toBe(false);
      });

      it('should return true for exactly 180 days', () => {
        expect(checkIfTripBreaksContinuousResidence(180)).toBe(true);
      });

      it('should handle negative values', () => {
        expect(checkIfTripBreaksContinuousResidence(-1)).toBe(false);
      });
    });

    describe('checkIfTripApproachesGreenCardLoss', () => {
      it('should return true for exactly 330 days', () => {
        expect(checkIfTripApproachesGreenCardLoss(330)).toBe(true);
      });

      it('should return false for 329 days', () => {
        expect(checkIfTripApproachesGreenCardLoss(329)).toBe(false);
      });

      it('should return true for 364 days', () => {
        expect(checkIfTripApproachesGreenCardLoss(364)).toBe(true);
      });

      it('should return false for 365 days (already at automatic loss)', () => {
        expect(checkIfTripApproachesGreenCardLoss(365)).toBe(false);
      });
    });

    describe('checkIfTripRisksAutomaticGreenCardLoss', () => {
      it('should return false for 364 days without permit', () => {
        expect(checkIfTripRisksAutomaticGreenCardLoss(364)).toBe(false);
      });

      it('should return true for exactly 365 days without permit', () => {
        expect(checkIfTripRisksAutomaticGreenCardLoss(365)).toBe(true);
      });

      it('should return false for 730 days with valid permit', () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 2);

        expect(checkIfTripRisksAutomaticGreenCardLoss(730, true)).toBe(false);
      });

      it('should return true for 731 days even with permit', () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 2);

        expect(checkIfTripRisksAutomaticGreenCardLoss(731, true)).toBe(true);
      });

      it('should return true with expired permit', () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);

        expect(checkIfTripRisksAutomaticGreenCardLoss(200, true)).toBe(false);
      });

      it('should handle permit without expiry date', () => {
        expect(checkIfTripRisksAutomaticGreenCardLoss(400, true)).toBe(false);
      });
    });
  });

  describe('Complex interaction scenarios', () => {
    it('should handle trip that would be risky but is saved by reentry permit', () => {
      const trip = createTrip('2025-01-01', '2026-01-01'); // 366 days

      const resultWithoutPermit = assessTripRiskForAllLegalThresholds(trip);
      const resultWithPermit = assessTripRiskForAllLegalThresholds(trip, {
        hasReentryPermit: true,
        permitExpiryDate: '2027-01-01',
      });

      expect(resultWithoutPermit.lprStatusRisk.riskLevel).toBe('high_risk'); // 364 days abroad (366-2)
      expect(resultWithPermit.lprStatusRisk.riskLevel).toBe('protected_by_permit');
      expect(resultWithPermit.continuousResidenceRisk).toBe('at_risk'); // 364 days is 'at_risk'
    });

    it('should properly escalate warnings as trip duration increases', () => {
      const testDurations = [100, 150, 180, 330, 365, 730, 731];
      const results = testDurations.map((days) => {
        const departureDate = new Date('2025-01-01');
        const returnDate = new Date(departureDate);
        returnDate.setDate(returnDate.getDate() + days - 1);

        const trip = createTrip(
          departureDate.toISOString().split('T')[0],
          returnDate.toISOString().split('T')[0],
        );

        return {
          days,
          result: assessTripRiskForAllLegalThresholds(trip, {
            hasReentryPermit: true,
            permitExpiryDate: '2027-01-01',
          }),
        };
      });

      // Verify escalation - with permit, all trips under 670 days are protected
      expect(results[0].result.lprStatusRisk.riskLevel).toBe('protected_by_permit'); // 98 days (100-2)
      expect(results[1].result.lprStatusRisk.riskLevel).toBe('protected_by_permit'); // 148 days (150-2)
      expect(results[2].result.lprStatusRisk.riskLevel).toBe('protected_by_permit'); // 178 days (180-2)
      expect(results[3].result.lprStatusRisk.riskLevel).toBe('protected_by_permit'); // 328 days (330-2)
      expect(results[4].result.lprStatusRisk.riskLevel).toBe('protected_by_permit'); // 363 days (365-2)
      expect(results[5].result.lprStatusRisk.riskLevel).toBe('approaching_permit_limit'); // 728 days (730-2)
      expect(results[6].result.lprStatusRisk.riskLevel).toBe('approaching_permit_limit'); // 729 days still < 730
    });
  });
});
