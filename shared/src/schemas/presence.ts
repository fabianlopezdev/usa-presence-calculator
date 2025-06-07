import { z } from 'zod';

/**
 * Presence calculation result schema
 * Contains all calculated values for physical presence tracking
 */
export const PresenceCalculationSchema = z.object({
  totalDaysInUSA: z.number().int().nonnegative(),
  totalDaysAbroad: z.number().int().nonnegative(),
  requiredDays: z.number().int().positive(),
  percentageComplete: z.number().min(0).max(100),
  daysRemaining: z.number().int().nonnegative(),
  eligibilityDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  earliestFilingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

/**
 * Overall presence status schema
 * Provides high-level status and messaging
 */
export const PresenceStatusSchema = z.object({
  status: z.enum(['on_track', 'at_risk', 'requirement_met']),
  message: z.string(),
});

/**
 * Continuous residence warning schema
 * Alerts for trips that may affect continuous residence requirement
 */
export const ContinuousResidenceWarningSchema = z.object({
  tripId: z.string().uuid(),
  daysAbroad: z.number().int().positive(),
  threshold: z.number().int().positive(),
  message: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
});

/**
 * Eligibility milestone schema
 * Tracks important milestones in the citizenship journey
 */
export const EligibilityMilestoneSchema = z.object({
  type: z.enum([
    'presence_requirement_met',
    'filing_window_open',
    'one_year_remaining',
    'six_months_remaining',
  ]),
  achievedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  message: z.string(),
});

// Type exports
export type PresenceCalculation = z.infer<typeof PresenceCalculationSchema>;
export type PresenceStatus = z.infer<typeof PresenceStatusSchema>;
export type ContinuousResidenceWarning = z.infer<typeof ContinuousResidenceWarningSchema>;
export type EligibilityMilestone = z.infer<typeof EligibilityMilestoneSchema>;
