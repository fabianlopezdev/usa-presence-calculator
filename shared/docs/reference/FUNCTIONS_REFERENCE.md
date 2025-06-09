# Comprehensive Function Reference - USA Presence Calculator Shared Package

This document is the complete, consolidated reference for ALL functions in the shared package, combining information from both the high-level function documentation and the detailed business logic inventory.

## Summary Audit

### Overall Statistics
- **Total Functions**: 231 (182 exported + 49 internal)
- **Business Logic Functions**: 161 (112 exported + 49 internal)
- **Safe Wrapper Functions**: 27 (all exported)
- **Error Handling Utilities**: 10 (all exported)
- **Utility Functions**: 26 (all exported)
- **Schema Functions**: 7 (all exported)
- **Total Feature Areas**: 11
- **Files Documented**: 48

### Functions by Category

| Category | Exported | Internal | Total | Primary Purpose |
|----------|----------|----------|-------|-----------------|
| **Compliance Management** | 30 | 13 | 43 | Green card renewal, I-751, selective service, taxes |
| **LPR Status Assessment** | 32 | 10 | 42 | Risk analysis, pattern detection, permit evaluation |
| **Physical Presence** | 8 | 2 | 10 | USCIS-compliant presence calculations |
| **Travel Analytics** | 19 | 9 | 28 | Travel patterns, projections, statistics |
| **Travel Risk** | 21 | 9 | 30 | Abandonment risk, comprehensive assessments |
| **Reporting** | 6 | 2 | 8 | Annual summaries, milestone tracking |
| **Safe Wrappers** | 27 | 0 | 27 | Validated input wrappers with Result type |
| **Error Handling** | 10 | 0 | 10 | Result type utilities and error management |
| **Date Utilities** | 13 | 0 | 13 | Date manipulation and formatting |
| **Trip Calculations** | 5 | 0 | 5 | USCIS-compliant trip calculations |
| **Validation Utilities** | 8 | 0 | 8 | Trip validation and filtering |
| **Schema Utilities** | 7 | 0 | 7 | Type transformations and helpers |

## Table of Contents

