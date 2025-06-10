/**
 * Barrel Export for All Schemas
 *
 * This file consolidates all schema exports from the schemas directory
 * for easier importing throughout the application.
 *
 * Usage: import { TripSchema, UserSchema, etc } from '@schemas'
 */

// Calculation Helpers
export {
  TripDurationOptions,
  TripDurationOptionsSchema,
  TripValidationRequirements,
  TripValidationRequirementsSchema,
} from './calculation-helpers';

// Compliance Helpers
export {
  ActiveComplianceItem,
  ActiveComplianceItemSchema,
  PriorityComplianceItem,
  PriorityComplianceItemSchema,
  UpcomingDeadline,
  UpcomingDeadlineSchema,
} from './compliance-helpers';

// Compliance
export {
  ComplianceCalculationParams,
  ComplianceCalculationParamsSchema,
  ComplianceStatus,
  ComplianceStatusSchema,
  ComprehensiveComplianceStatus,
  ComprehensiveComplianceStatusSchema,
  GreenCardRenewalStatus,
  GreenCardRenewalStatusSchema,
  RemovalOfConditionsStatus,
  RemovalOfConditionsStatusSchema,
  SelectiveServiceStatus,
  SelectiveServiceStatusSchema,
  TaxReminderStatus,
  TaxReminderStatusSchema,
} from './compliance';

// LPR Status - Enums and Risk Levels
export {
  ComprehensiveRiskAssessment,
  ComprehensiveRiskAssessmentSchema,
  ComprehensiveRiskLevel,
  ComprehensiveRiskLevelSchema,
  ContinuousResidenceRisk,
  ContinuousResidenceRiskSchema,
  GreenCardRiskResult,
  GreenCardRiskResultSchema,
  I751Status,
  I751StatusSchema,
  LimitingFactor,
  LimitingFactorSchema,
  LongestTripInfo,
  LongestTripInfoSchema,
  LPRRiskLevel,
  LPRRiskLevelSchema,
  LPRStatusAssessment,
  LPRStatusAssessmentAdvanced,
  LPRStatusAssessmentAdvancedSchema,
  LPRStatusAssessmentSchema,
  LPRStatusInput,
  LPRStatusInputSchema,
  LPRStatusRiskFactors,
  LPRStatusRiskFactorsSchema,
  LPRStatusType,
  LPRStatusTypeSchema,
  MaximumTripDurationResult,
  MaximumTripDurationResultSchema,
  N470Exemption,
  N470ExemptionSchema,
  N470Status,
  N470StatusSchema,
  PatternOfNonResidence,
  PatternOfNonResidenceSchema,
  PermitProtectedThresholds,
  PermitProtectedThresholdsSchema,
  RebuttablePresumption,
  RebuttablePresumptionSchema,
  ReentryPermit,
  ReentryPermitAdvancedSchema,
  ReentryPermitInfo,
  ReentryPermitInfoSchema,
  ReentryPermitProtection,
  ReentryPermitProtectionSchema,
  ReentryPermitStatus,
  ReentryPermitStatusSchema,
  TravelRiskDetails,
  TravelRiskDetailsSchema,
  TravelRiskLevelSchema,
} from './lpr-status';

// Notification
export {
  Notification,
  NotificationPreferences,
  NotificationPreferencesSchema,
  NotificationSchema,
} from './notification';

// Presence
export {
  ContinuousResidenceWarning,
  ContinuousResidenceWarningSchema,
  ContinuousResidenceWarningSimple,
  ContinuousResidenceWarningSimpleSchema,
  EligibilityDates,
  EligibilityDatesSchema,
  EligibilityMilestone,
  EligibilityMilestoneSchema,
  PresenceCalculation,
  PresenceCalculationResult,
  PresenceCalculationResultSchema,
  PresenceCalculationSchema,
  PresenceStatus,
  PresenceStatusDetails,
  PresenceStatusDetailsSchema,
  PresenceStatusSchema,
  ValidatedDateRange,
  ValidatedDateRangeSchema,
} from './presence';

// Travel Analytics Helpers
export {
  CountryData,
  countryDataSchema,
  PresenceStreak,
  presenceStreakSchema,
  RiskThresholds,
  riskThresholdsSchema,
  TravelBudgetRiskResult,
  travelBudgetRiskResultSchema,
  TravelRiskResult,
  travelRiskResultSchema,
  TripDateRange,
  tripDateRangeSchema,
  YearBoundaries,
  yearBoundariesSchema,
} from './travel-analytics-helpers';

// Travel Analytics
export {
  AnnualTravelSummary,
  annualTravelSummarySchema,
  CountryStatistics,
  countryStatisticsSchema,
  MilestoneInfo,
  milestoneInfoSchema,
  SafeTravelBudget,
  safeTravelBudgetSchema,
  TravelProjection,
  travelProjectionSchema,
  TravelStreak,
  travelStreakSchema,
  TripRiskAssessment,
  tripRiskAssessmentSchema,
  YearlyDaysAbroad,
  yearlyDaysAbroadSchema,
} from './travel-analytics';

// Trip
export {
  SimulatedTrip,
  SimulatedTripSchema,
  Trip,
  TripCreate,
  TripCreateSchema,
  TripSchema,
  TripUpdate,
  TripUpdateSchema,
} from './trip';

// User
export {
  AuthUser,
  AuthUserSchema,
  UserProfile,
  UserProfileSchema,
  UserSettings,
  UserSettingsSchema,
} from './user';

// Sync
export {
  SyncConflict,
  SyncConflictSchema,
  SyncDevice,
  SyncDeviceSchema,
  SyncMetadata,
  SyncMetadataSchema,
} from './sync';
