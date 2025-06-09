# Security Implementation Tasks

## Pre-Implementation Checks
- [x] ESLint max-lines: 300 (350 for presence-calculator.ts)
- [x] ESLint complexity: 10
- [x] ESLint max-depth: 4
- [x] ESLint max-lines-per-function: 50
- [x] All aliases configured in tsconfig: @schemas, @business-logic, @utils, @types, @constants

## Phase 1: Critical Security Fixes

### 1.1 Add .strict() to Schemas (89 total)

#### calculation-helpers.ts (2 schemas)
- [ ] TripDurationOptionsSchema
- [ ] TripValidationRequirementsSchema
- [ ] Commit: `fix: add strict to calculation helper schemas`
- [ ] Tests pass
- [ ] Checklist verified

#### compliance-helpers.ts (3 schemas)
- [ ] ActiveComplianceItemSchema
- [ ] PriorityComplianceItemSchema
- [ ] UpcomingDeadlineSchema
- [ ] Commit: `fix: add strict to compliance helper schemas`
- [ ] Tests pass
- [ ] Checklist verified

#### compliance.ts (7 schemas)
- [ ] ComplianceCalculationParamsSchema
- [ ] ComplianceItemSchema
- [ ] ComplianceStatusSchema
- [ ] ComprehensiveComplianceStatusSchema
- [ ] GreenCardRenewalStatusSchema
- [ ] RemovalOfConditionsStatusSchema
- [ ] SelectiveServiceStatusSchema
- [ ] TaxReminderStatusSchema
- [ ] Commit: `fix: add strict to compliance schemas`
- [ ] Tests pass
- [ ] Checklist verified

#### lpr-status.ts (28 schemas)
##### Part 1/4 - Status Enums
- [ ] I751StatusSchema
- [ ] LPRStatusTypeSchema
- [ ] N470StatusSchema
- [ ] ReentryPermitStatusSchema
- [ ] LPRRiskLevelSchema
- [ ] ComprehensiveRiskLevelSchema
- [ ] TravelRiskLevelSchema
- [ ] Commit: `fix: add strict to lpr status enums`

##### Part 2/4 - Core Schemas
- [ ] AnalysisResultSchema
- [ ] AnalysisSchema
- [ ] ComprehensiveRiskAssessmentSchema
- [ ] CurrentLPRStatusSchema
- [ ] GreenCardRiskResultSchema
- [ ] LongestTripInfoSchema
- [ ] LPRStatusAssessmentSchema
- [ ] Commit: `fix: add strict to lpr core schemas`

##### Part 3/4 - Advanced Schemas
- [ ] AdvancedLPRStatusParamsSchema
- [ ] LPRStatusAssessmentAdvancedSchema
- [ ] LPRStatusInputSchema
- [ ] LPRStatusRiskFactorsSchema
- [ ] MaximumTripCalculationParamsSchema
- [ ] MaximumTripDurationResultSchema
- [ ] N470ExemptionSchema
- [ ] Commit: `fix: add strict to lpr advanced schemas`

##### Part 4/4 - Risk & Permit Schemas
- [ ] PatternOfNonResidenceSchema
- [ ] PermitProtectedThresholdsSchema
- [ ] RebuttablePresumptionSchema
- [ ] ReentryPermitInfoSchema
- [ ] ReentryPermitProtectionSchema
- [ ] ReentryPermitSchema
- [ ] RiskFactorsSchema
- [ ] TravelRiskDetailsSchema
- [ ] TripRiskAssessmentParamsSchema
- [ ] Commit: `fix: add strict to lpr risk schemas`

#### notification.ts (2 schemas)
- [ ] NotificationSchema
- [ ] NotificationPreferencesSchema
- [ ] Commit: `fix: add strict to notification schemas`
- [ ] Tests pass
- [ ] Checklist verified

#### presence.ts (10 schemas)
- [ ] ContinuousResidenceResultSchema
- [ ] ContinuousResidenceWarningSchema
- [ ] ContinuousResidenceWarningSimpleSchema
- [ ] DateValidationResultSchema
- [ ] EligibilityDatesSchema
- [ ] EligibilityMilestoneSchema
- [ ] PresenceCalculationResultSchema
- [ ] PresenceCalculationSchema
- [ ] PresenceStatusDetailsSchema
- [ ] PresenceStatusSchema
- [ ] ValidatedDateRangeSchema
- [ ] Commit: `fix: add strict to presence schemas`
- [ ] Tests pass
- [ ] Checklist verified

#### travel-analytics-helpers.ts (11 schemas)
- [ ] CountryDataSchema
- [ ] CountryStatisticsOutputSchema
- [ ] PresenceStreakDataSchema
- [ ] PresenceStreakSchema
- [ ] TravelRiskDetailsHelperSchema
- [ ] TravelStreakOutputSchema
- [ ] TripDateRangeSchema
- [ ] TripMetricsSchema
- [ ] TripRiskAssessmentOutputSchema
- [ ] TripWithYearSchema
- [ ] YearBoundariesSchema
- [ ] Commit: `fix: add strict to travel analytics helper schemas`
- [ ] Tests pass
- [ ] Checklist verified

