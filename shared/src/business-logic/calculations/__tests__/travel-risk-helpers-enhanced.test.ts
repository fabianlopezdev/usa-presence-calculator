// External dependencies (alphabetical)
// None needed

// Internal dependencies - Schemas & Types (alphabetical)
import { Trip } from '@schemas/trip';

// Internal dependencies - Business Logic (alphabetical)
import {
  assessTripRiskForAllLegalThresholds,
  calculateGreenCardAbandonmentRisk,
  checkIfTripApproachesContinuousResidenceRisk,
  checkIfTripApproachesGreenCardLoss,
  checkIfTripBreaksContinuousResidence,
  checkIfTripRisksAutomaticGreenCardLoss,
  getReentryPermitProtectedThresholds,
} from '@business-logic/calculations/travel-risk-helpers';

// Internal dependencies - Constants (alphabetical)
import { LPR_ABANDONMENT_THRESHOLDS, REENTRY_PERMIT_RULES } from '@constants/uscis-rules';

// Internal dependencies - Utilities (alphabetical)
// None needed

describe('Enhanced Travel Risk Assessment', () => {
  describe('assessTripRiskForAllLegalThresholds', () => {
    it('should return all clear for short trips under 150 days', () => {
      const trip: Trip = {
        id: '1',
        departureDate: '2024-01-01',
        returnDate: '2024-03-15', // 73 days abroad (USCIS rule)
        userId: 'user1',
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = assessTripRiskForAllLegalThresholds(trip);

      expect(result.continuousResidenceRisk).toBe('none');
      expect(result.lprStatusRisk.riskLevel).toBe('none');
      expect(result.daysAbroad).toBe(73); // USCIS rule: departure/return days count as IN USA
      expect(result.warnings).toEqual([]);
      expect(result.recommendations).toEqual([]);
    });

    it('should warn about approaching continuous residence risk at 150+ days', () => {
      const trip: Trip = {
        id: '1',
        departureDate: '2024-01-01',
        returnDate: '2024-06-05', // 155 days abroad (USCIS rule)
        userId: 'user1',
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = assessTripRiskForAllLegalThresholds(trip);

      expect(result.continuousResidenceRisk).toBe('approaching');
      expect(result.lprStatusRisk.riskLevel).toBe('warning');
      expect(result.daysAbroad).toBe(155);
      expect(result.warnings).toEqual([
        'Your trip is approaching 180 days. Plan your return to protect your continuous residence.',
        'Extended absence detected. Maintain strong ties to the U.S.',
      ]);
      expect(result.recommendations).toEqual([
        'Consider returning before 180 days to avoid presumption of breaking continuous residence',
        'Keep evidence of U.S. ties (employment, home, family)',
      ]);
    });

    it('should flag high risk at 180+ days', () => {
      const trip: Trip = {
        id: '1',
        departureDate: '2024-01-01',
        returnDate: '2024-07-10', // 190 days abroad (USCIS rule)
        userId: 'user1',
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = assessTripRiskForAllLegalThresholds(trip);

      expect(result.continuousResidenceRisk).toBe('at_risk');
      expect(result.lprStatusRisk.riskLevel).toBe('presumption_of_abandonment');
      expect(result.daysAbroad).toBe(190);
      expect(result.warnings).toEqual([
        'This trip may reset your citizenship eligibility timeline.',
        'Creates rebuttable presumption of abandoning permanent residence.',
      ]);
      expect(result.recommendations).toEqual([
        'Return immediately to minimize impact on continuous residence',
        'Prepare evidence to overcome presumption of abandonment',
        'Consult with an immigration attorney',
      ]);
    });

    it('should flag critical risk at 330+ days', () => {
      const trip: Trip = {
        id: '1',
        departureDate: '2024-01-01',
        returnDate: '2024-11-30', // 333 days abroad (USCIS rule)
        userId: 'user1',
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = assessTripRiskForAllLegalThresholds(trip);

      expect(result.continuousResidenceRisk).toBe('at_risk');
      expect(result.lprStatusRisk.riskLevel).toBe('high_risk');
      expect(result.daysAbroad).toBe(333);
      expect(result.warnings).toEqual([
        'This trip may reset your citizenship eligibility timeline.',
        'Your trip is approaching one year. Your green card may be at risk.',
        'Continuous residence presumption already broken.',
      ]);
      expect(result.recommendations).toEqual([
        'Return immediately to minimize impact on continuous residence',
        'Return IMMEDIATELY - approaching automatic loss of LPR status',
        'Do NOT exceed 365 days under any circumstances',
        'Seek immediate legal counsel',
      ]);
    });

    it('should flag automatic loss at 365+ days', () => {
      const trip: Trip = {
        id: '1',
        departureDate: '2024-01-01',
        returnDate: '2025-01-05', // 369 days abroad (USCIS rule)
        userId: 'user1',
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = assessTripRiskForAllLegalThresholds(trip);

      expect(result.continuousResidenceRisk).toBe('broken');
      expect(result.lprStatusRisk.riskLevel).toBe('automatic_loss');
      expect(result.daysAbroad).toBe(369);
      expect(result.warnings).toEqual([
        'Continuous residence has been definitively broken.',
        'Urgent: This extended absence may result in loss of your permanent resident status.',
      ]);
      expect(result.recommendations).toContain('Your naturalization timeline has been reset');
      expect(result.recommendations).toContain('Seek immediate legal representation');
      expect(result.recommendations).toContain(
        'You may need to apply for a returning resident visa (SB-1)',
      );
    });

    it('should handle trips with reentry permit protection', () => {
      const trip: Trip = {
        id: '1',
        departureDate: '2024-01-01',
        returnDate: '2024-08-15', // 226 days abroad (USCIS rule)
        userId: 'user1',
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = assessTripRiskForAllLegalThresholds(trip, {
        hasReentryPermit: true,
        permitExpiryDate: '2025-12-31',
      });

      expect(result.continuousResidenceRisk).toBe('at_risk'); // Still affects naturalization
      expect(result.lprStatusRisk.riskLevel).toBe('protected_by_permit');
      expect(result.daysAbroad).toBe(226);
      expect(result.warnings).toEqual([
        'This trip may reset your citizenship eligibility timeline.',
        'Your reentry permit protects your LPR status for this trip.',
      ]);
      expect(result.recommendations).toEqual([
        'Return immediately to minimize impact on continuous residence',
        'Reentry permit protects green card but not continuous residence for naturalization',
        'Consider shorter trips if maintaining citizenship timeline is important',
      ]);
    });
  });

  describe('calculateGreenCardAbandonmentRisk', () => {
    it('should return no risk for trips under 150 days', () => {
      const result = calculateGreenCardAbandonmentRisk(120);
      expect(result).toEqual({
        riskLevel: 'none',
        daysUntilNextThreshold: 30,
        message: 'No risk to permanent resident status',
      });
    });

    it('should return warning for trips 150-179 days', () => {
      const result = calculateGreenCardAbandonmentRisk(160);
      expect(result).toEqual({
        riskLevel: 'warning',
        daysUntilNextThreshold: 20,
        message: 'Extended absence detected. Maintain strong ties to the U.S.',
      });
    });

    it('should return presumption of abandonment for trips 180-329 days', () => {
      const result = calculateGreenCardAbandonmentRisk(200);
      expect(result).toEqual({
        riskLevel: 'presumption_of_abandonment',
        daysUntilNextThreshold: 130,
        message: 'Creates rebuttable presumption of abandoning permanent residence.',
      });
    });

    it('should return high risk for trips 330-364 days', () => {
      const result = calculateGreenCardAbandonmentRisk(350);
      expect(result).toEqual({
        riskLevel: 'high_risk',
        daysUntilNextThreshold: 15,
        message: 'Your green card is at serious risk. Return immediately.',
      });
    });

    it('should return automatic loss for trips 365+ days', () => {
      const result = calculateGreenCardAbandonmentRisk(400);
      expect(result).toEqual({
        riskLevel: 'automatic_loss',
        daysUntilNextThreshold: 0,
        message: 'Risk of automatic loss of permanent resident status.',
      });
    });

    it('should handle reentry permit protection up to 730 days', () => {
      const result = calculateGreenCardAbandonmentRisk(500, true);
      expect(result).toEqual({
        riskLevel: 'protected_by_permit',
        daysUntilNextThreshold: 230,
        message: 'Protected by reentry permit. Valid for up to 2 years.',
      });
    });

    it('should warn when approaching reentry permit limit', () => {
      const result = calculateGreenCardAbandonmentRisk(680, true);
      expect(result).toEqual({
        riskLevel: 'approaching_permit_limit',
        daysUntilNextThreshold: 50,
        message: 'Approaching 2-year reentry permit limit. Plan return soon.',
      });
    });
  });

  describe('getReentryPermitProtectedThresholds', () => {
    it('should return standard thresholds when no permit', () => {
      const result = getReentryPermitProtectedThresholds();
      expect(result).toEqual({
        warningThreshold: LPR_ABANDONMENT_THRESHOLDS.WARNING,
        presumptionThreshold: LPR_ABANDONMENT_THRESHOLDS.PRESUMPTION_OF_ABANDONMENT,
        highRiskThreshold: LPR_ABANDONMENT_THRESHOLDS.HIGH_RISK,
        criticalThreshold: LPR_ABANDONMENT_THRESHOLDS.AUTOMATIC_LOSS,
      });
    });

    it('should return extended thresholds with valid permit', () => {
      const permitExpiry = new Date();
      permitExpiry.setFullYear(permitExpiry.getFullYear() + 1);

      const result = getReentryPermitProtectedThresholds({
        hasPermit: true,
        permitExpiryDate: permitExpiry.toISOString(),
      });

      expect(result).toEqual({
        warningThreshold: REENTRY_PERMIT_RULES.APPROACHING_LIMIT_DAYS,
        presumptionThreshold: null, // No presumption with valid permit
        highRiskThreshold: REENTRY_PERMIT_RULES.MAXIMUM_PROTECTION_DAYS - 60,
        criticalThreshold: REENTRY_PERMIT_RULES.MAXIMUM_PROTECTION_DAYS,
      });
    });

    it('should warn when permit is expiring soon', () => {
      const permitExpiry = new Date();
      permitExpiry.setDate(permitExpiry.getDate() + 30); // Expires in 30 days

      const result = getReentryPermitProtectedThresholds({
        hasPermit: true,
        permitExpiryDate: permitExpiry.toISOString(),
      });

      expect(result.warningMessage).toBe(
        'Reentry permit expires in 30 days. Return before expiry to maintain protection.',
      );
    });
  });

  describe('Individual threshold check functions', () => {
    describe('checkIfTripApproachesContinuousResidenceRisk', () => {
      it('should return true for trips 150-179 days', () => {
        expect(checkIfTripApproachesContinuousResidenceRisk(160)).toBe(true);
      });

      it('should return false for trips under 150 days', () => {
        expect(checkIfTripApproachesContinuousResidenceRisk(140)).toBe(false);
      });

      it('should return false for trips 180+ days (already at risk)', () => {
        expect(checkIfTripApproachesContinuousResidenceRisk(190)).toBe(false);
      });
    });

    describe('checkIfTripBreaksContinuousResidence', () => {
      it('should return true for trips 180+ days', () => {
        expect(checkIfTripBreaksContinuousResidence(200)).toBe(true);
        expect(checkIfTripBreaksContinuousResidence(365)).toBe(true);
      });

      it('should return false for trips under 180 days', () => {
        expect(checkIfTripBreaksContinuousResidence(179)).toBe(false);
      });
    });

    describe('checkIfTripApproachesGreenCardLoss', () => {
      it('should return true for trips 330-364 days', () => {
        expect(checkIfTripApproachesGreenCardLoss(340)).toBe(true);
      });

      it('should return false for trips under 330 days', () => {
        expect(checkIfTripApproachesGreenCardLoss(320)).toBe(false);
      });

      it('should return false for trips 365+ days (already at automatic loss)', () => {
        expect(checkIfTripApproachesGreenCardLoss(370)).toBe(false);
      });
    });

    describe('checkIfTripRisksAutomaticGreenCardLoss', () => {
      it('should return true for trips 365+ days without permit', () => {
        expect(checkIfTripRisksAutomaticGreenCardLoss(365)).toBe(true);
        expect(checkIfTripRisksAutomaticGreenCardLoss(400)).toBe(true);
      });

      it('should return false for trips under 365 days', () => {
        expect(checkIfTripRisksAutomaticGreenCardLoss(364)).toBe(false);
      });

      it('should return false for trips with valid reentry permit', () => {
        expect(checkIfTripRisksAutomaticGreenCardLoss(400, true)).toBe(false);
      });

      it('should return true even with permit if over 730 days', () => {
        expect(checkIfTripRisksAutomaticGreenCardLoss(731, true)).toBe(true);
      });
    });
  });
});