1. [Functions by Feature Area](#functions-by-feature-area)
   - [Compliance Management](#compliance-management)
   - [LPR Status Assessment](#lpr-status-assessment)
   - [Physical Presence Calculation](#physical-presence-calculation)
   - [Travel Analytics](#travel-analytics)
   - [Travel Risk Assessment](#travel-risk-assessment)
   - [Reporting & Milestones](#reporting--milestones)
   - [Safe Wrapper Functions](#safe-wrapper-functions)
   - [Error Handling Utilities](#error-handling-utilities)
   - [Date Utilities](#date-utilities)
   - [Trip Calculations](#trip-calculations)
   - [Validation Utilities](#validation-utilities)
   - [Schema Utilities](#schema-utilities)
2. [Alphabetical Function Index](#alphabetical-function-index)
3. [Functions by File Path](#functions-by-file-path)
4. [Internal Functions Only](#internal-functions-only)

---

## Functions by Feature Area

### Compliance Management

#### Active Item Helpers
**File**: `/business-logic/calculations/compliance/active-item-helpers.ts`

- **`getActiveGreenCardRenewalItem`** *(exported)*
  ```typescript
  (status: GreenCardRenewalStatus): ActiveComplianceItem | null
  ```
  Gets active green card renewal compliance item if applicable

- **`getActiveRemovalOfConditionsItem`** *(exported)*
  ```typescript
  (status: RemovalOfConditionsStatus): ActiveComplianceItem | null
  ```
  Gets active removal of conditions compliance item if applicable

- **`getActiveSelectiveServiceItem`** *(exported)*
  ```typescript
  (status: SelectiveServiceStatus): ActiveComplianceItem | null
  ```
  Gets active selective service compliance item if applicable

- **`getActiveTaxFilingItem`** *(exported)*
  ```typescript
  (status: TaxReminderStatus): ActiveComplianceItem | null
  ```
  Gets active tax filing compliance item if applicable

#### Compliance Coordinator
**File**: `/business-logic/calculations/compliance/compliance-coordinator.ts`

- **`calculateComprehensiveCompliance`** *(exported)*
  ```typescript
  (params: ComplianceCalculationParams): ComprehensiveComplianceStatus
  ```
  Aggregates all compliance statuses into a comprehensive report

- **`getActiveComplianceItems`** *(exported)*
  ```typescript
  (compliance: ComprehensiveComplianceStatus): ActiveComplianceItem[]
  ```
  Gets list of compliance items requiring user action

- **`getPriorityComplianceItems`** *(exported)*
  ```typescript
  (compliance: ComprehensiveComplianceStatus): PriorityComplianceItem[]
  ```
  Gets priority compliance items with deadlines

- **`getUpcomingDeadlines`** *(exported)*
  ```typescript
  (compliance: ComprehensiveComplianceStatus, currentDate?: string): UpcomingDeadline[]
  ```
  Gets list of upcoming compliance deadlines

- **`getRemovalOfConditionsStatus`** *(internal)*
  ```typescript
  (isConditionalResident: boolean, greenCardDate: string, currentDate?: string): RemovalOfConditionsStatus
  ```
  Gets removal of conditions status with default for non-conditional residents

#### Compliance Helpers
**File**: `/business-logic/calculations/compliance/compliance-helpers.ts`

- **`determineGreenCardRenewalUrgency`** *(exported)*
  ```typescript
  (status: GreenCardRenewalStatus['currentStatus']): ActiveComplianceItem['urgency']
  ```
  Determines urgency level for green card renewal

- **`determineTaxFilingUrgency`** *(exported)*
  ```typescript
  (daysUntilDeadline: number, isAbroad: boolean): ActiveComplianceItem['urgency']
  ```
  Determines urgency level for tax filing

- **`getGreenCardExpirationDeadline`** *(exported)*
  ```typescript
  (status: GreenCardRenewalStatus, current: Date): UpcomingDeadline | null
  ```
  Gets green card expiration deadline info

- **`getGreenCardRenewalPriorityItem`** *(exported)*
  ```typescript
  (status: GreenCardRenewalStatus): PriorityComplianceItem | null
  ```
  Gets priority item for green card renewal

- **`getRemovalOfConditionsPriorityItem`** *(exported)*
  ```typescript
  (status: RemovalOfConditionsStatus): PriorityComplianceItem | null
  ```
  Gets priority item for I-751 filing

- **`getRemovalOfConditionsUpcomingDeadline`** *(exported)*
  ```typescript
  (status: RemovalOfConditionsStatus): UpcomingDeadline | null
  ```
  Gets upcoming I-751 deadline info

- **`getSelectiveServiceDeadline`** *(exported)*
  ```typescript
  (status: SelectiveServiceStatus, current: Date): UpcomingDeadline | null
  ```
  Gets selective service registration deadline info

- **`getSelectiveServicePriorityItem`** *(exported)*
  ```typescript
  (status: SelectiveServiceStatus): PriorityComplianceItem | null
  ```
  Gets priority item for selective service

- **`getTaxFilingDeadline`** *(exported)*
  ```typescript
  (status: TaxReminderStatus, current: Date): UpcomingDeadline | null
  ```
  Gets tax filing deadline info

- **`getTaxFilingPriorityItem`** *(exported)*
  ```typescript
  (status: TaxReminderStatus): PriorityComplianceItem | null
  ```
  Gets priority item for tax filing

- **`sortPriorityItems`** *(exported)*
  ```typescript
  (items: PriorityComplianceItem[]): PriorityComplianceItem[]
  ```
  Sorts priority items by urgency and type

#### Green Card Renewal
**File**: `/business-logic/calculations/compliance/green-card-renewal.ts`

- **`calculateGreenCardRenewalStatus`** *(exported)*
  ```typescript
  (expirationDate: string, currentDate?: string): GreenCardRenewalStatus
  ```
  Calculates green card renewal requirements and urgency

- **`getMonthsUntilExpiration`** *(exported)*
  ```typescript
  (expirationDate: string, currentDate?: string): number
  ```
  Calculates months until green card expires

- **`getRenewalUrgency`** *(exported)*
  ```typescript
  (expirationDate: string, currentDate?: string): PriorityLevel
  ```
  Determines urgency level for green card renewal

- **`getRenewalWindowStartDate`** *(exported)*
  ```typescript
  (expirationDate: string): string
  ```
  Gets date when renewal window opens

- **`isInRenewalWindow`** *(exported)*
  ```typescript
  (expirationDate: string, currentDate?: string): boolean
  ```
  Checks if currently in renewal filing window

#### Removal of Conditions
**File**: `/business-logic/calculations/compliance/removal-of-conditions.ts`

- **`calculateRemovalOfConditionsStatus`** *(exported)*
  ```typescript
  (isConditionalResident: boolean, greenCardDate: string, currentDate?: string, filingStatus?: 'filed' | 'approved'): RemovalOfConditionsStatus | null
  ```
  Calculates I-751 filing requirements for conditional residents

- **`getDaysUntilFilingWindow`** *(exported)*
  ```typescript
  (greenCardDate: string, currentDate?: string): number
  ```
  Gets days until I-751 filing window opens

- **`getFilingWindowDates`** *(exported)*
  ```typescript
  (greenCardDate: string): { windowStart: string; windowEnd: string }
  ```
  Gets I-751 filing window start and end dates

- **`getRemovalOfConditionsDeadline`** *(exported)*
  ```typescript
  (greenCardDate: string): string
  ```
  Gets deadline for filing I-751

- **`isInFilingWindow`** *(exported)*
  ```typescript
  (greenCardDate: string, currentDate?: string): boolean
  ```
  Checks if currently in I-751 filing window

- **`determineCurrentStatus`** *(internal)*
  ```typescript
  (current: Date, windowStartDate: Date, windowEndDate: Date, filingStatus?: 'filed' | 'approved'): RemovalOfConditionsStatus['currentStatus']
  ```
  Determines current status based on dates and filing status

#### Selective Service
**File**: `/business-logic/calculations/compliance/selective-service.ts`

- **`calculateSelectiveServiceStatus`** *(exported)*
  ```typescript
  (birthDate: string, gender: string, isRegistered: boolean, currentDate?: string): SelectiveServiceStatus
  ```
  Calculates selective service registration requirements

- **`getAgeInYears`** *(exported)*
  ```typescript
  (birthDate: string, currentDate?: string): number
  ```
  Calculates age from birth date

- **`getDaysUntilAgedOut`** *(exported)*
  ```typescript
  (birthDate: string, currentDate?: string): number
  ```
  Gets days until aging out of selective service requirement

- **`getDaysUntilRegistrationRequired`** *(exported)*
  ```typescript
  (birthDate: string, gender: string, currentDate?: string): number
  ```
  Gets days until selective service registration required

- **`getRegistrationDeadline`** *(exported)*
  ```typescript
  (birthDate: string, gender: string): string | null
  ```
  Gets selective service registration deadline

- **`isSelectiveServiceRequired`** *(exported)*
  ```typescript
  (birthDate: string, gender: string, currentDate?: string): boolean
  ```
  Checks if selective service registration is required

#### Tax Deadline Helpers
**File**: `/business-logic/calculations/compliance/tax-deadline-helpers.ts`

- **`adjustForWeekend`** *(exported)*
  ```typescript
  (date: Date): Date
  ```
  Adjusts tax deadline for weekends per IRS rules

#### Tax Reminders
**File**: `/business-logic/calculations/compliance/tax-reminders.ts`

- **`calculateTaxReminderStatus`** *(exported)*
  ```typescript
  (trips: Trip[], reminderDismissed: boolean, currentDate?: string): TaxReminderStatus
  ```
  Calculates tax filing reminder status

- **`getActualTaxDeadline`** *(exported)*
  ```typescript
  (currentDate?: string, deadlineType?: 'standard' | 'abroad_extension' | 'october_extension'): string
  ```
  Gets tax deadline adjusted for weekends/holidays

- **`getDaysUntilSpecificDeadline`** *(exported)*
  ```typescript
  (deadline: string, currentDate?: string): number
  ```
  Gets days until a specific tax deadline

- **`getDaysUntilTaxDeadline`** *(exported)*
  ```typescript
  (currentDate?: string): number
  ```
  Gets days until next tax deadline

- **`getExtensionInfo`** *(exported)*
  ```typescript
  (isAbroad: boolean): { automaticExtension: boolean; extensionDeadline: string | null; requiresForm: boolean; formNumber: string | null }
  ```
  Gets tax extension information for those abroad

- **`getNextTaxDeadline`** *(exported)*
  ```typescript
  (currentDate?: string): string
  ```
  Gets next applicable tax deadline date

- **`getTaxSeasonDateRange`** *(exported)*
  ```typescript
  (currentDate?: string): { start: string; end: string }
  ```
  Gets current tax season date range

- **`isCurrentlyTaxSeason`** *(exported)*
  ```typescript
  (currentDate?: string): boolean
  ```
  Checks if currently in tax season

- **`willBeAbroadDuringTaxSeason`** *(exported)*
  ```typescript
  (trips: Trip[], currentDate?: string): boolean
  ```
  Checks if user will be abroad during tax season

- **`getBaseDeadlineForYear`** *(internal)*
  ```typescript
  (year: number, deadlineType: 'standard' | 'abroad_extension' | 'october_extension'): Date
  ```
  Gets base deadline for a specific year and type

### LPR Status Assessment

#### LPR Status Calculator
**File**: `/business-logic/calculations/lpr-status/calculator.ts`

- **`assessRiskOfLosingPermanentResidentStatus`** *(exported)*
  ```typescript
  (trips: Trip[], greenCardDate: string, asOfDate?: string): LPRStatusRiskAssessment
  ```
  Basic assessment of LPR status risk

- **`assessRiskOfLosingPermanentResidentStatusAdvanced`** *(exported)*
  ```typescript
  (params: AdvancedLPRStatusParams): AdvancedLPRStatusAssessment
  ```
  Advanced LPR status risk assessment

- **`calculateMaximumTripDurationWithExemptions`** *(exported)*
  ```typescript
  (params: MaximumTripCalculationParams): MaximumTripDurationResult
  ```
  Calculates max trip duration with permits/exemptions

#### Duration Calculator
**File**: `/business-logic/calculations/lpr-status/duration-calculator.ts`

- **`calculateMaximumTripDurationToMaintainAllStatuses`** *(exported)*
  ```typescript
  (params: MaximumTripDurationParams): MaximumTripDurationWithStatus
  ```
  Calculates max safe trip duration

#### Pattern Analysis
**File**: `/business-logic/calculations/lpr-status/pattern-analysis.ts`

- **`analyzePatternOfNonResidence`** *(exported)*
  ```typescript
  (trips: Trip[]): PatternAnalysis
  ```
  Analyzes trips for pattern of non-residence

#### Advanced Helpers
**File**: `/business-logic/calculations/lpr-status/advanced-helpers.ts`

- **`calculateRebuttablePresumption`** *(exported)*
  ```typescript
  (longestTrip: number, totalDaysAbroad: number, tripCount: number): RebuttablePresumptionStatus
  ```
  Calculates rebuttable presumption of abandonment

- **`calculateRiskFactors`** *(exported)*
  ```typescript
  (trips: Trip[], greenCardDate: string, asOfDate: string, params: AdvancedLPRStatusParams): RiskFactors
  ```
  Calculates various LPR status risk factors

- **`determineCurrentStatus`** *(exported)*
  ```typescript
  (riskFactors: RiskFactors, params: AdvancedLPRStatusParams): CurrentLPRStatus
  ```
  Determines current LPR status type

- **`generateSuggestions`** *(exported)*
  ```typescript
  (assessment: AdvancedLPRStatusAssessment, params: AdvancedLPRStatusParams): string[]
  ```
  Generates suggestions for maintaining LPR status

- **`getAdvancedRiskLevel`** *(internal)*
  ```typescript
  (status: CurrentLPRStatus, riskScore: number): RiskLevel
  ```
  Determines advanced risk level based on status and score

- **`calculateAdvancedRiskScore`** *(internal)*
  ```typescript
  (riskFactors: RiskFactors, params: AdvancedLPRStatusParams): number
  ```
  Calculates numerical risk score

- **`calculateTimeInsideUSA`** *(internal)*
  ```typescript
  (trips: Trip[], greenCardDate: string, asOfDate: string): { totalTimeInsideUSA: number; percentageInsideUSA: number }
  ```
  Calculates time spent inside USA

- **`hasHighFrequencyShortTrips`** *(internal)*
  ```typescript
  (trips: Trip[]): boolean
  ```
  Checks for pattern of high frequency short trips

#### Analysis Helpers
**File**: `/business-logic/calculations/lpr-status/analysis-helpers.ts`

- **`analyzePatterns`** *(exported)*
  ```typescript
  (trips: Trip[], greenCardDate: string, asOfDate: string): PatternAnalysisResult
  ```
  Analyzes travel patterns for risk

- **`assessRiskAndStatus`** *(exported)*
  ```typescript
  (trips: Trip[], riskFactors: RiskFactors, params: AdvancedLPRStatusParams): { riskLevel: RiskLevel; overallRiskScore: number }
  ```
  Assesses overall risk and status

- **`calculateBasicRiskScore`** *(internal)*
  ```typescript
  (longestTrip: number, totalDaysAbroad: number, percentageAbroad: number, hasRiskyTrips: boolean): number
  ```
  Calculates basic numerical risk score

- **`adjustRiskScoreForMitigatingFactors`** *(internal)*
  ```typescript
  (baseScore: number, params: AdvancedLPRStatusParams): number
  ```
  Adjusts risk score based on mitigating factors

#### LPR Status Helpers
**File**: `/business-logic/calculations/lpr-status/helpers.ts`

- **`calculateTripMetrics`** *(exported)*
  ```typescript
  (trips: Trip[]): TripMetrics
  ```
  Calculates trip statistics and metrics

- **`generateLPRStatusRecommendations`** *(exported)*
  ```typescript
  (assessment: LPRStatusRiskAssessment): string[]
  ```
  Generates recommendations based on status

- **`hasRiskyTrips`** *(exported)*
  ```typescript
  (trips: Trip[]): boolean
  ```
  Checks if any trips pose LPR status risk

- **`mapToBasicRiskLevel`** *(internal)*
  ```typescript
  (hasRiskyTrips: boolean, longestTrip: number, totalDaysAbroad: number, greenCardAge: number): RiskLevel
  ```
  Maps trip data to basic risk level

#### Permit Helpers
**File**: `/business-logic/calculations/lpr-status/permit-helpers.ts`

- **`determineIfReentryPermitProvidesProtection`** *(exported)*
  ```typescript
  (tripDuration: number, permitInfo?: { hasReentryPermit: boolean; permitExpiryDate?: string }, currentDate?: string): boolean
  ```
  Basic permit protection check

- **`determineIfReentryPermitProvidesProtectionAdvanced`** *(exported)*
  ```typescript
  (tripDuration: number, permitInfo: ReentryPermitInfo | undefined, currentDate?: string): ReentryPermitProtectionResult
  ```
  Advanced permit protection analysis

#### Suggestion Helpers
**File**: `/business-logic/calculations/lpr-status/suggestion-helpers.ts`

- **`handleAbandonmentRiskSuggestions`** *(exported)*
  ```typescript
  (suggestions: string[], assessment: AdvancedLPRStatusAssessment, params: AdvancedLPRStatusParams): void
  ```
  Generates suggestions for abandonment risk

- **`handleConditionalResidentSuggestions`** *(exported)*
  ```typescript
  (suggestions: string[], params: AdvancedLPRStatusParams): void
  ```
  Generates suggestions for conditional residents

- **`handleGeneralRiskSuggestions`** *(exported)*
  ```typescript
  (suggestions: string[], assessment: AdvancedLPRStatusAssessment): void
  ```
  Generates general risk mitigation suggestions

- **`handleN470ExemptionSuggestions`** *(exported)*
  ```typescript
  (suggestions: string[], assessment: AdvancedLPRStatusAssessment, params: AdvancedLPRStatusParams): void
  ```
  Generates N-470 exemption suggestions

- **`handleReentryPermitSuggestions`** *(exported)*
  ```typescript
  (suggestions: string[], assessment: AdvancedLPRStatusAssessment, params: AdvancedLPRStatusParams): void
  ```
  Generates reentry permit suggestions

### Physical Presence Calculation

#### Presence Calculator
**File**: `/business-logic/calculations/presence/calculator.ts`

- **`calculateDaysOfPhysicalPresence`** *(exported)*
  ```typescript
  (trips: Trip[], greenCardDate: string, currentDate?: string): number
  ```
  Calculates total days physically present in USA

- **`calculateEligibilityDates`** *(exported)*
  ```typescript
  (totalDaysInUSA: number, eligibilityCategory: 'three_year' | 'five_year', greenCardDate: string, currentDate?: string): EligibilityDates
  ```
  Calculates citizenship eligibility and filing dates

- **`calculatePresenceStatus`** *(exported)*
  ```typescript
  (trips: Trip[], eligibilityCategory: 'three_year' | 'five_year', greenCardDate: string, currentDate?: string): PresenceStatus
  ```
  Calculates presence status and progress

- **`checkContinuousResidence`** *(exported)*
  ```typescript
  (trips: Trip[]): ContinuousResidenceResult
  ```
  Checks for continuous residence violations

- **`isEligibleForEarlyFiling`** *(exported)*
  ```typescript
  (eligibilityDate: string, currentDate?: string): boolean
  ```
  Checks if eligible for 90-day early filing

#### Presence Helpers
**File**: `/business-logic/calculations/presence/helpers.ts`

- **`calculateTripDaysAbroad`** *(exported)*
  ```typescript
  (trip: Trip): number
  ```
  Calculates days abroad for a trip

- **`createResidenceWarning`** *(exported)*
  ```typescript
  (trip: Trip): ContinuousResidenceWarning
  ```
  Creates continuous residence warning

- **`validateAndParseDates`** *(exported)*
  ```typescript
  (greenCardDate: string, asOfDate: string): DateValidationResult
  ```
  Validates and parses date inputs

- **`isValidTrip`** *(re-exported from validation)*
- **`isValidTripForResidenceCheck`** *(re-exported from validation)*

### Travel Analytics

#### Analytics
**File**: `/business-logic/calculations/travel-analytics/analytics.ts`

- **`assessUpcomingTripRisk`** *(exported)*
  ```typescript
  (upcomingTrips: Trip[], currentTotalDaysAbroad: number, eligibilityCategory: 'three_year' | 'five_year', greenCardDate: string, currentDate?: string): TripRiskAssessment[]
  ```
  Assesses risk of upcoming simulated trip

- **`calculateCountryStatistics`** *(exported)*
  ```typescript
  (trips: Trip[]): CountryStatistics[]
  ```
  Calculates statistics by destination country

- **`calculateDaysAbroadByYear`** *(exported)*
  ```typescript
  (trips: Trip[], greenCardDate: string, currentDate?: string): YearlyDaysAbroad[]
  ```
  Calculates days abroad broken down by year

- **`projectEligibilityDate`** *(exported)*
  ```typescript
  (trips: Trip[], totalDaysInUSA: number, eligibilityCategory: 'three_year' | 'five_year', greenCardDate: string, currentDate?: string): TravelProjection
  ```
  Projects future citizenship eligibility date

- **`generateAnnualTravelSummary`** *(re-exported from reporting)*
- **`calculateMilestones`** *(re-exported from reporting)*

- **`calculateHistoricalAbsenceRate`** *(internal)*
  ```typescript
  (daysSinceGreenCard: number, totalDaysInUSA: number): number
  ```
  Calculates historical absence rate

- **`handleAlreadyEligible`** *(internal)*
  ```typescript
  (currentDate: string, historicalAbsenceRate: number): TravelProjection
  ```
  Handles case where already eligible

- **`handleImpossibleEligibility`** *(internal)*
  ```typescript
  (): TravelProjection
  ```
  Handles case where eligibility is impossible

- **`calculateProjectionConfidence`** *(internal)*
  ```typescript
  (trips: Trip[], greenCardDate: string, currentDate: string): object
  ```
  Calculates confidence level for projection

- **`createNoHistoryProjection`** *(internal)*
  ```typescript
  (projectedDate: Date): TravelProjection
  ```
  Creates projection when no history available

- **`createProjectionWithHistory`** *(internal)*
  ```typescript
  (projectedDate: Date, historicalAbsenceRate: number, variance: number, recentYearsCount: number): TravelProjection
  ```
  Creates projection based on historical data

#### Budget Helpers
**File**: `/business-logic/calculations/travel-analytics/budget-helpers.ts`

- **`calculateSafeTravelBudget`** *(exported)*
  ```typescript
  (_totalDaysInUSA: number, totalDaysAbroad: number, eligibilityCategory: 'three_year' | 'five_year', greenCardDate: string, _currentDate?: string): SafeTravelBudget
  ```
  Calculates safe travel budget to maintain eligibility

#### Streak Helpers
**File**: `/business-logic/calculations/travel-analytics/streak-helpers.ts`

- **`calculateTravelStreaks`** *(exported)*
  ```typescript
  (trips: Trip[], greenCardDate: string, currentDate?: string): TravelStreak[]
  ```
  Calculates longest travel and presence streaks

- **`addFinalPresenceStreak`** *(internal)*
  ```typescript
  (streaks: TravelStreak[], lastReturn: Date, endDate: Date): void
  ```
  Adds final presence streak after last trip

- **`addGapStreaks`** *(internal)*
  ```typescript
  (streaks: TravelStreak[], sortedTrips: Trip[]): void
  ```
  Adds presence streaks between trips

- **`addInitialPresenceStreak`** *(internal)*
  ```typescript
  (streaks: TravelStreak[], firstDeparture: Date, startDate: Date): void
  ```
  Adds initial presence streak before first trip

#### Travel Analytics Helpers
**File**: `/business-logic/calculations/travel-analytics/helpers.ts`

- **`calculateAnniversaryDate`** *(exported)*
  ```typescript
  (greenCardDate: Date, yearsRequired: number): Date
  ```
  Calculates anniversary date handling leap years

- **`calculateDaysAbroadInYear`** *(exported)*
  ```typescript
  (trip: Trip, yearBoundaries: YearBoundaries): number
  ```
  Calculates days abroad in specific year

- **`calculateTotalInclusiveDays`** *(exported)*
  ```typescript
  (departureDate: Date, returnDate: Date): number
  ```
  Calculates total days including both dates

- **`calculateTripDaysAbroadExcludingTravelDays`** *(exported)*
  ```typescript
  (departureDate: Date, returnDate: Date): number
  ```
  Calculates days excluding travel days

- **`createPresenceStreak`** *(exported)*
  ```typescript
  (startDate: Date | string, endDate: Date | string, description: string, type?: 'in_usa' | 'traveling' | 'travel_free_months'): TravelStreak
  ```
  Creates presence streak object

- **`formatDateRange`** *(exported)*
  ```typescript
  (departureDate: string, returnDate: string): string
  ```
  Formats date range for display

- **`getActualValidTrips`** *(exported)*
  ```typescript
  (trips: Trip[]): Trip[]
  ```
  Get non-simulated valid trips

- **`getDefaultCountryData`** *(exported)*
  ```typescript
  (): CountryData
  ```
  Gets default country data object

- **`getRequiredDays`** *(exported)*
  ```typescript
  (eligibilityCategory: 'three_year' | 'five_year'): number
  ```
  Gets required presence days for category

- **`getRequiredYears`** *(exported)*
  ```typescript
  (eligibilityCategory: 'three_year' | 'five_year'): number
  ```
  Gets required years for eligibility category

- **`getYearBoundaries`** *(exported)*
  ```typescript
  (year: number, startYear: number, endYear: number, startDate: Date, endDate: Date): YearBoundaries
  ```
  Gets year start/end boundaries

- **`parseTripDates`** *(exported)*
  ```typescript
  (trip: Trip): TripDateRange | null
  ```
  Parses and validates trip dates

- **`updateCountryData`** *(exported)*
  ```typescript
  (existingData: CountryData, daysAbroad: number, returnDate: Date): CountryData
  ```
  Updates country visit statistics

- **`isValidTripForRiskAssessment`** *(re-exported from validation)*

- **`isWithinYearBoundaries`** *(internal)*
  ```typescript
  (departure: Date, returnDate: Date, yearStart: Date, yearEnd: Date): boolean
  ```
  Checks if trip is within year boundaries

- **`getEffectiveTripDates`** *(internal)*
  ```typescript
  (departure: Date, returnDate: Date, yearStart: Date, yearEnd: Date): object | null
  ```
  Gets effective trip dates within boundaries

- **`calculateBoundaryAdjustment`** *(internal)*
  ```typescript
  (effectiveStart: Date, effectiveEnd: Date, departure: Date, returnDate: Date, yearStart: Date, yearEnd: Date): number
  ```
  Calculates boundary adjustment for trip days

### Travel Risk Assessment

#### Risk Assessment
**File**: `/business-logic/calculations/travel-risk/assessment.ts`

- **`assessTripRiskForAllLegalThresholds`** *(exported)*
  ```typescript
  (params: TripRiskAssessmentParams): ComprehensiveTripRiskAssessment
  ```
  Comprehensive trip risk assessment

#### Abandonment Risk
**File**: `/business-logic/calculations/travel-risk/abandonment.ts`

- **`calculateGreenCardAbandonmentRisk`** *(exported)*
  ```typescript
  (daysAbroad: number, hasReentryPermit?: boolean): GreenCardRiskResult
  ```
  Calculates green card abandonment risk

- **`checkIfTripApproachesContinuousResidenceRisk`** *(exported)*
  ```typescript
  (daysAbroad: number): boolean
  ```
  Checks if trip approaches residence risk

- **`checkIfTripApproachesGreenCardLoss`** *(exported)*
  ```typescript
  (daysAbroad: number): boolean
  ```
  Checks if trip approaches green card loss

- **`checkIfTripBreaksContinuousResidence`** *(exported)*
  ```typescript
  (daysAbroad: number): boolean
  ```
  Checks if trip breaks continuous residence

- **`checkIfTripRisksAutomaticGreenCardLoss`** *(exported)*
  ```typescript
  (daysAbroad: number, hasReentryPermit?: boolean): boolean
  ```
  Checks if trip risks automatic loss

- **`getReentryPermitProtectedThresholds`** *(exported)*
  ```typescript
  (permitInfo?: object): PermitProtectedThresholds
  ```
  Gets thresholds with permit protection

#### Assessment Helpers
**File**: `/business-logic/calculations/travel-risk/assessment-helpers.ts`

- **`determineGreenCardRiskLevel`** *(exported)*
  ```typescript
  (daysAbroad: number, hasReentryPermit: boolean): TripRiskLevel
  ```
  Determines green card risk level

- **`generateRecommendationsForRiskLevel`** *(exported)*
  ```typescript
  (riskLevel: TripRiskLevel, daysAbroad: number, hasReentryPermit: boolean): string[]
  ```
  Generates risk-based recommendations

- **`generateWarningsForDaysAbroad`** *(exported)*
  ```typescript
  (daysAbroad: number, hasReentryPermit: boolean): string[]
  ```
  Generates warnings based on days abroad

- **`mapRiskLevelToDescription`** *(exported)*
  ```typescript
  (riskLevel: TripRiskLevel): string
  ```
  Maps risk level to user-friendly description

#### Risk Helpers
**File**: `/business-logic/calculations/travel-risk/helpers.ts`

- **`assessTravelRisk`** *(exported)*
  ```typescript
  (currentDaysAbroad: number, additionalDaysAbroad: number, eligibilityCategory: 'three_year' | 'five_year', greenCardDate: string, currentDate?: string): TravelRiskLevel
  ```
  Assesses travel risk for eligibility

- **`calculateConfidenceLevel`** *(exported)*
  ```typescript
  (trips: Trip[], greenCardDate: string, currentDate: string): ConfidenceLevel
  ```
  Calculates projection confidence level

- **`determineTravelBudgetRisk`** *(exported)*
  ```typescript
  (remainingDays: number, totalBudget: number): RiskLevel
  ```
  Determines risk level for travel budget

- **`determineTravelTrend`** *(exported)*
  ```typescript
  (daysSinceGreenCard: number, percentageAbroad: number): TravelTrend
  ```
  Determines travel pattern trend

- **`getRiskImpactDescription`** *(exported)*
  ```typescript
  (risk: TravelRiskLevel, eligibilityCategory: 'three_year' | 'five_year'): string
  ```
  Gets risk impact description

- **`getRiskRecommendation`** *(exported)*
  ```typescript
  (risk: TravelRiskLevel): string
  ```
  Gets recommendation for risk level

- **`calculatePercentageOfTimeAbroad`** *(internal)*
  ```typescript
  (totalDaysAbroad: number, totalDays: number): number
  ```
  Calculates percentage of time abroad

- **`getHighRiskRecommendation`** *(internal)*
  ```typescript
  (): string
  ```
  Gets recommendation for high risk

- **`getMediumRiskRecommendation`** *(internal)*
  ```typescript
  (): string
  ```
  Gets recommendation for medium risk

- **`getLowRiskRecommendation`** *(internal)*
  ```typescript
  (): string
  ```
  Gets recommendation for low risk

- **`getVeryHighRiskRecommendation`** *(internal)*
  ```typescript
  (): string
  ```
  Gets recommendation for very high risk

- **`getNoRiskRecommendation`** *(internal)*
  ```typescript
  (): string
  ```
  Gets recommendation for no risk

- **`calculateRecentYearsData`** *(internal)*
  ```typescript
  (trips: Trip[], currentDate: Date): { count: number; avgDaysAbroad: number }
  ```
  Calculates recent years travel data

- **`calculateVariance`** *(internal)*
  ```typescript
  (yearlyData: number[]): number
  ```
  Calculates variance in yearly travel

### Reporting & Milestones

#### Annual Summary
**File**: `/business-logic/calculations/reporting/annual-summary.ts`

- **`calculateYearSummaryData`** *(exported)*
  ```typescript
  (yearTrips: Trip[]): object
  ```
  Calculates summary data for year's trips

- **`compareWithPreviousYear`** *(exported)*
  ```typescript
  (currentTotalDays: number, currentTripCount: number, previousYearTrips: Trip[], previousYear: number): object
  ```
  Compares current year with previous year

- **`formatLongestTrip`** *(exported)*
  ```typescript
  (longestTrip: object): object
  ```
  Formats longest trip information

- **`generateAnnualTravelSummary`** *(exported)*
  ```typescript
  (trips: Trip[], year: number, previousYearTrips?: Trip[]): object
  ```
  Generates comprehensive annual summary

- **`getTopDestinations`** *(exported)*
  ```typescript
  (countryDays: Map<string, number>): Array<{ country: string; days: number }>
  ```
  Gets most visited destinations

- **`getYearTrips`** *(exported)*
  ```typescript
  (trips: Trip[], year: number): Trip[]
  ```
  Filters trips for specific year

#### Milestones
**File**: `/business-logic/calculations/reporting/milestones.ts`

- **`calculateMilestones`** *(exported)*
  ```typescript
  (totalDaysInUSA: number, eligibilityCategory: 'three_year' | 'five_year', greenCardDate: string, currentDate?: string): MilestoneInfo[]
  ```
  Calculates naturalization journey milestones

- **`createEarlyFilingMilestone`** *(internal)*
  ```typescript
  (greenCardDate: string, yearsRequired: number, currentDate: string): MilestoneInfo
  ```
  Creates early filing milestone

- **`createPhysicalPresenceMilestone`** *(internal)*
  ```typescript
  (totalDaysInUSA: number, requiredDays: number, currentDate: string): MilestoneInfo
  ```
  Creates physical presence milestone

### Safe Wrapper Functions

Safe wrapper functions provide validated input handling using the Result type pattern. All safe wrappers follow the pattern `safe<OriginalFunctionName>` and return `Result<T, E>` instead of throwing exceptions.

#### Presence Calculation Safe Wrappers
**File**: `/business-logic/calculations/presence/safe-calculator.ts`

- **`safeCalculateDaysOfPhysicalPresence`** *(exported)*
  ```typescript
  (trips: unknown, greenCardDate: unknown, currentDate?: unknown): Result<number, TripValidationError | DateRangeError>
  ```
  Safe wrapper for calculateDaysOfPhysicalPresence with input validation

- **`safeCalculatePresenceStatus`** *(exported)*
  ```typescript
  (trips: unknown, eligibilityCategory: unknown, greenCardDate: unknown, currentDate?: unknown): Result<PresenceStatus, TripValidationError | DateRangeError>
  ```
  Safe wrapper for calculatePresenceStatus with schema validation

- **`safeCheckContinuousResidence`** *(exported)*
  ```typescript
  (trips: unknown): Result<ContinuousResidenceResult, TripValidationError>
  ```
  Safe wrapper for checkContinuousResidence with trip validation

- **`safeCalculateEligibilityDates`** *(exported)*
  ```typescript
  (totalDaysInUSA: unknown, eligibilityCategory: unknown, greenCardDate: unknown, currentDate?: unknown): Result<EligibilityDates, TripValidationError | DateRangeError>
  ```
  Safe wrapper for calculateEligibilityDates with parameter validation

#### LPR Status Safe Wrappers
**File**: `/business-logic/calculations/lpr-status/safe-calculator.ts`

- **`safeAssessRiskOfLosingPermanentResidentStatus`** *(exported)*
  ```typescript
  (trips: unknown, greenCardDate: unknown, asOfDate?: unknown): Result<LPRStatusRiskAssessment, TripValidationError | LPRStatusError>
  ```
  Safe wrapper for basic LPR status risk assessment

- **`safeAssessRiskOfLosingPermanentResidentStatusAdvanced`** *(exported)*
  ```typescript
  (params: unknown): Result<AdvancedLPRStatusAssessment, TripValidationError | LPRStatusError>
  ```
  Safe wrapper for advanced LPR status assessment with all parameters

- **`safeCalculateMaximumTripDurationWithExemptions`** *(exported)*
  ```typescript
  (params: unknown): Result<MaximumTripDurationResult, TripValidationError | LPRStatusError>
  ```
  Safe wrapper for maximum trip duration calculation

#### Compliance Safe Wrappers
**File**: `/business-logic/calculations/compliance/safe-compliance-coordinator.ts`

- **`safeCalculateComprehensiveCompliance`** *(exported)*
  ```typescript
  (params: unknown): Result<ComprehensiveComplianceStatus, TripValidationError | ComplianceCalculationError>
  ```
  Safe wrapper for comprehensive compliance calculation

**File**: `/business-logic/calculations/compliance/safe-compliance-functions.ts`

- **`safeCalculateRemovalOfConditionsStatus`** *(exported)*
  ```typescript
  (isConditionalResident: unknown, greenCardDate: unknown, currentDate?: unknown): Result<RemovalOfConditionsStatus, DateRangeError | ComplianceCalculationError>
  ```
  Safe wrapper for I-751 status calculation

- **`safeCalculateGreenCardRenewalStatus`** *(exported)*
  ```typescript
  (greenCardExpirationDate: unknown, currentDate?: unknown): Result<GreenCardRenewalStatus, DateRangeError | ComplianceCalculationError>
  ```
  Safe wrapper for green card renewal status

- **`safeCalculateSelectiveServiceStatus`** *(exported)*
  ```typescript
  (birthDate?: unknown, gender?: unknown, isSelectiveServiceRegistered?: unknown, currentDate?: unknown): Result<SelectiveServiceStatus, DateRangeError | ComplianceCalculationError>
  ```
  Safe wrapper for selective service status

- **`safeCalculateTaxReminderStatus`** *(exported)*
  ```typescript
  (trips: unknown, isDismissed?: unknown, currentDate?: unknown): Result<TaxReminderStatus, DateRangeError | ComplianceCalculationError>
  ```
  Safe wrapper for tax reminder status

#### Travel Analytics Safe Wrappers
**File**: `/business-logic/calculations/travel-analytics/safe-analytics.ts`

- **`safeAssessUpcomingTripRisk`** *(exported)*
  ```typescript
  (upcomingTrips: unknown, currentTotalDaysAbroad: unknown, eligibilityCategory: unknown, greenCardDate: unknown, currentDate?: unknown): Result<TripRiskAssessment[], TripValidationError | USCISCalculationError>
  ```
  Safe wrapper for upcoming trip risk assessment

- **`safeCalculateCountryStatistics`** *(exported)*
  ```typescript
  (trips: unknown): Result<CountryStatistics[], TripValidationError | USCISCalculationError>
  ```
  Safe wrapper for country statistics calculation

- **`safeCalculateDaysAbroadByYear`** *(exported)*
  ```typescript
  (trips: unknown, greenCardDate: unknown, currentDate?: unknown): Result<YearlyDaysAbroad[], DateRangeError | TripValidationError | USCISCalculationError>
  ```
  Safe wrapper for yearly days abroad calculation

- **`safeProjectEligibilityDate`** *(exported)*
  ```typescript
  (trips: unknown, totalDaysInUSA: unknown, eligibilityCategory: unknown, greenCardDate: unknown, currentDate?: unknown): Result<TravelProjection, DateRangeError | TripValidationError | USCISCalculationError>
  ```
  Safe wrapper for eligibility date projection

#### Travel Risk Safe Wrappers
**File**: `/business-logic/calculations/travel-risk/safe-assessment.ts`

- **`safeAssessTripRiskForAllLegalThresholds`** *(exported)*
  ```typescript
  (trip: unknown, reentryPermitInfo?: unknown): Result<ComprehensiveRiskAssessment, TripValidationError | USCISCalculationError>
  ```
  Safe wrapper for comprehensive trip risk assessment

#### Utility Safe Wrappers
**File**: `/utils/safe-trip-calculations.ts`

- **`safeCalculateTripDuration`** *(exported)*
  ```typescript
  (trip: unknown, options?: unknown): Result<number, TripValidationError | DateRangeError>
  ```
  Safe wrapper for trip duration calculation

- **`safeCalculateTripDaysInPeriod`** *(exported)*
  ```typescript
  (trip: unknown, startDate: unknown, endDate: unknown, options?: unknown): Result<number, TripValidationError | DateRangeError>
  ```
  Safe wrapper for trip days in period calculation

- **`safeCalculateTripDaysInYear`** *(exported)*
  ```typescript
  (trip: unknown, year: unknown, options?: unknown): Result<number, TripValidationError | DateRangeError>
  ```
  Safe wrapper for trip days in year calculation

### Error Handling Utilities

**File**: `/errors/index.ts`

The error handling utilities implement a functional Result type pattern inspired by Rust, enabling explicit error handling without exceptions.

#### Result Type Constructors

- **`ok`** *(exported)*
  ```typescript
  <T>(data: T): Result<T, never>
  ```
  Creates a successful Result containing data

- **`err`** *(exported)*
  ```typescript
  <E>(error: E): Result<never, E>
  ```
  Creates a failed Result containing an error

#### Type Guards

- **`isOk`** *(exported)*
  ```typescript
  <T, E>(result: Result<T, E>): result is { success: true; data: T }
  ```
  Type guard to check if Result is successful

- **`isErr`** *(exported)*
  ```typescript
  <T, E>(result: Result<T, E>): result is { success: false; error: E }
  ```
  Type guard to check if Result is an error

#### Functional Utilities

- **`mapResult`** *(exported)*
  ```typescript
  <T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E>
  ```
  Maps a successful Result value, leaving errors unchanged

- **`mapError`** *(exported)*
  ```typescript
  <T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F>
  ```
  Maps an error Result value, leaving success unchanged

- **`chainResult`** *(exported)*
  ```typescript
  <T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E>
  ```
  Chains Result operations (flatMap/bind)

- **`combineResults`** *(exported)*
  ```typescript
  <T, E>(results: Result<T, E>[]): Result<T[], E>
  ```
  Combines multiple Results into a single Result

- **`unwrapResult`** *(exported)*
  ```typescript
  <T, E>(result: Result<T, E>): T
  ```
  Unwraps a Result or throws the error

- **`unwrapOr`** *(exported)*
  ```typescript
  <T, E>(result: Result<T, E>, defaultValue: T): T
  ```
  Unwraps a Result or returns a default value

### Date Utilities

**File**: `/utils/date-helpers.ts`

- **`addUTCDays`** *(exported)*
  ```typescript
  (date: Date, days: number): Date
  ```
  Add days to a UTC date

- **`endOfUTCDay`** *(exported)*
  ```typescript
  (date: Date): Date
  ```
  Get end of UTC day (23:59:59.999)

- **`formatDate`** *(exported)*
  ```typescript
  (date: Date | string): string
  ```
  Format date as YYYY-MM-DD (alias for formatUTCDate)

- **`formatUTCDate`** *(exported)*
  ```typescript
  (date: Date): string
  ```
  Format UTC date as YYYY-MM-DD

- **`getCurrentDate`** *(exported)*
  ```typescript
  (): string
  ```
  Get current UTC date (alias for getCurrentUTCDate)

- **`getCurrentUTCDate`** *(exported)*
  ```typescript
  (): string
  ```
  Get current UTC date at midnight

- **`getDaysInMonth`** *(exported)*
  ```typescript
  (year: number, month: number): number
  ```
  Days in given month

- **`getUTCYear`** *(exported)*
  ```typescript
  (date: Date): number
  ```
  Get UTC year from date

- **`isLeapYear`** *(exported)*
  ```typescript
  (year: number): boolean
  ```
  Check if year is leap year

- **`isValidDate`** *(exported)*
  ```typescript
  (date: any): boolean
  ```
  Check if Date object is valid

- **`isValidDateFormat`** *(exported)*
  ```typescript
  (dateString: string): boolean
  ```
  Strict YYYY-MM-DD validation

- **`parseDate`** *(exported)*
  ```typescript
  (dateString: string): Date
  ```
  Parse ISO date string (alias for parseISO)

- **`parseDateInput`** *(exported)*
  ```typescript
  (input: string | Date): Date
  ```
  Parse date from string or Date

- **`parseUTCDate`** *(exported)*
  ```typescript
  (dateString: string): Date
  ```
  Parse YYYY-MM-DD to UTC Date

- **`startOfUTCDay`** *(exported)*
  ```typescript
  (date: Date): Date
  ```
  Get start of UTC day (00:00:00.000)

- **`subUTCDays`** *(exported)*
  ```typescript
  (date: Date, days: number): Date
  ```
  Subtract days from UTC date

**File**: `/utils/utc-date-helpers.ts`

- **`formatUTCDate`** *(exported)*
  ```typescript
  (date: Date): string
  ```
  Format as YYYY-MM-DD

- **`getCurrentUTCDate`** *(exported)*
  ```typescript
  (): string
  ```
  Current UTC date at midnight

- **`getUTCYear`** *(exported)*
  ```typescript
  (date: Date): number
  ```
  Extract UTC year

- **`parseUTCDate`** *(exported)*
  ```typescript
  (dateString: string): Date
  ```
  Parse YYYY-MM-DD strictly

- **`subUTCDays`** *(exported)*
  ```typescript
  (date: Date, days: number): Date
  ```
  Subtract days

### Trip Calculations

**File**: `/utils/trip-calculations.ts`

- **`calculateTripDuration`** *(exported)*
  ```typescript
  (trip: Trip): number
  ```
  Calculate days abroad for a trip (USCIS rules applied)

- **`calculateTripDaysExcludingTravel`** *(exported)*
  ```typescript
  (trip: Trip): number
  ```
  Days abroad excluding departure/return days

- **`calculateTripDaysInPeriod`** *(exported)*
  ```typescript
  (trip: Trip, periodStart: Date, periodEnd: Date): number
  ```
  Days abroad within a specific period

- **`calculateTripDaysInYear`** *(exported)*
  ```typescript
  (trip: Trip, year: number): number
  ```
  Days abroad in a specific year

- **`populateTripDaysSet`** *(exported)*
  ```typescript
  (trip: Trip, daysSet: Set<string>): void
  ```
  Add trip days to a Set for deduplication

### Validation Utilities

**File**: `/utils/validation.ts`

- **`filterValidTrips`** *(exported)*
  ```typescript
  (trips: Trip[], requirements?: ValidationRequirements): Trip[]
  ```
  Filter array to valid trips meeting requirements

- **`getActualValidTrips`** *(exported)*
  ```typescript
  (trips: Trip[]): Trip[]
  ```
  Get non-simulated valid trips

- **`getSimulatedValidTrips`** *(exported)*
  ```typescript
  (trips: Trip[]): Trip[]
  ```
  Get simulated valid trips only

- **`isValidTrip`** *(exported)*
  ```typescript
  (trip: Trip): boolean
  ```
  Type guard for basic trip validation

- **`isValidTripForResidenceCheck`** *(exported)*
  ```typescript
  (trip: Trip): boolean
  ```
  Validate trip for continuous residence checks

- **`isValidTripForRiskAssessment`** *(exported)*
  ```typescript
  (trip: Trip): boolean
  ```
  Validate simulated trip for risk assessment

- **`isValidTripWithId`** *(exported)*
  ```typescript
  (trip: Trip): boolean
  ```
  Type guard ensuring trip has valid ID

- **`validateTripForCalculation`** *(exported)*
  ```typescript
  (trip: Trip, requirements?: ValidationRequirements): boolean
  ```
  Validate trip meets specific requirements

### Schema Utilities

**File**: `/schemas/calculation-helpers.ts`

- **`toDaysAbroadByYearOutput`** *(exported)*
  ```typescript
  (data: YearlyDaysAbroad[]): DaysAbroadByYearOutput[]
  ```
  Transform to output format

**File**: `/schemas/compliance-helpers.ts`

- **`toActiveComplianceItemOutput`** *(exported)*
  ```typescript
  (item: ActiveComplianceItem): ActiveComplianceItemOutput
  ```
  Transform to output format

- **`toPriorityComplianceItemOutput`** *(exported)*
  ```typescript
  (item: PriorityComplianceItem): PriorityComplianceItemOutput
  ```
  Transform to output format

- **`toUpcomingDeadlineOutput`** *(exported)*
  ```typescript
  (deadline: UpcomingDeadline): UpcomingDeadlineOutput
  ```
  Transform to output format

**File**: `/schemas/travel-analytics-helpers.ts`

- **`toCountryStatisticsOutput`** *(exported)*
  ```typescript
  (stats: CountryStatistics[]): CountryStatisticsOutput[]
  ```
  Transform to output format

- **`toTravelStreakOutput`** *(exported)*
  ```typescript
  (streak: TravelStreak): TravelStreakOutput
  ```
  Transform to output format

- **`toTripRiskAssessmentOutput`** *(exported)*
  ```typescript
  (assessment: TripRiskAssessment): TripRiskAssessmentOutput
  ```
  Transform to output format

---

## Alphabetical Function Index

All 231 functions listed alphabetically with their file locations (including safe wrappers and error utilities):

- `addFinalPresenceStreak` *(internal)* - `/business-logic/calculations/travel-analytics/streak-helpers.ts`
- `addGapStreaks` *(internal)* - `/business-logic/calculations/travel-analytics/streak-helpers.ts`
- `addInitialPresenceStreak` *(internal)* - `/business-logic/calculations/travel-analytics/streak-helpers.ts`
- `addUTCDays` *(exported)* - `/utils/date-helpers.ts`
- `adjustForWeekend` *(exported)* - `/business-logic/calculations/compliance/tax-deadline-helpers.ts`
- `adjustRiskScoreForMitigatingFactors` *(internal)* - `/business-logic/calculations/lpr-status/analysis-helpers.ts`
- `analyzePatternOfNonResidence` *(exported)* - `/business-logic/calculations/lpr-status/pattern-analysis.ts`
- `analyzePatterns` *(exported)* - `/business-logic/calculations/lpr-status/analysis-helpers.ts`
- `assessRiskAndStatus` *(exported)* - `/business-logic/calculations/lpr-status/analysis-helpers.ts`
- `assessRiskOfLosingPermanentResidentStatus` *(exported)* - `/business-logic/calculations/lpr-status/calculator.ts`
- `assessRiskOfLosingPermanentResidentStatusAdvanced` *(exported)* - `/business-logic/calculations/lpr-status/calculator.ts`
- `assessTravelRisk` *(exported)* - `/business-logic/calculations/travel-risk/helpers.ts`
- `assessTripRiskForAllLegalThresholds` *(exported)* - `/business-logic/calculations/travel-risk/assessment.ts`
- `assessUpcomingTripRisk` *(exported)* - `/business-logic/calculations/travel-analytics/analytics.ts`
- `calculateAdvancedRiskScore` *(internal)* - `/business-logic/calculations/lpr-status/advanced-helpers.ts`
- `calculateAnniversaryDate` *(exported)* - `/business-logic/calculations/travel-analytics/helpers.ts`
- `calculateBasicRiskScore` *(internal)* - `/business-logic/calculations/lpr-status/analysis-helpers.ts`
- `calculateBoundaryAdjustment` *(internal)* - `/business-logic/calculations/travel-analytics/helpers.ts`
- `calculateComprehensiveCompliance` *(exported)* - `/business-logic/calculations/compliance/compliance-coordinator.ts`
- `calculateConfidenceLevel` *(exported)* - `/business-logic/calculations/travel-risk/helpers.ts`
- `calculateCountryStatistics` *(exported)* - `/business-logic/calculations/travel-analytics/analytics.ts`
- `calculateDaysAbroadByYear` *(exported)* - `/business-logic/calculations/travel-analytics/analytics.ts`
- `calculateDaysAbroadInYear` *(exported)* - `/business-logic/calculations/travel-analytics/helpers.ts`
- `calculateDaysOfPhysicalPresence` *(exported)* - `/business-logic/calculations/presence/calculator.ts`
- `calculateEligibilityDates` *(exported)* - `/business-logic/calculations/presence/calculator.ts`
- `calculateGreenCardAbandonmentRisk` *(exported)* - `/business-logic/calculations/travel-risk/abandonment.ts`
- `calculateGreenCardRenewalStatus` *(exported)* - `/business-logic/calculations/compliance/green-card-renewal.ts`
- `calculateHistoricalAbsenceRate` *(internal)* - `/business-logic/calculations/travel-analytics/analytics.ts`
- `calculateMaximumTripDurationToMaintainAllStatuses` *(exported)* - `/business-logic/calculations/lpr-status/duration-calculator.ts`
- `calculateMaximumTripDurationWithExemptions` *(exported)* - `/business-logic/calculations/lpr-status/calculator.ts`
- `calculateMilestones` *(exported)* - `/business-logic/calculations/reporting/milestones.ts`
- `calculatePercentageOfTimeAbroad` *(internal)* - `/business-logic/calculations/travel-risk/helpers.ts`
- `calculatePresenceStatus` *(exported)* - `/business-logic/calculations/presence/calculator.ts`
- `calculateProjectionConfidence` *(internal)* - `/business-logic/calculations/travel-analytics/analytics.ts`
- `calculateRebuttablePresumption` *(exported)* - `/business-logic/calculations/lpr-status/advanced-helpers.ts`
- `calculateRecentYearsData` *(internal)* - `/business-logic/calculations/travel-risk/helpers.ts`
- `calculateRemovalOfConditionsStatus` *(exported)* - `/business-logic/calculations/compliance/removal-of-conditions.ts`
- `calculateRiskFactors` *(exported)* - `/business-logic/calculations/lpr-status/advanced-helpers.ts`
- `calculateSafeTravelBudget` *(exported)* - `/business-logic/calculations/travel-analytics/budget-helpers.ts`
- `calculateSelectiveServiceStatus` *(exported)* - `/business-logic/calculations/compliance/selective-service.ts`
- `calculateTaxReminderStatus` *(exported)* - `/business-logic/calculations/compliance/tax-reminders.ts`
- `calculateTimeInsideUSA` *(internal)* - `/business-logic/calculations/lpr-status/advanced-helpers.ts`
- `calculateTotalInclusiveDays` *(exported)* - `/business-logic/calculations/travel-analytics/helpers.ts`
- `calculateTravelStreaks` *(exported)* - `/business-logic/calculations/travel-analytics/streak-helpers.ts`
- `calculateTripDaysAbroad` *(exported)* - `/business-logic/calculations/presence/helpers.ts`
- `calculateTripDaysAbroadExcludingTravelDays` *(exported)* - `/business-logic/calculations/travel-analytics/helpers.ts`
- `calculateTripDaysExcludingTravel` *(exported)* - `/utils/trip-calculations.ts`
- `calculateTripDaysInPeriod` *(exported)* - `/utils/trip-calculations.ts`
- `calculateTripDaysInYear` *(exported)* - `/utils/trip-calculations.ts`
- `calculateTripDuration` *(exported)* - `/utils/trip-calculations.ts`
- `calculateTripMetrics` *(exported)* - `/business-logic/calculations/lpr-status/helpers.ts`
- `calculateVariance` *(internal)* - `/business-logic/calculations/travel-risk/helpers.ts`
- `calculateYearSummaryData` *(exported)* - `/business-logic/calculations/reporting/annual-summary.ts`
- `chainResult` *(exported)* - `/errors/index.ts`
- `checkContinuousResidence` *(exported)* - `/business-logic/calculations/presence/calculator.ts`
- `checkIfTripApproachesContinuousResidenceRisk` *(exported)* - `/business-logic/calculations/travel-risk/abandonment.ts`
- `checkIfTripApproachesGreenCardLoss` *(exported)* - `/business-logic/calculations/travel-risk/abandonment.ts`
- `checkIfTripBreaksContinuousResidence` *(exported)* - `/business-logic/calculations/travel-risk/abandonment.ts`
- `checkIfTripRisksAutomaticGreenCardLoss` *(exported)* - `/business-logic/calculations/travel-risk/abandonment.ts`
- `combineResults` *(exported)* - `/errors/index.ts`
- `compareWithPreviousYear` *(exported)* - `/business-logic/calculations/reporting/annual-summary.ts`
- `createEarlyFilingMilestone` *(internal)* - `/business-logic/calculations/reporting/milestones.ts`
- `createNoHistoryProjection` *(internal)* - `/business-logic/calculations/travel-analytics/analytics.ts`
- `createPhysicalPresenceMilestone` *(internal)* - `/business-logic/calculations/reporting/milestones.ts`
- `createPresenceStreak` *(exported)* - `/business-logic/calculations/travel-analytics/helpers.ts`
- `createProjectionWithHistory` *(internal)* - `/business-logic/calculations/travel-analytics/analytics.ts`
- `createResidenceWarning` *(exported)* - `/business-logic/calculations/presence/helpers.ts`
- `determineCurrentStatus` *(exported)* - `/business-logic/calculations/lpr-status/advanced-helpers.ts`
- `determineCurrentStatus` *(internal)* - `/business-logic/calculations/compliance/removal-of-conditions.ts`
- `determineGreenCardRenewalUrgency` *(exported)* - `/business-logic/calculations/compliance/compliance-helpers.ts`
- `determineGreenCardRiskLevel` *(exported)* - `/business-logic/calculations/travel-risk/assessment-helpers.ts`
- `determineIfReentryPermitProvidesProtection` *(exported)* - `/business-logic/calculations/lpr-status/permit-helpers.ts`
- `determineIfReentryPermitProvidesProtectionAdvanced` *(exported)* - `/business-logic/calculations/lpr-status/permit-helpers.ts`
- `determineTaxFilingUrgency` *(exported)* - `/business-logic/calculations/compliance/compliance-helpers.ts`
- `determineTravelBudgetRisk` *(exported)* - `/business-logic/calculations/travel-risk/helpers.ts`
- `determineTravelTrend` *(exported)* - `/business-logic/calculations/travel-risk/helpers.ts`
- `endOfUTCDay` *(exported)* - `/utils/date-helpers.ts`
- `err` *(exported)* - `/errors/index.ts`
- `filterValidTrips` *(exported)* - `/utils/validation.ts`
- `formatDate` *(exported)* - `/utils/date-helpers.ts`
- `formatDateRange` *(exported)* - `/business-logic/calculations/travel-analytics/helpers.ts`
- `formatLongestTrip` *(exported)* - `/business-logic/calculations/reporting/annual-summary.ts`
- `formatUTCDate` *(exported)* - `/utils/date-helpers.ts`, `/utils/utc-date-helpers.ts`
- `generateAnnualTravelSummary` *(exported)* - `/business-logic/calculations/reporting/annual-summary.ts`
- `generateLPRStatusRecommendations` *(exported)* - `/business-logic/calculations/lpr-status/helpers.ts`
- `generateRecommendationsForRiskLevel` *(exported)* - `/business-logic/calculations/travel-risk/assessment-helpers.ts`
- `generateSuggestions` *(exported)* - `/business-logic/calculations/lpr-status/advanced-helpers.ts`
- `generateWarningsForDaysAbroad` *(exported)* - `/business-logic/calculations/travel-risk/assessment-helpers.ts`
- `getActiveComplianceItems` *(exported)* - `/business-logic/calculations/compliance/compliance-coordinator.ts`
- `getActiveGreenCardRenewalItem` *(exported)* - `/business-logic/calculations/compliance/active-item-helpers.ts`
- `getActiveRemovalOfConditionsItem` *(exported)* - `/business-logic/calculations/compliance/active-item-helpers.ts`
- `getActiveSelectiveServiceItem` *(exported)* - `/business-logic/calculations/compliance/active-item-helpers.ts`
- `getActiveTaxFilingItem` *(exported)* - `/business-logic/calculations/compliance/active-item-helpers.ts`
- `getActualTaxDeadline` *(exported)* - `/business-logic/calculations/compliance/tax-reminders.ts`
- `getActualValidTrips` *(exported)* - `/business-logic/calculations/travel-analytics/helpers.ts`, `/utils/validation.ts`
- `getAdvancedRiskLevel` *(internal)* - `/business-logic/calculations/lpr-status/advanced-helpers.ts`
- `getAgeInYears` *(exported)* - `/business-logic/calculations/compliance/selective-service.ts`
- `getBaseDeadlineForYear` *(internal)* - `/business-logic/calculations/compliance/tax-reminders.ts`
- `getCurrentDate` *(exported)* - `/utils/date-helpers.ts`
- `getCurrentUTCDate` *(exported)* - `/utils/date-helpers.ts`, `/utils/utc-date-helpers.ts`
- `getDaysInMonth` *(exported)* - `/utils/date-helpers.ts`
- `getDaysUntilAgedOut` *(exported)* - `/business-logic/calculations/compliance/selective-service.ts`
- `getDaysUntilFilingWindow` *(exported)* - `/business-logic/calculations/compliance/removal-of-conditions.ts`
- `getDaysUntilRegistrationRequired` *(exported)* - `/business-logic/calculations/compliance/selective-service.ts`
- `getDaysUntilSpecificDeadline` *(exported)* - `/business-logic/calculations/compliance/tax-reminders.ts`
- `getDaysUntilTaxDeadline` *(exported)* - `/business-logic/calculations/compliance/tax-reminders.ts`
- `getDefaultCountryData` *(exported)* - `/business-logic/calculations/travel-analytics/helpers.ts`
- `getEffectiveTripDates` *(internal)* - `/business-logic/calculations/travel-analytics/helpers.ts`
- `getExtensionInfo` *(exported)* - `/business-logic/calculations/compliance/tax-reminders.ts`
- `getFilingWindowDates` *(exported)* - `/business-logic/calculations/compliance/removal-of-conditions.ts`
- `getGreenCardExpirationDeadline` *(exported)* - `/business-logic/calculations/compliance/compliance-helpers.ts`
- `getGreenCardRenewalPriorityItem` *(exported)* - `/business-logic/calculations/compliance/compliance-helpers.ts`
- `getHighRiskRecommendation` *(internal)* - `/business-logic/calculations/travel-risk/helpers.ts`
- `getLowRiskRecommendation` *(internal)* - `/business-logic/calculations/travel-risk/helpers.ts`
- `getMediumRiskRecommendation` *(internal)* - `/business-logic/calculations/travel-risk/helpers.ts`
- `getMonthsUntilExpiration` *(exported)* - `/business-logic/calculations/compliance/green-card-renewal.ts`
- `getNextTaxDeadline` *(exported)* - `/business-logic/calculations/compliance/tax-reminders.ts`
- `getNoRiskRecommendation` *(internal)* - `/business-logic/calculations/travel-risk/helpers.ts`
- `getPriorityComplianceItems` *(exported)* - `/business-logic/calculations/compliance/compliance-coordinator.ts`
- `getRecentYearsData` *(internal)* - `/business-logic/calculations/travel-risk/helpers.ts`
- `getReentryPermitProtectedThresholds` *(exported)* - `/business-logic/calculations/travel-risk/abandonment.ts`
- `getRegistrationDeadline` *(exported)* - `/business-logic/calculations/compliance/selective-service.ts`
- `getRemovalOfConditionsDeadline` *(exported)* - `/business-logic/calculations/compliance/removal-of-conditions.ts`
- `getRemovalOfConditionsPriorityItem` *(exported)* - `/business-logic/calculations/compliance/compliance-helpers.ts`
- `getRemovalOfConditionsStatus` *(internal)* - `/business-logic/calculations/compliance/compliance-coordinator.ts`
- `getRemovalOfConditionsUpcomingDeadline` *(exported)* - `/business-logic/calculations/compliance/compliance-helpers.ts`
- `getRenewalUrgency` *(exported)* - `/business-logic/calculations/compliance/green-card-renewal.ts`
- `getRenewalWindowStartDate` *(exported)* - `/business-logic/calculations/compliance/green-card-renewal.ts`
- `getRequiredDays` *(exported)* - `/business-logic/calculations/travel-analytics/helpers.ts`
- `getRequiredYears` *(exported)* - `/business-logic/calculations/travel-analytics/helpers.ts`
- `getRiskImpactDescription` *(exported)* - `/business-logic/calculations/travel-risk/helpers.ts`
- `getRiskRecommendation` *(exported)* - `/business-logic/calculations/travel-risk/helpers.ts`
- `getSelectiveServiceDeadline` *(exported)* - `/business-logic/calculations/compliance/compliance-helpers.ts`
- `getSelectiveServicePriorityItem` *(exported)* - `/business-logic/calculations/compliance/compliance-helpers.ts`
- `getSimulatedValidTrips` *(exported)* - `/utils/validation.ts`
- `getTaxFilingDeadline` *(exported)* - `/business-logic/calculations/compliance/compliance-helpers.ts`
- `getTaxFilingPriorityItem` *(exported)* - `/business-logic/calculations/compliance/compliance-helpers.ts`
- `getTaxSeasonDateRange` *(exported)* - `/business-logic/calculations/compliance/tax-reminders.ts`
- `getTopDestinations` *(exported)* - `/business-logic/calculations/reporting/annual-summary.ts`
- `getUpcomingDeadlines` *(exported)* - `/business-logic/calculations/compliance/compliance-coordinator.ts`
- `getUTCYear` *(exported)* - `/utils/date-helpers.ts`, `/utils/utc-date-helpers.ts`
- `getVeryHighRiskRecommendation` *(internal)* - `/business-logic/calculations/travel-risk/helpers.ts`
- `getYearBoundaries` *(exported)* - `/business-logic/calculations/travel-analytics/helpers.ts`
- `getYearTrips` *(exported)* - `/business-logic/calculations/reporting/annual-summary.ts`
- `handleAbandonmentRiskSuggestions` *(exported)* - `/business-logic/calculations/lpr-status/suggestion-helpers.ts`
- `handleAlreadyEligible` *(internal)* - `/business-logic/calculations/travel-analytics/analytics.ts`
- `handleConditionalResidentSuggestions` *(exported)* - `/business-logic/calculations/lpr-status/suggestion-helpers.ts`
- `handleGeneralRiskSuggestions` *(exported)* - `/business-logic/calculations/lpr-status/suggestion-helpers.ts`
- `handleImpossibleEligibility` *(internal)* - `/business-logic/calculations/travel-analytics/analytics.ts`
- `handleN470ExemptionSuggestions` *(exported)* - `/business-logic/calculations/lpr-status/suggestion-helpers.ts`
- `handleReentryPermitSuggestions` *(exported)* - `/business-logic/calculations/lpr-status/suggestion-helpers.ts`
- `hasHighFrequencyShortTrips` *(internal)* - `/business-logic/calculations/lpr-status/advanced-helpers.ts`
- `hasRiskyTrips` *(exported)* - `/business-logic/calculations/lpr-status/helpers.ts`
- `isCurrentlyTaxSeason` *(exported)* - `/business-logic/calculations/compliance/tax-reminders.ts`
- `isEligibleForEarlyFiling` *(exported)* - `/business-logic/calculations/presence/calculator.ts`
- `isErr` *(exported)* - `/errors/index.ts`
- `isInFilingWindow` *(exported)* - `/business-logic/calculations/compliance/removal-of-conditions.ts`
- `isInRenewalWindow` *(exported)* - `/business-logic/calculations/compliance/green-card-renewal.ts`
- `isLeapYear` *(exported)* - `/utils/date-helpers.ts`
- `isOk` *(exported)* - `/errors/index.ts`
- `isSelectiveServiceRequired` *(exported)* - `/business-logic/calculations/compliance/selective-service.ts`
- `isValidDate` *(exported)* - `/utils/date-helpers.ts`
- `isValidDateFormat` *(exported)* - `/utils/date-helpers.ts`
- `isValidTrip` *(exported)* - `/utils/validation.ts`
- `isValidTripForResidenceCheck` *(exported)* - `/utils/validation.ts`
- `isValidTripForRiskAssessment` *(exported)* - `/utils/validation.ts`
- `isValidTripWithId` *(exported)* - `/utils/validation.ts`
- `isWithinYearBoundaries` *(internal)* - `/business-logic/calculations/travel-analytics/helpers.ts`
- `mapError` *(exported)* - `/errors/index.ts`
- `mapResult` *(exported)* - `/errors/index.ts`
- `mapRiskLevelToDescription` *(exported)* - `/business-logic/calculations/travel-risk/assessment-helpers.ts`
- `mapToBasicRiskLevel` *(internal)* - `/business-logic/calculations/lpr-status/helpers.ts`
- `ok` *(exported)* - `/errors/index.ts`
- `parseDate` *(exported)* - `/utils/date-helpers.ts`
- `parseDateInput` *(exported)* - `/utils/date-helpers.ts`
- `parseTripDates` *(exported)* - `/business-logic/calculations/travel-analytics/helpers.ts`
- `parseUTCDate` *(exported)* - `/utils/date-helpers.ts`, `/utils/utc-date-helpers.ts`
- `populateTripDaysSet` *(exported)* - `/utils/trip-calculations.ts`
- `projectEligibilityDate` *(exported)* - `/business-logic/calculations/travel-analytics/analytics.ts`
- `safeAssessRiskOfLosingPermanentResidentStatus` *(exported)* - `/business-logic/calculations/lpr-status/safe-calculator.ts`
- `safeAssessRiskOfLosingPermanentResidentStatusAdvanced` *(exported)* - `/business-logic/calculations/lpr-status/safe-calculator.ts`
- `safeAssessTripRiskForAllLegalThresholds` *(exported)* - `/business-logic/calculations/travel-risk/safe-assessment.ts`
- `safeAssessUpcomingTripRisk` *(exported)* - `/business-logic/calculations/travel-analytics/safe-analytics.ts`
- `safeCalculateComprehensiveCompliance` *(exported)* - `/business-logic/calculations/compliance/safe-compliance-coordinator.ts`
- `safeCalculateCountryStatistics` *(exported)* - `/business-logic/calculations/travel-analytics/safe-analytics.ts`
- `safeCalculateDaysAbroadByYear` *(exported)* - `/business-logic/calculations/travel-analytics/safe-analytics.ts`
- `safeCalculateDaysOfPhysicalPresence` *(exported)* - `/business-logic/calculations/presence/safe-calculator.ts`
- `safeCalculateEligibilityDates` *(exported)* - `/business-logic/calculations/presence/safe-calculator.ts`
- `safeCalculateGreenCardRenewalStatus` *(exported)* - `/business-logic/calculations/compliance/safe-compliance-functions.ts`
- `safeCalculateMaximumTripDurationWithExemptions` *(exported)* - `/business-logic/calculations/lpr-status/safe-calculator.ts`
- `safeCalculatePresenceStatus` *(exported)* - `/business-logic/calculations/presence/safe-calculator.ts`
- `safeCalculateRemovalOfConditionsStatus` *(exported)* - `/business-logic/calculations/compliance/safe-compliance-functions.ts`
- `safeCalculateSelectiveServiceStatus` *(exported)* - `/business-logic/calculations/compliance/safe-compliance-functions.ts`
- `safeCalculateTaxReminderStatus` *(exported)* - `/business-logic/calculations/compliance/safe-compliance-functions.ts`
- `safeCalculateTripDaysInPeriod` *(exported)* - `/utils/safe-trip-calculations.ts`
- `safeCalculateTripDaysInYear` *(exported)* - `/utils/safe-trip-calculations.ts`
- `safeCalculateTripDuration` *(exported)* - `/utils/safe-trip-calculations.ts`
- `safeCheckContinuousResidence` *(exported)* - `/business-logic/calculations/presence/safe-calculator.ts`
- `safeProjectEligibilityDate` *(exported)* - `/business-logic/calculations/travel-analytics/safe-analytics.ts`
- `sortPriorityItems` *(exported)* - `/business-logic/calculations/compliance/compliance-helpers.ts`
- `startOfUTCDay` *(exported)* - `/utils/date-helpers.ts`
- `subUTCDays` *(exported)* - `/utils/date-helpers.ts`, `/utils/utc-date-helpers.ts`
- `toActiveComplianceItemOutput` *(exported)* - `/schemas/compliance-helpers.ts`
- `toCountryStatisticsOutput` *(exported)* - `/schemas/travel-analytics-helpers.ts`
- `toDaysAbroadByYearOutput` *(exported)* - `/schemas/calculation-helpers.ts`
- `toPriorityComplianceItemOutput` *(exported)* - `/schemas/compliance-helpers.ts`
- `toTravelStreakOutput` *(exported)* - `/schemas/travel-analytics-helpers.ts`
- `toTripRiskAssessmentOutput` *(exported)* - `/schemas/travel-analytics-helpers.ts`
- `toUpcomingDeadlineOutput` *(exported)* - `/schemas/compliance-helpers.ts`
- `unwrapOr` *(exported)* - `/errors/index.ts`
- `unwrapResult` *(exported)* - `/errors/index.ts`
- `updateCountryData` *(exported)* - `/business-logic/calculations/travel-analytics/helpers.ts`
- `validateAndParseDates` *(exported)* - `/business-logic/calculations/presence/helpers.ts`
- `validateTripForCalculation` *(exported)* - `/utils/validation.ts`
- `willBeAbroadDuringTaxSeason` *(exported)* - `/business-logic/calculations/compliance/tax-reminders.ts`

---

## Functions by File Path

### Business Logic Files

#### `/business-logic/calculations/compliance/active-item-helpers.ts`
- getActiveGreenCardRenewalItem *(exported)*
- getActiveRemovalOfConditionsItem *(exported)*
- getActiveSelectiveServiceItem *(exported)*
- getActiveTaxFilingItem *(exported)*

#### `/business-logic/calculations/compliance/compliance-coordinator.ts`
- calculateComprehensiveCompliance *(exported)*
- getActiveComplianceItems *(exported)*
- getPriorityComplianceItems *(exported)*
- getUpcomingDeadlines *(exported)*
- getRemovalOfConditionsStatus *(internal)*

#### `/business-logic/calculations/compliance/compliance-helpers.ts`
- determineGreenCardRenewalUrgency *(exported)*
- determineTaxFilingUrgency *(exported)*
- getGreenCardExpirationDeadline *(exported)*
- getGreenCardRenewalPriorityItem *(exported)*
- getRemovalOfConditionsPriorityItem *(exported)*
- getRemovalOfConditionsUpcomingDeadline *(exported)*
- getSelectiveServiceDeadline *(exported)*
- getSelectiveServicePriorityItem *(exported)*
- getTaxFilingDeadline *(exported)*
- getTaxFilingPriorityItem *(exported)*
- sortPriorityItems *(exported)*

#### `/business-logic/calculations/compliance/green-card-renewal.ts`
- calculateGreenCardRenewalStatus *(exported)*
- getMonthsUntilExpiration *(exported)*
- getRenewalUrgency *(exported)*
- getRenewalWindowStartDate *(exported)*
- isInRenewalWindow *(exported)*

#### `/business-logic/calculations/compliance/removal-of-conditions.ts`
- calculateRemovalOfConditionsStatus *(exported)*
- getDaysUntilFilingWindow *(exported)*
- getFilingWindowDates *(exported)*
- getRemovalOfConditionsDeadline *(exported)*
- isInFilingWindow *(exported)*
- determineCurrentStatus *(internal)*

#### `/business-logic/calculations/compliance/selective-service.ts`
- calculateSelectiveServiceStatus *(exported)*
- getAgeInYears *(exported)*
- getDaysUntilAgedOut *(exported)*
- getDaysUntilRegistrationRequired *(exported)*
- getRegistrationDeadline *(exported)*
- isSelectiveServiceRequired *(exported)*

#### `/business-logic/calculations/compliance/tax-deadline-helpers.ts`
- adjustForWeekend *(exported)*

#### `/business-logic/calculations/compliance/tax-reminders.ts`
- calculateTaxReminderStatus *(exported)*
- getActualTaxDeadline *(exported)*
- getDaysUntilSpecificDeadline *(exported)*
- getDaysUntilTaxDeadline *(exported)*
- getExtensionInfo *(exported)*
- getNextTaxDeadline *(exported)*
- getTaxSeasonDateRange *(exported)*
- isCurrentlyTaxSeason *(exported)*
- willBeAbroadDuringTaxSeason *(exported)*
- getBaseDeadlineForYear *(internal)*

#### `/business-logic/calculations/lpr-status/advanced-helpers.ts`
- calculateRebuttablePresumption *(exported)*
- calculateRiskFactors *(exported)*
- determineCurrentStatus *(exported)*
- generateSuggestions *(exported)*
- getAdvancedRiskLevel *(internal)*
- calculateAdvancedRiskScore *(internal)*
- calculateTimeInsideUSA *(internal)*
- hasHighFrequencyShortTrips *(internal)*

#### `/business-logic/calculations/lpr-status/analysis-helpers.ts`
- analyzePatterns *(exported)*
- assessRiskAndStatus *(exported)*
- calculateBasicRiskScore *(internal)*
- adjustRiskScoreForMitigatingFactors *(internal)*

#### `/business-logic/calculations/lpr-status/calculator.ts`
- assessRiskOfLosingPermanentResidentStatus *(exported)*
- assessRiskOfLosingPermanentResidentStatusAdvanced *(exported)*
- calculateMaximumTripDurationWithExemptions *(exported)*

#### `/business-logic/calculations/lpr-status/duration-calculator.ts`
- calculateMaximumTripDurationToMaintainAllStatuses *(exported)*

#### `/business-logic/calculations/lpr-status/helpers.ts`
- calculateTripMetrics *(exported)*
- generateLPRStatusRecommendations *(exported)*
- hasRiskyTrips *(exported)*
- mapToBasicRiskLevel *(internal)*

#### `/business-logic/calculations/lpr-status/pattern-analysis.ts`
- analyzePatternOfNonResidence *(exported)*

#### `/business-logic/calculations/lpr-status/permit-helpers.ts`
- determineIfReentryPermitProvidesProtection *(exported)*
- determineIfReentryPermitProvidesProtectionAdvanced *(exported)*

#### `/business-logic/calculations/lpr-status/suggestion-helpers.ts`
- handleAbandonmentRiskSuggestions *(exported)*
- handleConditionalResidentSuggestions *(exported)*
- handleGeneralRiskSuggestions *(exported)*
- handleN470ExemptionSuggestions *(exported)*
- handleReentryPermitSuggestions *(exported)*

#### `/business-logic/calculations/presence/calculator.ts`
- calculateDaysOfPhysicalPresence *(exported)*
- calculateEligibilityDates *(exported)*
- calculatePresenceStatus *(exported)*
- checkContinuousResidence *(exported)*
- isEligibleForEarlyFiling *(exported)*

#### `/business-logic/calculations/presence/helpers.ts`
- calculateTripDaysAbroad *(exported)*
- createResidenceWarning *(exported)*
- validateAndParseDates *(exported)*

#### `/business-logic/calculations/reporting/annual-summary.ts`
- calculateYearSummaryData *(exported)*
- compareWithPreviousYear *(exported)*
- formatLongestTrip *(exported)*
- generateAnnualTravelSummary *(exported)*
- getTopDestinations *(exported)*
- getYearTrips *(exported)*

#### `/business-logic/calculations/reporting/milestones.ts`
- calculateMilestones *(exported)*
- createEarlyFilingMilestone *(internal)*
- createPhysicalPresenceMilestone *(internal)*

#### `/business-logic/calculations/travel-analytics/analytics.ts`
- assessUpcomingTripRisk *(exported)*
- calculateCountryStatistics *(exported)*
- calculateDaysAbroadByYear *(exported)*
- projectEligibilityDate *(exported)*
- calculateHistoricalAbsenceRate *(internal)*
- handleAlreadyEligible *(internal)*
- handleImpossibleEligibility *(internal)*
- calculateProjectionConfidence *(internal)*
- createNoHistoryProjection *(internal)*
- createProjectionWithHistory *(internal)*

#### `/business-logic/calculations/travel-analytics/budget-helpers.ts`
- calculateSafeTravelBudget *(exported)*

#### `/business-logic/calculations/travel-analytics/helpers.ts`
- calculateAnniversaryDate *(exported)*
- calculateDaysAbroadInYear *(exported)*
- calculateTotalInclusiveDays *(exported)*
- calculateTripDaysAbroadExcludingTravelDays *(exported)*
- createPresenceStreak *(exported)*
- formatDateRange *(exported)*
- getActualValidTrips *(exported)*
- getDefaultCountryData *(exported)*
- getRequiredDays *(exported)*
- getRequiredYears *(exported)*
- getYearBoundaries *(exported)*
- parseTripDates *(exported)*
- updateCountryData *(exported)*
- isWithinYearBoundaries *(internal)*
- getEffectiveTripDates *(internal)*
- calculateBoundaryAdjustment *(internal)*

#### `/business-logic/calculations/travel-analytics/streak-helpers.ts`
- calculateTravelStreaks *(exported)*
- addFinalPresenceStreak *(internal)*
- addGapStreaks *(internal)*
- addInitialPresenceStreak *(internal)*

#### `/business-logic/calculations/travel-risk/abandonment.ts`
- calculateGreenCardAbandonmentRisk *(exported)*
- checkIfTripApproachesContinuousResidenceRisk *(exported)*
- checkIfTripApproachesGreenCardLoss *(exported)*
- checkIfTripBreaksContinuousResidence *(exported)*
- checkIfTripRisksAutomaticGreenCardLoss *(exported)*
- getReentryPermitProtectedThresholds *(exported)*

#### `/business-logic/calculations/travel-risk/assessment-helpers.ts`
- determineGreenCardRiskLevel *(exported)*
- generateRecommendationsForRiskLevel *(exported)*
- generateWarningsForDaysAbroad *(exported)*
- mapRiskLevelToDescription *(exported)*

#### `/business-logic/calculations/travel-risk/assessment.ts`
- assessTripRiskForAllLegalThresholds *(exported)*

#### `/business-logic/calculations/travel-risk/helpers.ts`
- assessTravelRisk *(exported)*
- calculateConfidenceLevel *(exported)*
- determineTravelBudgetRisk *(exported)*
- determineTravelTrend *(exported)*
- getRiskImpactDescription *(exported)*
- getRiskRecommendation *(exported)*
- calculatePercentageOfTimeAbroad *(internal)*
- getHighRiskRecommendation *(internal)*
- getMediumRiskRecommendation *(internal)*
- getLowRiskRecommendation *(internal)*
- getVeryHighRiskRecommendation *(internal)*
- getNoRiskRecommendation *(internal)*
- calculateRecentYearsData *(internal)*
- calculateVariance *(internal)*

### Utility Files

#### `/utils/date-helpers.ts`
- addUTCDays *(exported)*
- endOfUTCDay *(exported)*
- formatDate *(exported)*
- formatUTCDate *(exported)*
- getCurrentDate *(exported)*
- getCurrentUTCDate *(exported)*
- getDaysInMonth *(exported)*
- getUTCYear *(exported)*
- isLeapYear *(exported)*
- isValidDate *(exported)*
- isValidDateFormat *(exported)*
- parseDate *(exported)*
- parseDateInput *(exported)*
- parseUTCDate *(exported)*
- startOfUTCDay *(exported)*
- subUTCDays *(exported)*

#### `/utils/trip-calculations.ts`
- calculateTripDuration *(exported)*
- calculateTripDaysExcludingTravel *(exported)*
- calculateTripDaysInPeriod *(exported)*
- calculateTripDaysInYear *(exported)*
- populateTripDaysSet *(exported)*

#### `/utils/utc-date-helpers.ts`
- formatUTCDate *(exported)*
- getCurrentUTCDate *(exported)*
- getUTCYear *(exported)*
- parseUTCDate *(exported)*
- subUTCDays *(exported)*

#### `/utils/validation.ts`
- filterValidTrips *(exported)*
- getActualValidTrips *(exported)*
- getSimulatedValidTrips *(exported)*
- isValidTrip *(exported)*
- isValidTripForResidenceCheck *(exported)*
- isValidTripForRiskAssessment *(exported)*
- isValidTripWithId *(exported)*
- validateTripForCalculation *(exported)*

### Schema Files

#### `/schemas/calculation-helpers.ts`
- toDaysAbroadByYearOutput *(exported)*

#### `/schemas/compliance-helpers.ts`
- toActiveComplianceItemOutput *(exported)*
- toPriorityComplianceItemOutput *(exported)*
- toUpcomingDeadlineOutput *(exported)*

#### `/schemas/travel-analytics-helpers.ts`
- toCountryStatisticsOutput *(exported)*
- toTravelStreakOutput *(exported)*
- toTripRiskAssessmentOutput *(exported)*

---

## Internal Functions Only

All 49 internal (non-exported) functions:

### Compliance (13 internal functions)
- determineCurrentStatus - `/business-logic/calculations/compliance/removal-of-conditions.ts`
- getBaseDeadlineForYear - `/business-logic/calculations/compliance/tax-reminders.ts`
- getRemovalOfConditionsStatus - `/business-logic/calculations/compliance/compliance-coordinator.ts`

### LPR Status (10 internal functions)
- adjustRiskScoreForMitigatingFactors - `/business-logic/calculations/lpr-status/analysis-helpers.ts`
- calculateAdvancedRiskScore - `/business-logic/calculations/lpr-status/advanced-helpers.ts`
- calculateBasicRiskScore - `/business-logic/calculations/lpr-status/analysis-helpers.ts`
- calculateTimeInsideUSA - `/business-logic/calculations/lpr-status/advanced-helpers.ts`
- getAdvancedRiskLevel - `/business-logic/calculations/lpr-status/advanced-helpers.ts`
- hasHighFrequencyShortTrips - `/business-logic/calculations/lpr-status/advanced-helpers.ts`
- mapToBasicRiskLevel - `/business-logic/calculations/lpr-status/helpers.ts`

### Presence (2 internal functions)
- createEarlyFilingMilestone - `/business-logic/calculations/reporting/milestones.ts`
- createPhysicalPresenceMilestone - `/business-logic/calculations/reporting/milestones.ts`

### Travel Analytics (9 internal functions)
- addFinalPresenceStreak - `/business-logic/calculations/travel-analytics/streak-helpers.ts`
- addGapStreaks - `/business-logic/calculations/travel-analytics/streak-helpers.ts`
- addInitialPresenceStreak - `/business-logic/calculations/travel-analytics/streak-helpers.ts`
- calculateBoundaryAdjustment - `/business-logic/calculations/travel-analytics/helpers.ts`
- calculateHistoricalAbsenceRate - `/business-logic/calculations/travel-analytics/analytics.ts`
- calculateProjectionConfidence - `/business-logic/calculations/travel-analytics/analytics.ts`
- createNoHistoryProjection - `/business-logic/calculations/travel-analytics/analytics.ts`
- createProjectionWithHistory - `/business-logic/calculations/travel-analytics/analytics.ts`
- getEffectiveTripDates - `/business-logic/calculations/travel-analytics/helpers.ts`
- handleAlreadyEligible - `/business-logic/calculations/travel-analytics/analytics.ts`
- handleImpossibleEligibility - `/business-logic/calculations/travel-analytics/analytics.ts`
- isWithinYearBoundaries - `/business-logic/calculations/travel-analytics/helpers.ts`

### Travel Risk (9 internal functions)
- calculatePercentageOfTimeAbroad - `/business-logic/calculations/travel-risk/helpers.ts`
- calculateRecentYearsData - `/business-logic/calculations/travel-risk/helpers.ts`
- calculateVariance - `/business-logic/calculations/travel-risk/helpers.ts`
- getHighRiskRecommendation - `/business-logic/calculations/travel-risk/helpers.ts`
- getLowRiskRecommendation - `/business-logic/calculations/travel-risk/helpers.ts`
- getMediumRiskRecommendation - `/business-logic/calculations/travel-risk/helpers.ts`
- getNoRiskRecommendation - `/business-logic/calculations/travel-risk/helpers.ts`
- getRecentYearsData - `/business-logic/calculations/travel-risk/helpers.ts`
- getVeryHighRiskRecommendation - `/business-logic/calculations/travel-risk/helpers.ts`

### Reporting (2 internal functions)
- createEarlyFilingMilestone - `/business-logic/calculations/reporting/milestones.ts`
- createPhysicalPresenceMilestone - `/business-logic/calculations/reporting/milestones.ts`

---

This comprehensive reference combines all function information from both documentation files, providing:
- Complete function signatures with TypeScript types
- Export status (exported vs internal)
- File locations for easy navigation
- Multiple ways to find functions (by feature, alphabetically, by file, internal-only)
- Summary statistics and audit information

Use this document as your one-stop reference for all functions in the USA Presence Calculator shared package.