#### travel-analytics.ts (15 schemas)
- [ ] AnnualTravelSummarySchema
- [ ] CountryStatisticsSchema
- [ ] DaysAbroadByYearOutputSchema
- [ ] DestinationSummarySchema
- [ ] MilestoneInfoSchema
- [ ] SafeTravelBudgetSchema
- [ ] TravelInsightSchema
- [ ] TravelProjectionAssumptionsSchema
- [ ] TravelProjectionSchema
- [ ] TravelStreakSchema
- [ ] TripRiskAssessmentSchema
- [ ] YearComparisonSchema
- [ ] YearSummaryMetricsSchema
- [ ] YearlyDaysAbroadSchema
- [ ] YearlyTravelDataSchema
- [ ] Commit: `fix: add strict to travel analytics schemas`
- [ ] Tests pass
- [ ] Checklist verified

#### trip.ts (4 schemas)
- [ ] SimulatedTripSchema
- [ ] TripCreateSchema
- [ ] TripSchema
- [ ] TripUpdateSchema
- [ ] Commit: `fix: add strict to trip schemas`
- [ ] Tests pass
- [ ] Checklist verified

#### user.ts (3 schemas)
- [ ] AuthUserSchema
- [ ] UserProfileSchema
- [ ] UserSettingsSchema
- [ ] Commit: `fix: add strict to user schemas`
- [ ] Tests pass
- [ ] Checklist verified

### 1.2 Replace z.any() in Notification Schema
- [ ] Define NotificationDataValueSchema union type
- [ ] Update NotificationSchema to use new type
- [ ] Update notification tests for security
- [ ] Commit: `fix: replace any type in notification schema`
- [ ] Tests pass
- [ ] Checklist verified

## Phase 2: High Priority Improvements

### 2.1 Implement Comprehensive Error Handling
- [ ] Create error infrastructure file
- [ ] Define USCISCalculationError class
- [ ] Define USCISValidationError class
- [ ] Define Result type pattern
- [ ] Commit: `feat: create error infrastructure`
- [ ] Implement safe wrapper functions per domain
- [ ] Tests for error handling
- [ ] Checklist verified

### 2.2 Add Security-Focused Tests
- [ ] Create security test infrastructure
- [ ] Define malicious input constants
- [ ] Test excess property rejection per schema
- [ ] Test prototype pollution attempts
- [ ] Test XSS prevention
- [ ] Test SQL injection strings
- [ ] Commit: `test: add comprehensive security tests`
- [ ] All tests pass
- [ ] Checklist verified

## Phase 3: Medium Priority Enhancements

### 3.1 Add Zod Validation at Function Boundaries
- [ ] Identify all public API functions
- [ ] Create input validation schemas
- [ ] Implement validation at boundaries
- [ ] Update function signatures
- [ ] Commit per module
- [ ] Tests pass
- [ ] Checklist verified

### 3.2 Improve Test Coverage for Edge Cases
- [ ] Analyze coverage report
- [ ] Add malicious input tests
- [ ] Add boundary value tests
- [ ] Add performance tests
- [ ] Commit: `test: enhance edge case coverage`
- [ ] Checklist verified

## Phase 4: Low Priority Optimizations

### 4.1 Refactor for Better Modularity
- [ ] Create barrel exports
- [ ] Implement dependency injection patterns
- [ ] Reduce module coupling
- [ ] Commit per module
- [ ] Tests pass
- [ ] Checklist verified

### 4.2 Add Performance Monitoring
- [ ] Implement schema caching
- [ ] Add validation timing
- [ ] Create performance benchmarks
- [ ] Commit: `perf: add performance monitoring`
- [ ] Checklist verified

## Verification Checklist (Before EVERY Commit)
- [ ] Branch name follows pattern: `type/description`
- [ ] Commit message is one line, follows conventional format
- [ ] No ESLint warnings or errors
- [ ] Complexity limits not exceeded
- [ ] Line count limits not exceeded
- [ ] All names are ultra-descriptive and self-documenting
- [ ] No unnecessary comments (only explain WHY when needed)
- [ ] Comments explain WHY not WHAT
- [ ] Imports use aliases (@schemas, @utils, @constants, @business-logic)
- [ ] External imports first, sorted alphabetically
- [ ] Internal imports second, sorted alphabetically
- [ ] Exported functions first, sorted alphabetically
- [ ] Non-exported functions after, sorted alphabetically
- [ ] No inline types or constants
- [ ] All constants in appropriate constants files
- [ ] All schemas in appropriate schema files
- [ ] All tests pass
- [ ] Task list updated and checked

## Completion Tracking
- [ ] Phase 1 Complete
- [ ] Phase 2 Complete
- [ ] Phase 3 Complete
- [ ] Phase 4 Complete
- [ ] Final Security Audit
- [ ] Documentation Updated
- [ ] PR Created and Reviewed