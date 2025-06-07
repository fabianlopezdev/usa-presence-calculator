import { 
  PresenceCalculationSchema, 
  PresenceStatusSchema, 
  ContinuousResidenceWarningSchema,
  EligibilityMilestoneSchema 
} from '../presence';

describe('Presence Schemas', () => {
  describe('PresenceCalculationSchema', () => {
    it('should validate complete presence calculation', () => {
      const calculation = {
        totalDaysInUSA: 913,
        totalDaysAbroad: 182,
        requiredDays: 913, // 2.5 years for 5-year path
        percentageComplete: 100,
        daysRemaining: 0,
        eligibilityDate: '2027-01-15',
        earliestFilingDate: '2026-10-17', // 90 days before
      };

      const result = PresenceCalculationSchema.safeParse(calculation);
      expect(result.success).toBe(true);
    });

    it('should validate partial progress calculation', () => {
      const calculation = {
        totalDaysInUSA: 500,
        totalDaysAbroad: 100,
        requiredDays: 913,
        percentageComplete: 54.8,
        daysRemaining: 413,
        eligibilityDate: '2027-06-20',
        earliestFilingDate: '2027-03-22',
      };

      const result = PresenceCalculationSchema.safeParse(calculation);
      expect(result.success).toBe(true);
    });

    it('should reject negative values', () => {
      const calculation = {
        totalDaysInUSA: -10,
        totalDaysAbroad: 20,
        requiredDays: 913,
        percentageComplete: -1.1,
        daysRemaining: 923,
        eligibilityDate: '2027-01-15',
        earliestFilingDate: '2026-10-17',
      };

      const result = PresenceCalculationSchema.safeParse(calculation);
      expect(result.success).toBe(false);
    });

    it('should reject percentage over 100', () => {
      const calculation = {
        totalDaysInUSA: 1000,
        totalDaysAbroad: 100,
        requiredDays: 913,
        percentageComplete: 109.5,
        daysRemaining: 0,
        eligibilityDate: '2027-01-15',
        earliestFilingDate: '2026-10-17',
      };

      const result = PresenceCalculationSchema.safeParse(calculation);
      expect(result.success).toBe(false);
    });
  });

  describe('PresenceStatusSchema', () => {
    it('should validate on track status', () => {
      const status = {
        status: 'on_track' as const,
        message: "You're on track! Keep it up!",
      };

      const result = PresenceStatusSchema.safeParse(status);
      expect(result.success).toBe(true);
    });

    it('should validate at risk status', () => {
      const status = {
        status: 'at_risk' as const,
        message: 'Your upcoming trip may affect your eligibility',
      };

      const result = PresenceStatusSchema.safeParse(status);
      expect(result.success).toBe(true);
    });

    it('should validate requirement met status', () => {
      const status = {
        status: 'requirement_met' as const,
        message: 'Congratulations! You have met the physical presence requirement!',
      };

      const result = PresenceStatusSchema.safeParse(status);
      expect(result.success).toBe(true);
    });
  });

  describe('ContinuousResidenceWarningSchema', () => {
    it('should validate warning for long trip', () => {
      const warning = {
        tripId: '123e4567-e89b-12d3-a456-426614174000',
        daysAbroad: 185,
        threshold: 180,
        message: 'This trip exceeds 180 days and may affect your continuous residence',
        severity: 'high' as const,
      };

      const result = ContinuousResidenceWarningSchema.safeParse(warning);
      expect(result.success).toBe(true);
    });

    it('should validate medium severity warning', () => {
      const warning = {
        tripId: '123e4567-e89b-12d3-a456-426614174000',
        daysAbroad: 170,
        threshold: 180,
        message: 'This trip is approaching the 180-day threshold',
        severity: 'medium' as const,
      };

      const result = ContinuousResidenceWarningSchema.safeParse(warning);
      expect(result.success).toBe(true);
    });
  });

  describe('EligibilityMilestoneSchema', () => {
    it('should validate presence requirement met milestone', () => {
      const milestone = {
        type: 'presence_requirement_met' as const,
        achievedDate: '2024-06-15',
        message: 'You have achieved the required physical presence!',
      };

      const result = EligibilityMilestoneSchema.safeParse(milestone);
      expect(result.success).toBe(true);
    });

    it('should validate filing window open milestone', () => {
      const milestone = {
        type: 'filing_window_open' as const,
        achievedDate: '2024-10-17',
        message: 'You can now file your N-400 application!',
      };

      const result = EligibilityMilestoneSchema.safeParse(milestone);
      expect(result.success).toBe(true);
    });

    it('should validate one year remaining milestone', () => {
      const milestone = {
        type: 'one_year_remaining' as const,
        achievedDate: '2023-06-15',
        message: 'One year until you can apply for citizenship!',
      };

      const result = EligibilityMilestoneSchema.safeParse(milestone);
      expect(result.success).toBe(true);
    });
  });
});