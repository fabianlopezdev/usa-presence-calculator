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
- [x] TripDurationOptionsSchema
- [x] TripValidationRequirementsSchema
- [x] Commit: `fix: add strict to calculation helper schemas`
- [x] Tests pass
- [x] Checklist verified

#### compliance-helpers.ts (3 schemas)
- [x] ActiveComplianceItemSchema
- [x] PriorityComplianceItemSchema
- [x] UpcomingDeadlineSchema
- [x] Commit: `fix: add strict to compliance helper schemas`
- [x] Tests pass
- [x] Checklist verified

#### compliance.ts (7 schemas)
- [x] ComplianceCalculationParamsSchema
- [x] ComplianceStatusSchema
- [x] ComprehensiveComplianceStatusSchema
- [x] GreenCardRenewalStatusSchema
- [x] RemovalOfConditionsStatusSchema
- [x] SelectiveServiceStatusSchema
- [x] TaxReminderStatusSchema
- [x] Commit: `fix: add strict to compliance schemas`
- [x] Tests pass
- [x] Checklist verified

#### lpr-status.ts (17 object schemas + 11 enums)
##### Part 1 - First batch of object schemas
- [x] TravelRiskDetailsSchema
- [x] ReentryPermitInfoSchema
- [x] ReentryPermitProtectionSchema
- [x] GreenCardRiskResultSchema
- [x] LongestTripInfoSchema
- [x] LPRStatusAssessmentSchema
- [x] MaximumTripDurationResultSchema
- [x] ComprehensiveRiskAssessmentSchema (with nested objects)
- [x] Commit: `fix: add strict to lpr status schemas part 1`

##### Part 2 - Second batch of object schemas
- [x] PermitProtectedThresholdsSchema
- [x] N470ExemptionSchema
- [x] PatternOfNonResidenceSchema
- [x] RebuttablePresumptionSchema
- [x] ReentryPermitAdvancedSchema
- [x] LPRStatusRiskFactorsSchema
- [x] LPRStatusAssessmentAdvancedSchema
- [x] LPRStatusInputSchema (with nested object)
- [x] Commit: `fix: add strict to lpr status schemas part 2`
- [x] Tests pass
- [x] Checklist verified

#### notification.ts (2 schemas)
- [x] NotificationSchema (also replaced z.any() with secure union type)
- [x] NotificationPreferencesSchema
- [x] Commit: `fix: replace any type in notification schema`
- [x] Tests pass
- [x] Checklist verified

#### presence.ts (9 object schemas)
- [x] PresenceCalculationSchema
- [x] PresenceStatusSchema
- [x] ContinuousResidenceWarningSchema
- [x] EligibilityMilestoneSchema
- [x] PresenceCalculationResultSchema
- [x] PresenceStatusDetailsSchema
- [x] ContinuousResidenceWarningSimpleSchema
- [x] EligibilityDatesSchema
- [x] ValidatedDateRangeSchema
- [x] Commit: `fix: add strict to presence schemas`
- [x] Tests pass
- [x] Checklist verified

#### travel-analytics-helpers.ts (7 schemas - file uses camelCase)
- [x] countryDataSchema
- [x] tripDateRangeSchema
- [x] yearBoundariesSchema
- [x] presenceStreakSchema
- [x] riskThresholdsSchema
- [x] travelRiskResultSchema
- [x] travelBudgetRiskResultSchema
- [x] Commit: `fix: add strict to travel analytics helper schemas`
- [x] Tests pass
- [x] Checklist verified

#### travel-analytics.ts (8 schemas - file uses camelCase)
- [x] countryStatisticsSchema
- [x] yearlyDaysAbroadSchema
- [x] travelStreakSchema
- [x] milestoneInfoSchema
- [x] safeTravelBudgetSchema
- [x] travelProjectionSchema
- [x] tripRiskAssessmentSchema
- [x] annualTravelSummarySchema (with nested objects)
- [x] Commit: `fix: add strict to travel analytics schemas`
- [x] Tests pass
- [x] Checklist verified

#### trip.ts (4 schemas)
- [x] BaseTripSchema
- [x] TripSchema (extends BaseTripSchema)
- [x] TripCreateSchema (uses BaseTripSchema)
- [x] TripUpdateSchema (uses BaseTripSchema.partial())
- [x] SimulatedTripSchema
- [x] Commit: `fix: add strict to trip schemas`
- [x] Tests pass
- [x] Checklist verified

#### user.ts (3 schemas)
- [x] AuthUserSchema (with nested object)
- [x] UserProfileSchema
- [x] UserSettingsSchema (with nested object)
- [x] Commit: `fix: add strict to user schemas`
- [x] Tests pass
- [x] Checklist verified

### 1.2 Replace z.any() in Notification Schema
- [x] Define NotificationDataValueSchema union type
- [x] Update NotificationSchema to use new type
- [x] Update notification tests for security
- [x] Commit: `fix: replace any type in notification schema`
- [x] Tests pass
- [x] Checklist verified

## Phase 2: High Priority Improvements

### 2.1 Implement Comprehensive Error Handling
- [x] Create error infrastructure file
- [x] Define USCISCalculationError class
- [x] Define USCISValidationError class
- [x] Define Result type pattern
- [x] Commit: `feat: create error infrastructure`
- [x] Implement safe wrapper functions per domain
  - [x] Presence calculations (safe-calculator.ts)
  - [x] LPR status calculations (safe-calculator.ts)
  - [x] Compliance calculations (safe-compliance-coordinator.ts)
- [x] Tests for error handling
- [x] Checklist verified

### 2.2 Add Security-Focused Tests
- [x] Create security test infrastructure
- [x] Define malicious input constants
- [x] Test excess property rejection per schema
- [x] Test prototype pollution attempts
- [x] Test XSS prevention
- [x] Test SQL injection strings
- [x] Commit: `test: add comprehensive security tests`
- [x] All tests pass
- [x] Checklist verified

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
- [x] Phase 1 Complete
- [x] Phase 2 Complete
- [ ] Phase 3 Complete
- [ ] Phase 4 Complete
- [ ] Final Security Audit
- [ ] Documentation Updated
- [ ] PR Created and Reviewed