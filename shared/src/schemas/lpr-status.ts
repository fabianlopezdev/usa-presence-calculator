import { z } from 'zod';

import { TripSchema } from '@schemas/trip';

// Advanced LPR Status Types
export const I751StatusSchema = z.enum(['not_applicable', 'pending', 'approved', 'denied']);

export const LPRStatusTypeSchema = z.enum(['permanent', 'conditional']);

export const N470StatusSchema = z.enum(['none', 'approved', 'pending']);

export const ReentryPermitStatusSchema = z.enum(['none', 'pending', 'approved', 'expired']);

// Schema for LPR risk levels
export const LPRRiskLevelSchema = z.enum([
  'none',
  'warning',
  'presumption_of_abandonment',
  'high_risk',
  'automatic_loss',
]);

// Schema for comprehensive risk levels including permit statuses
export const ComprehensiveRiskLevelSchema = z.enum([
  'none',
  'warning',
  'presumption_of_abandonment',
  'high_risk',
  'automatic_loss',
  'protected_by_permit',
  'approaching_permit_limit',
]);

// Extended risk levels for travel risk details
export const TravelRiskLevelSchema = z.enum([
  'none',
  'low',
  'medium',
  'warning',
  'high',
  'severe',
  'critical',
  'presumption_of_abandonment',
  'protected_by_permit',
  'approaching_permit_limit',
]);

// Travel risk details
export const TravelRiskDetailsSchema = z.object({
  riskLevel: TravelRiskLevelSchema,
  daysUntilNextThreshold: z.number(),
  message: z.string(),
}).strict();

// Schema for continuous residence risk
export const ContinuousResidenceRiskSchema = z.enum(['none', 'approaching', 'at_risk', 'broken']);

// Schema for limiting factors
export const LimitingFactorSchema = z.enum([
  'physical_presence',
  'continuous_residence_approaching',
  'lpr_status_warning',
  'reentry_permit_approaching_limit',
  'already_at_risk',
]);

// Schema for reentry permit info
export const ReentryPermitInfoSchema = z.object({
  hasReentryPermit: z.boolean(),
  permitExpiryDate: z.string().optional(),
}).strict();

// Schema for reentry permit protection assessment
export const ReentryPermitProtectionSchema = z.object({
  providesProtection: z.boolean(),
  daysProtected: z.number(),
  daysUntilExpiry: z.number(),
  warnings: z.array(z.string()),
}).strict();

// Schema for green card risk result
export const GreenCardRiskResultSchema = z.object({
  riskLevel: ComprehensiveRiskLevelSchema,
  daysUntilNextThreshold: z.number(),
  message: z.string(),
}).strict();

// Schema for longest trip info
export const LongestTripInfoSchema = z.object({
  trip: TripSchema,
  daysAbroad: z.number(),
  riskLevel: LPRRiskLevelSchema,
}).strict();

// Schema for LPR status assessment
export const LPRStatusAssessmentSchema = z.object({
  overallRisk: LPRRiskLevelSchema,
  longestTrip: LongestTripInfoSchema,
  currentYearTrips: z.number(),
  totalDaysAbroadCurrentYear: z.number(),
  recommendations: z.array(z.string()),
  requiresReentryPermit: z.boolean(),
}).strict();

// Schema for maximum trip duration result
export const MaximumTripDurationResultSchema = z.object({
  maximumDays: z.number(),
  limitingFactor: LimitingFactorSchema,
  physicalPresenceSafetyDays: z.number(),
  continuousResidenceSafetyDays: z.number(),
  lprStatusSafetyDays: z.number(),
  warnings: z.array(z.string()),
}).strict();

// Schema for comprehensive risk assessment
export const ComprehensiveRiskAssessmentSchema = z.object({
  physicalPresenceImpact: z.object({
    daysDeductedFromEligibility: z.number(),
    affectsNaturalizationTimeline: z.boolean(),
    message: z.string(),
  }).strict(),
  continuousResidenceImpact: z.object({
    breaksRequirement: z.boolean(),
    resetsEligibilityClock: z.boolean(),
    daysUntilBreak: z.number(),
    message: z.string(),
  }).strict(),
  lprStatusRisk: z.object({
    riskLevel: TravelRiskLevelSchema,
    daysUntilNextThreshold: z.number(),
    message: z.string(),
  }).strict(),
  overallRiskLevel: TravelRiskLevelSchema,
  continuousResidenceRisk: ContinuousResidenceRiskSchema,
  daysAbroad: z.number(),
  warnings: z.array(z.string()),
  recommendations: z.array(z.string()),
  metadata: z.object({
    daysAbroad: z.number(),
    hasReentryPermit: z.boolean(),
    assessmentDate: z.string(),
  }).strict(),
}).strict();

// Schema for permit protected thresholds
export const PermitProtectedThresholdsSchema = z.object({
  warningThreshold: z.number(),
  presumptionThreshold: z.number().nullable(),
  highRiskThreshold: z.number(),
  criticalThreshold: z.number(),
  warningMessage: z.string().optional(),
}).strict();

// Advanced schemas for enhanced LPR status assessment
export const N470ExemptionSchema = z.object({
  approvalDate: z.string().optional(),
  employer: z.string().optional(),
  endDate: z.string().optional(),
  startDate: z.string().optional(),
  status: N470StatusSchema,
  type: z.string().optional(),
}).strict();

export const PatternOfNonResidenceSchema = z.object({
  avgDaysAbroadPerYear: z.number(),
  hasPattern: z.boolean(),
  longestStayInUSA: z.number(),
  numberOfTrips: z.number(),
  percentageTimeAbroad: z.number(),
  shortestReturnToUSA: z.number(),
  totalDaysAbroad: z.number(),
  yearsCovered: z.number(),
}).strict();

export const RebuttablePresumptionSchema = z.object({
  applies: z.boolean(),
  daysSinceLastReturn: z.number().optional(),
  evidenceProvided: z.boolean().optional(),
  maxDaysAbroad: z.number().optional(),
  reason: z.string().optional(),
}).strict();

export const ReentryPermitAdvancedSchema = z.object({
  applicationDate: z.string().optional(),
  approvalDate: z.string().optional(),
  expirationDate: z.string().optional(),
  status: ReentryPermitStatusSchema,
}).strict();

export const LPRStatusRiskFactorsSchema = z.object({
  abandonedTaxResidency: z.boolean(),
  currentlyAbroad: z.boolean(),
  hasExpiredReentryPermit: z.boolean(),
  hasPatternOfNonResidence: z.boolean(),
  hasPendingI751: z.boolean(),
  hasRebuttablePresumption: z.boolean(),
  movedPermanentResidence: z.boolean(),
  totalRiskScore: z.number(),
}).strict();

export const LPRStatusAssessmentAdvancedSchema = z.object({
  currentStatus: z.enum(['maintained', 'at_risk', 'presumed_abandoned', 'abandoned']),
  i751Status: I751StatusSchema,
  lastEntryDate: z.string().optional(),
  lprType: LPRStatusTypeSchema,
  n470Exemption: N470ExemptionSchema,
  patternAnalysis: PatternOfNonResidenceSchema,
  rebuttablePresumption: RebuttablePresumptionSchema,
  reentryPermit: ReentryPermitAdvancedSchema,
  riskFactors: LPRStatusRiskFactorsSchema,
  suggestions: z.array(z.string()),
}).strict();

export const LPRStatusInputSchema = z.object({
  currentDate: z.string(),
  i751Status: I751StatusSchema.optional(),
  lprStartDate: z.string(),
  lprType: LPRStatusTypeSchema.optional(),
  n470Exemption: N470ExemptionSchema.optional(),
  reentryPermit: ReentryPermitAdvancedSchema.optional(),
  trips: z.array(
    z.object({
      arrivalDate: z.string().optional(),
      departureDate: z.string(),
      destinationCountry: z.string(),
      notes: z.string().optional(),
      purpose: z.string().optional(),
    }).strict(),
  ),
}).strict();

// Export types derived from schemas
export type ComprehensiveRiskAssessment = z.infer<typeof ComprehensiveRiskAssessmentSchema>;
export type ComprehensiveRiskLevel = z.infer<typeof ComprehensiveRiskLevelSchema>;
export type ContinuousResidenceRisk = z.infer<typeof ContinuousResidenceRiskSchema>;
export type GreenCardRiskResult = z.infer<typeof GreenCardRiskResultSchema>;
export type I751Status = z.infer<typeof I751StatusSchema>;
export type LimitingFactor = z.infer<typeof LimitingFactorSchema>;
export type LongestTripInfo = z.infer<typeof LongestTripInfoSchema>;
export type LPRRiskLevel = z.infer<typeof LPRRiskLevelSchema>;
export type LPRStatusAssessment = z.infer<typeof LPRStatusAssessmentSchema>;
export type LPRStatusAssessmentAdvanced = z.infer<typeof LPRStatusAssessmentAdvancedSchema>;
export type LPRStatusInput = z.infer<typeof LPRStatusInputSchema>;
export type LPRStatusRiskFactors = z.infer<typeof LPRStatusRiskFactorsSchema>;
export type LPRStatusType = z.infer<typeof LPRStatusTypeSchema>;
export type MaximumTripDurationResult = z.infer<typeof MaximumTripDurationResultSchema>;
export type N470Exemption = z.infer<typeof N470ExemptionSchema>;
export type N470Status = z.infer<typeof N470StatusSchema>;
export type PatternOfNonResidence = z.infer<typeof PatternOfNonResidenceSchema>;
export type PermitProtectedThresholds = z.infer<typeof PermitProtectedThresholdsSchema>;
export type RebuttablePresumption = z.infer<typeof RebuttablePresumptionSchema>;
export type ReentryPermit = z.infer<typeof ReentryPermitAdvancedSchema>;
export type ReentryPermitInfo = z.infer<typeof ReentryPermitInfoSchema>;
export type ReentryPermitProtection = z.infer<typeof ReentryPermitProtectionSchema>;
export type ReentryPermitStatus = z.infer<typeof ReentryPermitStatusSchema>;
export type TravelRiskDetails = z.infer<typeof TravelRiskDetailsSchema>;
