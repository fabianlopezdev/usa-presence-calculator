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

| Category                  | Exported | Internal | Total | Primary Purpose                                     |
| ------------------------- | -------- | -------- | ----- | --------------------------------------------------- |
| **Compliance Management** | 30       | 13       | 43    | Green card renewal, I-751, selective service, taxes |
| **LPR Status Assessment** | 32       | 10       | 42    | Risk analysis, pattern detection, permit evaluation |
| **Physical Presence**     | 8        | 2        | 10    | USCIS-compliant presence calculations               |
| **Travel Analytics**      | 19       | 9        | 28    | Travel patterns, projections, statistics            |
| **Travel Risk**           | 21       | 9        | 30    | Abandonment risk, comprehensive assessments         |
| **Reporting**             | 6        | 2        | 8     | Annual summaries, milestone tracking                |
| **Safe Wrappers**         | 27       | 0        | 27    | Validated input wrappers with Result type           |
| **Error Handling**        | 10       | 0        | 10    | Result type utilities and error management          |
| **Date Utilities**        | 13       | 0        | 13    | Date manipulation and formatting                    |
| **Trip Calculations**     | 5        | 0        | 5     | USCIS-compliant trip calculations                   |
| **Validation Utilities**  | 8        | 0        | 8     | Trip validation and filtering                       |
| **Schema Utilities**      | 7        | 0        | 7     | Type transformations and helpers                    |

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

- **`getActiveGreenCardRenewalItem`** _(exported)_

  ```typescript
  (status: GreenCardRenewalStatus): ActiveComplianceItem | null
  ```

  Gets active green card renewal compliance item if applicable

- **`getActiveRemovalOfConditionsItem`** _(exported)_

  ```typescript
  (status: RemovalOfConditionsStatus): ActiveComplianceItem | null
  ```

  Gets active removal of conditions compliance item if applicable

- **`getActiveSelectiveServiceItem`** _(exported)_

  ```typescript
  (status: SelectiveServiceStatus): ActiveComplianceItem | null
  ```

  Gets active selective service compliance item if applicable

- **`getActiveTaxFilingItem`** _(exported)_
  ```typescript
  (status: TaxReminderStatus): ActiveComplianceItem | null
  ```
  Gets active tax filing compliance item if applicable

#### Compliance Coordinator

**File**: `/business-logic/calculations/compliance/compliance-coordinator.ts`

- **`calculateComprehensiveCompliance`** _(exported)_

  ```typescript
  (params: ComplianceCalculationParams): ComprehensiveComplianceStatus
  ```

  Aggregates all compliance statuses into a comprehensive report

- **`getActiveComplianceItems`** _(exported)_

  ```typescript
  (compliance: ComprehensiveComplianceStatus): ActiveComplianceItem[]
  ```

  Gets list of compliance items requiring user action

- **`getPriorityComplianceItems`** _(exported)_

  ```typescript
  (compliance: ComprehensiveComplianceStatus): PriorityComplianceItem[]
  ```

  Gets priority compliance items with deadlines

- **`getUpcomingDeadlines`** _(exported)_

  ```typescript
  (compliance: ComprehensiveComplianceStatus, currentDate?: string): UpcomingDeadline[]
  ```

  Gets list of upcoming compliance deadlines

- **`getRemovalOfConditionsStatus`** _(internal)_
  ```typescript
  (isConditionalResident: boolean, greenCardDate: string, currentDate?: string): RemovalOfConditionsStatus
  ```
  Gets removal of conditions status with default for non-conditional residents

#### Compliance Helpers

**File**: `/business-logic/calculations/compliance/compliance-helpers.ts`

- **`determineGreenCardRenewalUrgency`** _(exported)_

  ```typescript
  (status: GreenCardRenewalStatus['currentStatus']): ActiveComplianceItem['urgency']
  ```

  Determines urgency level for green card renewal

- **`determineTaxFilingUrgency`** _(exported)_

  ```typescript
  (daysUntilDeadline: number, isAbroad: boolean): ActiveComplianceItem['urgency']
  ```

  Determines urgency level for tax filing

- **`getGreenCardExpirationDeadline`** _(exported)_

  ```typescript
  (status: GreenCardRenewalStatus, current: Date): UpcomingDeadline | null
  ```

  Gets green card expiration deadline info

- **`getGreenCardRenewalPriorityItem`** _(exported)_

  ```typescript
  (status: GreenCardRenewalStatus): PriorityComplianceItem | null
  ```

  Gets priority item for green card renewal

- **`getRemovalOfConditionsPriorityItem`** _(exported)_

  ```typescript
  (status: RemovalOfConditionsStatus): PriorityComplianceItem | null
  ```

  Gets priority item for I-751 filing

- **`getRemovalOfConditionsUpcomingDeadline`** _(exported)_

  ```typescript
  (status: RemovalOfConditionsStatus): UpcomingDeadline | null
  ```

  Gets upcoming I-751 deadline info

- **`getSelectiveServiceDeadline`** _(exported)_

  ```typescript
  (status: SelectiveServiceStatus, current: Date): UpcomingDeadline | null
  ```

  Gets selective service registration deadline info

- **`getSelectiveServicePriorityItem`** _(exported)_

  ```typescript
  (status: SelectiveServiceStatus): PriorityComplianceItem | null
  ```

  Gets priority item for selective service

- **`getTaxFilingDeadline`** _(exported)_

  ```typescript
  (status: TaxReminderStatus, current: Date): UpcomingDeadline | null
  ```

  Gets tax filing deadline info

- **`getTaxFilingPriorityItem`** _(exported)_

  ```typescript
  (status: TaxReminderStatus): PriorityComplianceItem | null
  ```

  Gets priority item for tax filing

- **`sortPriorityItems`** _(exported)_
  ```typescript
  (items: PriorityComplianceItem[]): PriorityComplianceItem[]
  ```
  Sorts priority items by urgency and type

#### Green Card Renewal

**File**: `/business-logic/calculations/compliance/green-card-renewal.ts`

- **`calculateGreenCardRenewalStatus`** _(exported)_

  ```typescript
  (expirationDate: string, currentDate?: string): GreenCardRenewalStatus
  ```

  Calculates green card renewal requirements and urgency

- **`getMonthsUntilExpiration`** _(exported)_

  ```typescript
  (expirationDate: string, currentDate?: string): number
  ```

  Calculates months until green card expires

- **`getRenewalUrgency`** _(exported)_

  ```typescript
  (expirationDate: string, currentDate?: string): PriorityLevel
  ```

  Determines urgency level for green card renewal

- **`getRenewalWindowStartDate`** _(exported)_

  ```typescript
  (expirationDate: string): string
  ```

  Gets date when renewal window opens

- **`isInRenewalWindow`** _(exported)_
  ```typescript
  (expirationDate: string, currentDate?: string): boolean
  ```
  Checks if currently in renewal filing window

#### Removal of Conditions

**File**: `/business-logic/calculations/compliance/removal-of-conditions.ts`

- **`calculateRemovalOfConditionsStatus`** _(exported)_

  ```typescript
  (isConditionalResident: boolean, greenCardDate: string, currentDate?: string, filingStatus?: 'filed' | 'approved'): RemovalOfConditionsStatus | null
  ```

  Calculates I-751 filing requirements for conditional residents

- **`getDaysUntilFilingWindow`** _(exported)_

  ```typescript
  (greenCardDate: string, currentDate?: string): number
  ```

  Gets days until I-751 filing window opens

- **`getFilingWindowDates`** _(exported)_

  ```typescript
  (greenCardDate: string): { windowStart: string; windowEnd: string }
  ```

  Gets I-751 filing window start and end dates

- **`getRemovalOfConditionsDeadline`** _(exported)_

  ```typescript
  (greenCardDate: string): string
  ```

  Gets deadline for filing I-751

- **`isInFilingWindow`** _(exported)_

  ```typescript
  (greenCardDate: string, currentDate?: string): boolean
  ```

  Checks if currently in I-751 filing window

- **`determineCurrentStatus`** _(internal)_
  ```typescript
  (current: Date, windowStartDate: Date, windowEndDate: Date, filingStatus?: 'filed' | 'approved'): RemovalOfConditionsStatus['currentStatus']
  ```
  Determines current status based on dates and filing status

#### Selective Service

**File**: `/business-logic/calculations/compliance/selective-service.ts`

- **`calculateSelectiveServiceStatus`** _(exported)_

  ```typescript
  (birthDate: string, gender: string, isRegistered: boolean, currentDate?: string): SelectiveServiceStatus
  ```

  Calculates selective service registration requirements

- **`getAgeInYears`** _(exported)_

  ```typescript
  (birthDate: string, currentDate?: string): number
  ```

  Calculates age from birth date

- **`getDaysUntilAgedOut`** _(exported)_

  ```typescript
  (birthDate: string, currentDate?: string): number
  ```

  Gets days until aging out of selective service requirement

- **`getDaysUntilRegistrationRequired`** _(exported)_

  ```typescript
  (birthDate: string, gender: string, currentDate?: string): number
  ```

  Gets days until selective service registration required

- **`getRegistrationDeadline`** _(exported)_

  ```typescript
  (birthDate: string, gender: string): string | null
  ```

  Gets selective service registration deadline

- **`isSelectiveServiceRequired`** _(exported)_
  ```typescript
  (birthDate: string, gender: string, currentDate?: string): boolean
  ```
  Checks if selective service registration is required

#### Tax Deadline Helpers

**File**: `/business-logic/calculations/compliance/tax-deadline-helpers.ts`

- **`adjustForWeekend`** _(exported)_
  ```typescript
  (date: Date): Date
  ```
  Adjusts tax deadline for weekends per IRS rules

#### Tax Reminders

**File**: `/business-logic/calculations/compliance/tax-reminders.ts`

- **`calculateTaxReminderStatus`** _(exported)_

  ```typescript
  (trips: Trip[], reminderDismissed: boolean, currentDate?: string): TaxReminderStatus
  ```

  Calculates tax filing reminder status

- **`getActualTaxDeadline`** _(exported)_

  ```typescript
  (currentDate?: string, deadlineType?: 'standard' | 'abroad_extension' | 'october_extension'): string
  ```

  Gets tax deadline adjusted for weekends/holidays

- **`getDaysUntilSpecificDeadline`** _(exported)_

  ```typescript
  (deadline: string, currentDate?: string): number
  ```

  Gets days until a specific tax deadline

- **`getDaysUntilTaxDeadline`** _(exported)_

  ```typescript
  (currentDate?: string): number
  ```

  Gets days until next tax deadline

- **`getExtensionInfo`** _(exported)_

  ```typescript
  (isAbroad: boolean): { automaticExtension: boolean; extensionDeadline: string | null; requiresForm: boolean; formNumber: string | null }
  ```

  Gets tax extension information for those abroad

- **`getNextTaxDeadline`** _(exported)_

  ```typescript
  (currentDate?: string): string
  ```

  Gets next applicable tax deadline date

- **`getTaxSeasonDateRange`** _(exported)_

  ```typescript
  (currentDate?: string): { start: string; end: string }
  ```

  Gets current tax season date range

- **`isCurrentlyTaxSeason`** _(exported)_

  ```typescript
  (currentDate?: string): boolean
  ```

  Checks if currently in tax season

- **`willBeAbroadDuringTaxSeason`** _(exported)_

  ```typescript
  (trips: Trip[], currentDate?: string): boolean
  ```

  Checks if user will be abroad during tax season

- **`getBaseDeadlineForYear`** _(internal)_
  ```typescript
  (year: number, deadlineType: 'standard' | 'abroad_extension' | 'october_extension'): Date
  ```
  Gets base deadline for a specific year and type

### LPR Status Assessment

#### LPR Status Calculator

**File**: `/business-logic/calculations/lpr-status/calculator.ts`

- **`assessRiskOfLosingPermanentResidentStatus`** _(exported)_

  ```typescript
  (trips: Trip[], greenCardDate: string, asOfDate?: string): LPRStatusRiskAssessment
  ```

  Basic assessment of LPR status risk

- **`assessRiskOfLosingPermanentResidentStatusAdvanced`** _(exported)_

  ```typescript
  (params: AdvancedLPRStatusParams): AdvancedLPRStatusAssessment
  ```

  Advanced LPR status risk assessment

- **`calculateMaximumTripDurationWithExemptions`** _(exported)_
  ```typescript
  (params: MaximumTripCalculationParams): MaximumTripDurationResult
  ```
  Calculates max trip duration with permits/exemptions

#### Duration Calculator

**File**: `/business-logic/calculations/lpr-status/duration-calculator.ts`

- **`calculateMaximumTripDurationToMaintainAllStatuses`** _(exported)_
  ```typescript
  (params: MaximumTripDurationParams): MaximumTripDurationWithStatus
  ```
  Calculates max safe trip duration

#### Pattern Analysis

**File**: `/business-logic/calculations/lpr-status/pattern-analysis.ts`

- **`analyzePatternOfNonResidence`** _(exported)_
  ```typescript
  (trips: Trip[]): PatternAnalysis
  ```
  Analyzes trips for pattern of non-residence

#### Advanced Helpers

**File**: `/business-logic/calculations/lpr-status/advanced-helpers.ts`

- **`calculateRebuttablePresumption`** _(exported)_

  ```typescript
  (longestTrip: number, totalDaysAbroad: number, tripCount: number): RebuttablePresumptionStatus
  ```

  Calculates rebuttable presumption of abandonment

- **`calculateRiskFactors`** _(exported)_

  ```typescript
  (trips: Trip[], greenCardDate: string, asOfDate: string, params: AdvancedLPRStatusParams): RiskFactors
  ```

  Calculates various LPR status risk factors

- **`determineCurrentStatus`** _(exported)_

  ```typescript
  (riskFactors: RiskFactors, params: AdvancedLPRStatusParams): CurrentLPRStatus
  ```

  Determines current LPR status type

- **`generateSuggestions`** _(exported)_

  ```typescript
  (assessment: AdvancedLPRStatusAssessment, params: AdvancedLPRStatusParams): string[]
  ```

  Generates suggestions for maintaining LPR status

- **`getAdvancedRiskLevel`** _(internal)_

  ```typescript
  (status: CurrentLPRStatus, riskScore: number): RiskLevel
  ```

  Determines advanced risk level based on status and score

- **`calculateAdvancedRiskScore`** _(internal)_

  ```typescript
  (riskFactors: RiskFactors, params: AdvancedLPRStatusParams): number
  ```

  Calculates numerical risk score

- **`calculateTimeInsideUSA`** _(internal)_

  ```typescript
  (trips: Trip[], greenCardDate: string, asOfDate: string): { totalTimeInsideUSA: number; percentageInsideUSA: number }
  ```

  Calculates time spent inside USA

- **`hasHighFrequencyShortTrips`** _(internal)_
  ```typescript
  (trips: Trip[]): boolean
  ```
  Checks for pattern of high frequency short trips

#### Analysis Helpers

**File**: `/business-logic/calculations/lpr-status/analysis-helpers.ts`

- **`analyzePatterns`** _(exported)_

  ```typescript
  (trips: Trip[], greenCardDate: string, asOfDate: string): PatternAnalysisResult
  ```

  Analyzes travel patterns for risk

- **`assessRiskAndStatus`** _(exported)_

  ```typescript
  (trips: Trip[], riskFactors: RiskFactors, params: AdvancedLPRStatusParams): { riskLevel: RiskLevel; overallRiskScore: number }
  ```

  Assesses overall risk and status

- **`calculateBasicRiskScore`** _(internal)_

  ```typescript
  (longestTrip: number, totalDaysAbroad: number, percentageAbroad: number, hasRiskyTrips: boolean): number
  ```

  Calculates basic numerical risk score

- **`adjustRiskScoreForMitigatingFactors`** _(internal)_
  ```typescript
  (baseScore: number, params: AdvancedLPRStatusParams): number
  ```
  Adjusts risk score based on mitigating factors

#### LPR Status Helpers

**File**: `/business-logic/calculations/lpr-status/helpers.ts`

- **`calculateTripMetrics`** _(exported)_

  ```typescript
  (trips: Trip[]): TripMetrics
  ```

  Calculates trip statistics and metrics

- **`generateLPRStatusRecommendations`** _(exported)_

  ```typescript
  (assessment: LPRStatusRiskAssessment): string[]
  ```

  Generates recommendations based on status

- **`hasRiskyTrips`** _(exported)_

  ```typescript
  (trips: Trip[]): boolean
  ```

  Checks if any trips pose LPR status risk

- **`mapToBasicRiskLevel`** _(internal)_
  ```typescript
  (hasRiskyTrips: boolean, longestTrip: number, totalDaysAbroad: number, greenCardAge: number): RiskLevel
  ```
  Maps trip data to basic risk level

#### Permit Helpers

**File**: `/business-logic/calculations/lpr-status/permit-helpers.ts`

- **`determineIfReentryPermitProvidesProtection`** _(exported)_

  ```typescript
  (tripDuration: number, permitInfo?: { hasReentryPermit: boolean; permitExpiryDate?: string }, currentDate?: string): boolean
  ```

  Basic permit protection check

- **`determineIfReentryPermitProvidesProtectionAdvanced`** _(exported)_
  ```typescript
  (tripDuration: number, permitInfo: ReentryPermitInfo | undefined, currentDate?: string): ReentryPermitProtectionResult
  ```
  Advanced permit protection analysis

#### Suggestion Helpers

**File**: `/business-logic/calculations/lpr-status/suggestion-helpers.ts`

- **`handleAbandonmentRiskSuggestions`** _(exported)_

  ```typescript
  (suggestions: string[], assessment: AdvancedLPRStatusAssessment, params: AdvancedLPRStatusParams): void
  ```

  Generates suggestions for abandonment risk

- **`handleConditionalResidentSuggestions`** _(exported)_

  ```typescript
  (suggestions: string[], params: AdvancedLPRStatusParams): void
  ```

  Generates suggestions for conditional residents

- **`handleGeneralRiskSuggestions`** _(exported)_

  ```typescript
  (suggestions: string[], assessment: AdvancedLPRStatusAssessment): void
  ```

  Generates general risk mitigation suggestions

- **`handleN470ExemptionSuggestions`** _(exported)_

  ```typescript
  (suggestions: string[], assessment: AdvancedLPRStatusAssessment, params: AdvancedLPRStatusParams): void
  ```

  Generates N-470 exemption suggestions

- **`handleReentryPermitSuggestions`** _(exported)_
  ```typescript
  (suggestions: string[], assessment: AdvancedLPRStatusAssessment, params: AdvancedLPRStatusParams): void
  ```
  Generates reentry permit suggestions

### Physical Presence Calculation

#### Presence Calculator

**File**: `/business-logic/calculations/presence/calculator.ts`

- **`calculateDaysOfPhysicalPresence`** _(exported)_

  ```typescript
  (trips: Trip[], greenCardDate: string, currentDate?: string): number
  ```

  Calculates total days physically present in USA

- **`calculateEligibilityDates`** _(exported)_

  ```typescript
  (totalDaysInUSA: number, eligibilityCategory: 'three_year' | 'five_year', greenCardDate: string, currentDate?: string): EligibilityDates
  ```

  Calculates citizenship eligibility and filing dates

- **`calculatePresenceStatus`** _(exported)_

  ```typescript
  (trips: Trip[], eligibilityCategory: 'three_year' | 'five_year', greenCardDate: string, currentDate?: string): PresenceStatus
  ```

  Calculates presence status and progress

- **`checkContinuousResidence`** _(exported)_

  ```typescript
  (trips: Trip[]): ContinuousResidenceResult
  ```

  Checks for continuous residence violations

- **`isEligibleForEarlyFiling`** _(exported)_
  ```typescript
  (eligibilityDate: string, currentDate?: string): boolean
  ```
  Checks if eligible for 90-day early filing

#### Presence Helpers

**File**: `/business-logic/calculations/presence/helpers.ts`

- **`calculateTripDaysAbroad`** _(exported)_

  ```typescript
  (trip: Trip): number
  ```

  Calculates days abroad for a trip

- **`createResidenceWarning`** _(exported)_

  ```typescript
  (trip: Trip): ContinuousResidenceWarning
  ```

  Creates continuous residence warning

- **`validateAndParseDates`** _(exported)_

  ```typescript
  (greenCardDate: string, asOfDate: string): DateValidationResult
  ```

  Validates and parses date inputs

- **`isValidTrip`** _(re-exported from validation)_
- **`isValidTripForResidenceCheck`** _(re-exported from validation)_

### Travel Analytics

#### Analytics

**File**: `/business-logic/calculations/travel-analytics/analytics.ts`

- **`assessUpcomingTripRisk`** _(exported)_

  ```typescript
  (upcomingTrips: Trip[], currentTotalDaysAbroad: number, eligibilityCategory: 'three_year' | 'five_year', greenCardDate: string, currentDate?: string): TripRiskAssessment[]
  ```

  Assesses risk of upcoming simulated trip

- **`calculateCountryStatistics`** _(exported)_

  ```typescript
  (trips: Trip[]): CountryStatistics[]
  ```

  Calculates statistics by destination country

- **`calculateDaysAbroadByYear`** _(exported)_

  ```typescript
  (trips: Trip[], greenCardDate: string, currentDate?: string): YearlyDaysAbroad[]
  ```

  Calculates days abroad broken down by year

- **`projectEligibilityDate`** _(exported)_

  ```typescript
  (trips: Trip[], totalDaysInUSA: number, eligibilityCategory: 'three_year' | 'five_year', greenCardDate: string, currentDate?: string): TravelProjection
  ```

  Projects future citizenship eligibility date

- **`generateAnnualTravelSummary`** _(re-exported from reporting)_
- **`calculateMilestones`** _(re-exported from reporting)_

- **`calculateHistoricalAbsenceRate`** _(internal)_

  ```typescript
  (daysSinceGreenCard: number, totalDaysInUSA: number): number
  ```

  Calculates historical absence rate

- **`handleAlreadyEligible`** _(internal)_

  ```typescript
  (currentDate: string, historicalAbsenceRate: number): TravelProjection
  ```

  Handles case where already eligible

- **`handleImpossibleEligibility`** _(internal)_

  ```typescript
  (): TravelProjection
  ```

  Handles case where eligibility is impossible

- **`calculateProjectionConfidence`** _(internal)_

  ```typescript
  (trips: Trip[], greenCardDate: string, currentDate: string): object
  ```

  Calculates confidence level for projection

- **`createNoHistoryProjection`** _(internal)_

  ```typescript
  (projectedDate: Date): TravelProjection
  ```

  Creates projection when no history available

- **`createProjectionWithHistory`** _(internal)_
  ```typescript
  (projectedDate: Date, historicalAbsenceRate: number, variance: number, recentYearsCount: number): TravelProjection
  ```
  Creates projection based on historical data

#### Budget Helpers

**File**: `/business-logic/calculations/travel-analytics/budget-helpers.ts`

- **`calculateSafeTravelBudget`** _(exported)_
  ```typescript
  (_totalDaysInUSA: number, totalDaysAbroad: number, eligibilityCategory: 'three_year' | 'five_year', greenCardDate: string, _currentDate?: string): SafeTravelBudget
  ```
  Calculates safe travel budget to maintain eligibility

#### Streak Helpers

**File**: `/business-logic/calculations/travel-analytics/streak-helpers.ts`

- **`calculateTravelStreaks`** _(exported)_

  ```typescript
  (trips: Trip[], greenCardDate: string, currentDate?: string): TravelStreak[]
  ```

  Calculates longest travel and presence streaks

- **`addFinalPresenceStreak`** _(internal)_

  ```typescript
  (streaks: TravelStreak[], lastReturn: Date, endDate: Date): void
  ```

  Adds final presence streak after last trip

- **`addGapStreaks`** _(internal)_

  ```typescript
  (streaks: TravelStreak[], sortedTrips: Trip[]): void
  ```

  Adds presence streaks between trips

- **`addInitialPresenceStreak`** _(internal)_
  ```typescript
  (streaks: TravelStreak[], firstDeparture: Date, startDate: Date): void
  ```
  Adds initial presence streak before first trip

#### Travel Analytics Helpers

**File**: `/business-logic/calculations/travel-analytics/helpers.ts`

- **`calculateAnniversaryDate`** _(exported)_

  ```typescript
  (greenCardDate: Date, yearsRequired: number): Date
  ```

  Calculates anniversary date handling leap years

- **`calculateDaysAbroadInYear`** _(exported)_

  ```typescript
  (trip: Trip, yearBoundaries: YearBoundaries): number
  ```

  Calculates days abroad in specific year

- **`calculateTotalInclusiveDays`** _(exported)_

  ```typescript
  (departureDate: Date, returnDate: Date): number
  ```

  Calculates total days including both dates

- **`calculateTripDaysAbroadExcludingTravelDays`** _(exported)_

  ```typescript
  (departureDate: Date, returnDate: Date): number
  ```

  Calculates days excluding travel days

- **`createPresenceStreak`** _(exported)_

  ```typescript
  (startDate: Date | string, endDate: Date | string, description: string, type?: 'in_usa' | 'traveling' | 'travel_free_months'): TravelStreak
  ```

  Creates presence streak object

- **`formatDateRange`** _(exported)_

  ```typescript
  (departureDate: string, returnDate: string): string
  ```

  Formats date range for display

- **`getActualValidTrips`** _(exported)_

  ```typescript
  (trips: Trip[]): Trip[]
  ```

  Get non-simulated valid trips

- **`getDefaultCountryData`** _(exported)_

  ```typescript
  (): CountryData
  ```

  Gets default country data object

- **`getRequiredDays`** _(exported)_

  ```typescript
  (eligibilityCategory: 'three_year' | 'five_year'): number
  ```

  Gets required presence days for category

- **`getRequiredYears`** _(exported)_

  ```typescript
  (eligibilityCategory: 'three_year' | 'five_year'): number
  ```

  Gets required years for eligibility category

- **`getYearBoundaries`** _(exported)_

  ```typescript
  (year: number, startYear: number, endYear: number, startDate: Date, endDate: Date): YearBoundaries
  ```

  Gets year start/end boundaries

- **`parseTripDates`** _(exported)_

  ```typescript
  (trip: Trip): TripDateRange | null
  ```

  Parses and validates trip dates

- **`updateCountryData`** _(exported)_

  ```typescript
  (existingData: CountryData, daysAbroad: number, returnDate: Date): CountryData
  ```

  Updates country visit statistics

- **`isValidTripForRiskAssessment`** _(re-exported from validation)_

- **`isWithinYearBoundaries`** _(internal)_

  ```typescript
  (departure: Date, returnDate: Date, yearStart: Date, yearEnd: Date): boolean
  ```

  Checks if trip is within year boundaries

- **`getEffectiveTripDates`** _(internal)_

  ```typescript
  (departure: Date, returnDate: Date, yearStart: Date, yearEnd: Date): object | null
  ```

  Gets effective trip dates within boundaries

- **`calculateBoundaryAdjustment`** _(internal)_
  ```typescript
  (effectiveStart: Date, effectiveEnd: Date, departure: Date, returnDate: Date, yearStart: Date, yearEnd: Date): number
  ```
  Calculates boundary adjustment for trip days

### Travel Risk Assessment

#### Risk Assessment

**File**: `/business-logic/calculations/travel-risk/assessment.ts`

- **`assessTripRiskForAllLegalThresholds`** _(exported)_
  ```typescript
  (params: TripRiskAssessmentParams): ComprehensiveTripRiskAssessment
  ```
  Comprehensive trip risk assessment

#### Abandonment Risk

**File**: `/business-logic/calculations/travel-risk/abandonment.ts`

- **`calculateGreenCardAbandonmentRisk`** _(exported)_

  ```typescript
  (daysAbroad: number, hasReentryPermit?: boolean): GreenCardRiskResult
  ```

  Calculates green card abandonment risk

- **`checkIfTripApproachesContinuousResidenceRisk`** _(exported)_

  ```typescript
  (daysAbroad: number): boolean
  ```

  Checks if trip approaches residence risk

- **`checkIfTripApproachesGreenCardLoss`** _(exported)_

  ```typescript
  (daysAbroad: number): boolean
  ```

  Checks if trip approaches green card loss

- **`checkIfTripBreaksContinuousResidence`** _(exported)_

  ```typescript
  (daysAbroad: number): boolean
  ```

  Checks if trip breaks continuous residence

- **`checkIfTripRisksAutomaticGreenCardLoss`** _(exported)_

  ```typescript
  (daysAbroad: number, hasReentryPermit?: boolean): boolean
  ```

  Checks if trip risks automatic loss

- **`getReentryPermitProtectedThresholds`** _(exported)_
  ```typescript
  (permitInfo?: object): PermitProtectedThresholds
  ```
  Gets thresholds with permit protection

#### Assessment Helpers

**File**: `/business-logic/calculations/travel-risk/assessment-helpers.ts`

- **`determineGreenCardRiskLevel`** _(exported)_

  ```typescript
  (daysAbroad: number, hasReentryPermit: boolean): TripRiskLevel
  ```

  Determines green card risk level

- **`generateRecommendationsForRiskLevel`** _(exported)_

  ```typescript
  (riskLevel: TripRiskLevel, daysAbroad: number, hasReentryPermit: boolean): string[]
  ```

  Generates risk-based recommendations

- **`generateWarningsForDaysAbroad`** _(exported)_

  ```typescript
  (daysAbroad: number, hasReentryPermit: boolean): string[]
  ```

  Generates warnings based on days abroad

- **`mapRiskLevelToDescription`** _(exported)_
  ```typescript
  (riskLevel: TripRiskLevel): string
  ```
  Maps risk level to user-friendly description

#### Risk Helpers

**File**: `/business-logic/calculations/travel-risk/helpers.ts`

- **`assessTravelRisk`** _(exported)_

  ```typescript
  (currentDaysAbroad: number, additionalDaysAbroad: number, eligibilityCategory: 'three_year' | 'five_year', greenCardDate: string, currentDate?: string): TravelRiskLevel
  ```

  Assesses travel risk for eligibility

- **`calculateConfidenceLevel`** _(exported)_

  ```typescript
  (trips: Trip[], greenCardDate: string, currentDate: string): ConfidenceLevel
  ```

  Calculates projection confidence level

- **`determineTravelBudgetRisk`** _(exported)_

  ```typescript
  (remainingDays: number, totalBudget: number): RiskLevel
  ```

  Determines risk level for travel budget

- **`determineTravelTrend`** _(exported)_

  ```typescript
  (daysSinceGreenCard: number, percentageAbroad: number): TravelTrend
  ```

  Determines travel pattern trend

- **`getRiskImpactDescription`** _(exported)_

  ```typescript
  (risk: TravelRiskLevel, eligibilityCategory: 'three_year' | 'five_year'): string
  ```

  Gets risk impact description

- **`getRiskRecommendation`** _(exported)_

  ```typescript
  (risk: TravelRiskLevel): string
  ```

  Gets recommendation for risk level

- **`calculatePercentageOfTimeAbroad`** _(internal)_

  ```typescript
  (totalDaysAbroad: number, totalDays: number): number
  ```

  Calculates percentage of time abroad

- **`getHighRiskRecommendation`** _(internal)_

  ```typescript
  (): string
  ```

  Gets recommendation for high risk

- **`getMediumRiskRecommendation`** _(internal)_

  ```typescript
  (): string
  ```

  Gets recommendation for medium risk

- **`getLowRiskRecommendation`** _(internal)_

  ```typescript
  (): string
  ```

  Gets recommendation for low risk

- **`getVeryHighRiskRecommendation`** _(internal)_

  ```typescript
  (): string
  ```

  Gets recommendation for very high risk

- **`getNoRiskRecommendation`** _(internal)_

  ```typescript
  (): string
  ```

  Gets recommendation for no risk

- **`calculateRecentYearsData`** _(internal)_

  ```typescript
  (trips: Trip[], currentDate: Date): { count: number; avgDaysAbroad: number }
  ```

  Calculates recent years travel data

- **`calculateVariance`** _(internal)_
  ```typescript
  (yearlyData: number[]): number
  ```
  Calculates variance in yearly travel

### Reporting & Milestones

#### Annual Summary

**File**: `/business-logic/calculations/reporting/annual-summary.ts`

- **`calculateYearSummaryData`** _(exported)_

  ```typescript
  (yearTrips: Trip[]): object
  ```

  Calculates summary data for year's trips

- **`compareWithPreviousYear`** _(exported)_

  ```typescript
  (currentTotalDays: number, currentTripCount: number, previousYearTrips: Trip[], previousYear: number): object
  ```

  Compares current year with previous year

- **`formatLongestTrip`** _(exported)_

  ```typescript
  (longestTrip: object): object
  ```

  Formats longest trip information

- **`generateAnnualTravelSummary`** _(exported)_

  ```typescript
  (trips: Trip[], year: number, previousYearTrips?: Trip[]): object
  ```

  Generates comprehensive annual summary

- **`getTopDestinations`** _(exported)_

  ```typescript
  (countryDays: Map<string, number>): Array<{ country: string; days: number }>
  ```

  Gets most visited destinations

- **`getYearTrips`** _(exported)_
  ```typescript
  (trips: Trip[], year: number): Trip[]
  ```
  Filters trips for specific year

#### Milestones

**File**: `/business-logic/calculations/reporting/milestones.ts`

- **`calculateMilestones`** _(exported)_

  ```typescript
  (totalDaysInUSA: number, eligibilityCategory: 'three_year' | 'five_year', greenCardDate: string, currentDate?: string): MilestoneInfo[]
  ```

  Calculates naturalization journey milestones

- **`createEarlyFilingMilestone`** _(internal)_

  ```typescript
  (greenCardDate: string, yearsRequired: number, currentDate: string): MilestoneInfo
  ```

  Creates early filing milestone

- **`createPhysicalPresenceMilestone`** _(internal)_
  ```typescript
  (totalDaysInUSA: number, requiredDays: number, currentDate: string): MilestoneInfo
  ```
  Creates physical presence milestone

### Safe Wrapper Functions

Safe wrapper functions provide validated input handling using the Result type pattern. All safe wrappers follow the pattern `safe<OriginalFunctionName>` and return `Result<T, E>` instead of throwing exceptions.

#### Presence Calculation Safe Wrappers

**File**: `/business-logic/calculations/presence/safe-calculator.ts`

- **`safeCalculateDaysOfPhysicalPresence`** _(exported)_

  ```typescript
  (trips: unknown, greenCardDate: unknown, currentDate?: unknown): Result<number, TripValidationError | DateRangeError>
  ```

  Safe wrapper for calculateDaysOfPhysicalPresence with input validation

- **`safeCalculatePresenceStatus`** _(exported)_

  ```typescript
  (trips: unknown, eligibilityCategory: unknown, greenCardDate: unknown, currentDate?: unknown): Result<PresenceStatus, TripValidationError | DateRangeError>
  ```

  Safe wrapper for calculatePresenceStatus with schema validation

- **`safeCheckContinuousResidence`** _(exported)_

  ```typescript
  (trips: unknown): Result<ContinuousResidenceResult, TripValidationError>
  ```

  Safe wrapper for checkContinuousResidence with trip validation

- **`safeCalculateEligibilityDates`** _(exported)_
  ```typescript
  (totalDaysInUSA: unknown, eligibilityCategory: unknown, greenCardDate: unknown, currentDate?: unknown): Result<EligibilityDates, TripValidationError | DateRangeError>
  ```
  Safe wrapper for calculateEligibilityDates with parameter validation

#### LPR Status Safe Wrappers

**File**: `/business-logic/calculations/lpr-status/safe-calculator.ts`

- **`safeAssessRiskOfLosingPermanentResidentStatus`** _(exported)_

  ```typescript
  (trips: unknown, greenCardDate: unknown, asOfDate?: unknown): Result<LPRStatusRiskAssessment, TripValidationError | LPRStatusError>
  ```

  Safe wrapper for basic LPR status risk assessment

- **`safeAssessRiskOfLosingPermanentResidentStatusAdvanced`** _(exported)_

  ```typescript
  (params: unknown): Result<AdvancedLPRStatusAssessment, TripValidationError | LPRStatusError>
  ```

  Safe wrapper for advanced LPR status assessment with all parameters

- **`safeCalculateMaximumTripDurationWithExemptions`** _(exported)_
  ```typescript
  (params: unknown): Result<MaximumTripDurationResult, TripValidationError | LPRStatusError>
  ```
  Safe wrapper for maximum trip duration calculation

#### Compliance Safe Wrappers

**File**: `/business-logic/calculations/compliance/safe-compliance-coordinator.ts`

- **`safeCalculateComprehensiveCompliance`** _(exported)_
  ```typescript
  (params: unknown): Result<ComprehensiveComplianceStatus, TripValidationError | ComplianceCalculationError>
  ```
  Safe wrapper for comprehensive compliance calculation

**File**: `/business-logic/calculations/compliance/safe-compliance-functions.ts`

- **`safeCalculateRemovalOfConditionsStatus`** _(exported)_

  ```typescript
  (isConditionalResident: unknown, greenCardDate: unknown, currentDate?: unknown): Result<RemovalOfConditionsStatus, DateRangeError | ComplianceCalculationError>
  ```

  Safe wrapper for I-751 status calculation

- **`safeCalculateGreenCardRenewalStatus`** _(exported)_

  ```typescript
  (greenCardExpirationDate: unknown, currentDate?: unknown): Result<GreenCardRenewalStatus, DateRangeError | ComplianceCalculationError>
  ```

  Safe wrapper for green card renewal status

- **`safeCalculateSelectiveServiceStatus`** _(exported)_

  ```typescript
  (birthDate?: unknown, gender?: unknown, isSelectiveServiceRegistered?: unknown, currentDate?: unknown): Result<SelectiveServiceStatus, DateRangeError | ComplianceCalculationError>
  ```

  Safe wrapper for selective service status

- **`safeCalculateTaxReminderStatus`** _(exported)_
  ```typescript
  (trips: unknown, isDismissed?: unknown, currentDate?: unknown): Result<TaxReminderStatus, DateRangeError | ComplianceCalculationError>
  ```
  Safe wrapper for tax reminder status

#### Travel Analytics Safe Wrappers

**File**: `/business-logic/calculations/travel-analytics/safe-analytics.ts`

- **`safeAssessUpcomingTripRisk`** _(exported)_

  ```typescript
  (upcomingTrips: unknown, currentTotalDaysAbroad: unknown, eligibilityCategory: unknown, greenCardDate: unknown, currentDate?: unknown): Result<TripRiskAssessment[], TripValidationError | USCISCalculationError>
  ```

  Safe wrapper for upcoming trip risk assessment

- **`safeCalculateCountryStatistics`** _(exported)_

  ```typescript
  (trips: unknown): Result<CountryStatistics[], TripValidationError | USCISCalculationError>
  ```

  Safe wrapper for country statistics calculation

- **`safeCalculateDaysAbroadByYear`** _(exported)_

  ```typescript
  (trips: unknown, greenCardDate: unknown, currentDate?: unknown): Result<YearlyDaysAbroad[], DateRangeError | TripValidationError | USCISCalculationError>
  ```

  Safe wrapper for yearly days abroad calculation

- **`safeProjectEligibilityDate`** _(exported)_
  ```typescript
  (trips: unknown, totalDaysInUSA: unknown, eligibilityCategory: unknown, greenCardDate: unknown, currentDate?: unknown): Result<TravelProjection, DateRangeError | TripValidationError | USCISCalculationError>
  ```
  Safe wrapper for eligibility date projection

#### Travel Risk Safe Wrappers

**File**: `/business-logic/calculations/travel-risk/safe-assessment.ts`

- **`safeAssessTripRiskForAllLegalThresholds`** _(exported)_
  ```typescript
  (trip: unknown, reentryPermitInfo?: unknown): Result<ComprehensiveRiskAssessment, TripValidationError | USCISCalculationError>
  ```
  Safe wrapper for comprehensive trip risk assessment

#### Utility Safe Wrappers

**File**: `/utils/safe-trip-calculations.ts`

- **`safeCalculateTripDuration`** _(exported)_

  ```typescript
  (trip: unknown, options?: unknown): Result<number, TripValidationError | DateRangeError>
  ```

  Safe wrapper for trip duration calculation

- **`safeCalculateTripDaysInPeriod`** _(exported)_

  ```typescript
  (trip: unknown, startDate: unknown, endDate: unknown, options?: unknown): Result<number, TripValidationError | DateRangeError>
  ```

  Safe wrapper for trip days in period calculation

- **`safeCalculateTripDaysInYear`** _(exported)_
  ```typescript
  (trip: unknown, year: unknown, options?: unknown): Result<number, TripValidationError | DateRangeError>
  ```
  Safe wrapper for trip days in year calculation

### Error Handling Utilities

**File**: `/errors/index.ts`

The error handling utilities implement a functional Result type pattern inspired by Rust, enabling explicit error handling without exceptions.

#### Result Type Constructors

- **`ok`** _(exported)_

  ```typescript
  <T>(data: T): Result<T, never>
  ```

  Creates a successful Result containing data

- **`err`** _(exported)_
  ```typescript
  <E>(error: E): Result<never, E>
  ```
  Creates a failed Result containing an error

#### Type Guards

- **`isOk`** _(exported)_

  ```typescript
  <T, E>(result: Result<T, E>): result is { success: true; data: T }
  ```

  Type guard to check if Result is successful

- **`isErr`** _(exported)_
  ```typescript
  <T, E>(result: Result<T, E>): result is { success: false; error: E }
  ```
  Type guard to check if Result is an error

#### Functional Utilities

- **`mapResult`** _(exported)_

  ```typescript
  <T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E>
  ```

  Maps a successful Result value, leaving errors unchanged

- **`mapError`** _(exported)_

  ```typescript
  <T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F>
  ```

  Maps an error Result value, leaving success unchanged

- **`chainResult`** _(exported)_

  ```typescript
  <T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E>
  ```

  Chains Result operations (flatMap/bind)

- **`combineResults`** _(exported)_

  ```typescript
  <T, E>(results: Result<T, E>[]): Result<T[], E>
  ```

  Combines multiple Results into a single Result

- **`unwrapResult`** _(exported)_

  ```typescript
  <T, E>(result: Result<T, E>): T
  ```

  Unwraps a Result or throws the error

- **`unwrapOr`** _(exported)_
  ```typescript
  <T, E>(result: Result<T, E>, defaultValue: T): T
  ```
  Unwraps a Result or returns a default value

### Date Utilities

**File**: `/utils/date-helpers.ts`

- **`addUTCDays`** _(exported)_

  ```typescript
  (date: Date, days: number): Date
  ```

  Add days to a UTC date

- **`endOfUTCDay`** _(exported)_

  ```typescript
  (date: Date): Date
  ```

  Get end of UTC day (23:59:59.999)

- **`formatDate`** _(exported)_

  ```typescript
  (date: Date | string): string
  ```

  Format date as YYYY-MM-DD (alias for formatUTCDate)

- **`formatUTCDate`** _(exported)_

  ```typescript
  (date: Date): string
  ```

  Format UTC date as YYYY-MM-DD

- **`getCurrentDate`** _(exported)_

  ```typescript
  (): string
  ```

  Get current UTC date (alias for getCurrentUTCDate)

- **`getCurrentUTCDate`** _(exported)_

  ```typescript
  (): string
  ```

  Get current UTC date at midnight

- **`getDaysInMonth`** _(exported)_

  ```typescript
  (year: number, month: number): number
  ```

  Days in given month

- **`getUTCYear`** _(exported)_

  ```typescript
  (date: Date): number
  ```

  Get UTC year from date

- **`isLeapYear`** _(exported)_

  ```typescript
  (year: number): boolean
  ```

  Check if year is leap year

- **`isValidDate`** _(exported)_

  ```typescript
  (date: any): boolean
  ```

  Check if Date object is valid

- **`isValidDateFormat`** _(exported)_

  ```typescript
  (dateString: string): boolean
  ```

  Strict YYYY-MM-DD validation

- **`parseDate`** _(exported)_

  ```typescript
  (dateString: string): Date
  ```

  Parse ISO date string (alias for parseISO)

- **`parseDateInput`** _(exported)_

  ```typescript
  (input: string | Date): Date
  ```

  Parse date from string or Date

- **`parseUTCDate`** _(exported)_

  ```typescript
  (dateString: string): Date
  ```

  Parse YYYY-MM-DD to UTC Date

- **`startOfUTCDay`** _(exported)_

  ```typescript
  (date: Date): Date
  ```

  Get start of UTC day (00:00:00.000)

- **`subUTCDays`** _(exported)_
  ```typescript
  (date: Date, days: number): Date
  ```
  Subtract days from UTC date

**File**: `/utils/utc-date-helpers.ts`

- **`formatUTCDate`** _(exported)_

  ```typescript
  (date: Date): string
  ```

  Format as YYYY-MM-DD

- **`getCurrentUTCDate`** _(exported)_

  ```typescript
  (): string
  ```

  Current UTC date at midnight

- **`getUTCYear`** _(exported)_

  ```typescript
  (date: Date): number
  ```

  Extract UTC year

- **`parseUTCDate`** _(exported)_

  ```typescript
  (dateString: string): Date
  ```

  Parse YYYY-MM-DD strictly

- **`subUTCDays`** _(exported)_
  ```typescript
  (date: Date, days: number): Date
  ```
  Subtract days

### Trip Calculations

**File**: `/utils/trip-calculations.ts`

- **`calculateTripDuration`** _(exported)_

  ```typescript
  (trip: Trip): number
  ```

  Calculate days abroad for a trip (USCIS rules applied)

- **`calculateTripDaysExcludingTravel`** _(exported)_

  ```typescript
  (trip: Trip): number
  ```

  Days abroad excluding departure/return days

- **`calculateTripDaysInPeriod`** _(exported)_

  ```typescript
  (trip: Trip, periodStart: Date, periodEnd: Date): number
  ```

  Days abroad within a specific period

- **`calculateTripDaysInYear`** _(exported)_

  ```typescript
  (trip: Trip, year: number): number
  ```

  Days abroad in a specific year

- **`populateTripDaysSet`** _(exported)_
  ```typescript
  (trip: Trip, daysSet: Set<string>): void
  ```
  Add trip days to a Set for deduplication

### Validation Utilities

**File**: `/utils/validation.ts`

- **`filterValidTrips`** _(exported)_

  ```typescript
  (trips: Trip[], requirements?: ValidationRequirements): Trip[]
  ```

  Filter array to valid trips meeting requirements

- **`getActualValidTrips`** _(exported)_

  ```typescript
  (trips: Trip[]): Trip[]
  ```

  Get non-simulated valid trips

- **`getSimulatedValidTrips`** _(exported)_

  ```typescript
  (trips: Trip[]): Trip[]
  ```

  Get simulated valid trips only

- **`isValidTrip`** _(exported)_

  ```typescript
  (trip: Trip): boolean
  ```

  Type guard for basic trip validation

- **`isValidTripForResidenceCheck`** _(exported)_

  ```typescript
  (trip: Trip): boolean
  ```

  Validate trip for continuous residence checks

- **`isValidTripForRiskAssessment`** _(exported)_

  ```typescript
  (trip: Trip): boolean
  ```

  Validate simulated trip for risk assessment

- **`isValidTripWithId`** _(exported)_

  ```typescript
  (trip: Trip): boolean
  ```

  Type guard ensuring trip has valid ID

- **`validateTripForCalculation`** _(exported)_
  ```typescript
  (trip: Trip, requirements?: ValidationRequirements): boolean
  ```
  Validate trip meets specific requirements

### Schema Utilities

**File**: `/schemas/calculation-helpers.ts`

- **`toDaysAbroadByYearOutput`** _(exported)_
  ```typescript
  (data: YearlyDaysAbroad[]): DaysAbroadByYearOutput[]
  ```
  Transform to output format

**File**: `/schemas/compliance-helpers.ts`

- **`toActiveComplianceItemOutput`** _(exported)_

  ```typescript
  (item: ActiveComplianceItem): ActiveComplianceItemOutput
  ```

  Transform to output format

- **`toPriorityComplianceItemOutput`** _(exported)_

  ```typescript
  (item: PriorityComplianceItem): PriorityComplianceItemOutput
  ```

  Transform to output format

- **`toUpcomingDeadlineOutput`** _(exported)_
  ```typescript
  (deadline: UpcomingDeadline): UpcomingDeadlineOutput
  ```
  Transform to output format

**File**: `/schemas/travel-analytics-helpers.ts`

- **`toCountryStatisticsOutput`** _(exported)_

  ```typescript
  (stats: CountryStatistics[]): CountryStatisticsOutput[]
  ```

  Transform to output format

- **`toTravelStreakOutput`** _(exported)_

  ```typescript
  (streak: TravelStreak): TravelStreakOutput
  ```

  Transform to output format

- **`toTripRiskAssessmentOutput`** _(exported)_
  ```typescript
  (assessment: TripRiskAssessment): TripRiskAssessmentOutput
  ```
  Transform to output format

---

## Alphabetical Function Index

All 231 functions listed alphabetically with their file locations (including safe wrappers and error utilities):

- `addFinalPresenceStreak` _(internal)_ - `/business-logic/calculations/travel-analytics/streak-helpers.ts`
- `addGapStreaks` _(internal)_ - `/business-logic/calculations/travel-analytics/streak-helpers.ts`
- `addInitialPresenceStreak` _(internal)_ - `/business-logic/calculations/travel-analytics/streak-helpers.ts`
- `addUTCDays` _(exported)_ - `/utils/date-helpers.ts`
- `adjustForWeekend` _(exported)_ - `/business-logic/calculations/compliance/tax-deadline-helpers.ts`
- `adjustRiskScoreForMitigatingFactors` _(internal)_ - `/business-logic/calculations/lpr-status/analysis-helpers.ts`
- `analyzePatternOfNonResidence` _(exported)_ - `/business-logic/calculations/lpr-status/pattern-analysis.ts`
- `analyzePatterns` _(exported)_ - `/business-logic/calculations/lpr-status/analysis-helpers.ts`
- `assessRiskAndStatus` _(exported)_ - `/business-logic/calculations/lpr-status/analysis-helpers.ts`
- `assessRiskOfLosingPermanentResidentStatus` _(exported)_ - `/business-logic/calculations/lpr-status/calculator.ts`
- `assessRiskOfLosingPermanentResidentStatusAdvanced` _(exported)_ - `/business-logic/calculations/lpr-status/calculator.ts`
- `assessTravelRisk` _(exported)_ - `/business-logic/calculations/travel-risk/helpers.ts`
- `assessTripRiskForAllLegalThresholds` _(exported)_ - `/business-logic/calculations/travel-risk/assessment.ts`
- `assessUpcomingTripRisk` _(exported)_ - `/business-logic/calculations/travel-analytics/analytics.ts`
- `calculateAdvancedRiskScore` _(internal)_ - `/business-logic/calculations/lpr-status/advanced-helpers.ts`
- `calculateAnniversaryDate` _(exported)_ - `/business-logic/calculations/travel-analytics/helpers.ts`
- `calculateBasicRiskScore` _(internal)_ - `/business-logic/calculations/lpr-status/analysis-helpers.ts`
- `calculateBoundaryAdjustment` _(internal)_ - `/business-logic/calculations/travel-analytics/helpers.ts`
- `calculateComprehensiveCompliance` _(exported)_ - `/business-logic/calculations/compliance/compliance-coordinator.ts`
- `calculateConfidenceLevel` _(exported)_ - `/business-logic/calculations/travel-risk/helpers.ts`
- `calculateCountryStatistics` _(exported)_ - `/business-logic/calculations/travel-analytics/analytics.ts`
- `calculateDaysAbroadByYear` _(exported)_ - `/business-logic/calculations/travel-analytics/analytics.ts`
- `calculateDaysAbroadInYear` _(exported)_ - `/business-logic/calculations/travel-analytics/helpers.ts`
- `calculateDaysOfPhysicalPresence` _(exported)_ - `/business-logic/calculations/presence/calculator.ts`
- `calculateEligibilityDates` _(exported)_ - `/business-logic/calculations/presence/calculator.ts`
- `calculateGreenCardAbandonmentRisk` _(exported)_ - `/business-logic/calculations/travel-risk/abandonment.ts`
- `calculateGreenCardRenewalStatus` _(exported)_ - `/business-logic/calculations/compliance/green-card-renewal.ts`
- `calculateHistoricalAbsenceRate` _(internal)_ - `/business-logic/calculations/travel-analytics/analytics.ts`
- `calculateMaximumTripDurationToMaintainAllStatuses` _(exported)_ - `/business-logic/calculations/lpr-status/duration-calculator.ts`
- `calculateMaximumTripDurationWithExemptions` _(exported)_ - `/business-logic/calculations/lpr-status/calculator.ts`
- `calculateMilestones` _(exported)_ - `/business-logic/calculations/reporting/milestones.ts`
- `calculatePercentageOfTimeAbroad` _(internal)_ - `/business-logic/calculations/travel-risk/helpers.ts`
- `calculatePresenceStatus` _(exported)_ - `/business-logic/calculations/presence/calculator.ts`
- `calculateProjectionConfidence` _(internal)_ - `/business-logic/calculations/travel-analytics/analytics.ts`
- `calculateRebuttablePresumption` _(exported)_ - `/business-logic/calculations/lpr-status/advanced-helpers.ts`
- `calculateRecentYearsData` _(internal)_ - `/business-logic/calculations/travel-risk/helpers.ts`
- `calculateRemovalOfConditionsStatus` _(exported)_ - `/business-logic/calculations/compliance/removal-of-conditions.ts`
- `calculateRiskFactors` _(exported)_ - `/business-logic/calculations/lpr-status/advanced-helpers.ts`
- `calculateSafeTravelBudget` _(exported)_ - `/business-logic/calculations/travel-analytics/budget-helpers.ts`
- `calculateSelectiveServiceStatus` _(exported)_ - `/business-logic/calculations/compliance/selective-service.ts`
- `calculateTaxReminderStatus` _(exported)_ - `/business-logic/calculations/compliance/tax-reminders.ts`
- `calculateTimeInsideUSA` _(internal)_ - `/business-logic/calculations/lpr-status/advanced-helpers.ts`
- `calculateTotalInclusiveDays` _(exported)_ - `/business-logic/calculations/travel-analytics/helpers.ts`
- `calculateTravelStreaks` _(exported)_ - `/business-logic/calculations/travel-analytics/streak-helpers.ts`
- `calculateTripDaysAbroad` _(exported)_ - `/business-logic/calculations/presence/helpers.ts`
- `calculateTripDaysAbroadExcludingTravelDays` _(exported)_ - `/business-logic/calculations/travel-analytics/helpers.ts`
- `calculateTripDaysExcludingTravel` _(exported)_ - `/utils/trip-calculations.ts`
- `calculateTripDaysInPeriod` _(exported)_ - `/utils/trip-calculations.ts`
- `calculateTripDaysInYear` _(exported)_ - `/utils/trip-calculations.ts`
- `calculateTripDuration` _(exported)_ - `/utils/trip-calculations.ts`
- `calculateTripMetrics` _(exported)_ - `/business-logic/calculations/lpr-status/helpers.ts`
- `calculateVariance` _(internal)_ - `/business-logic/calculations/travel-risk/helpers.ts`
- `calculateYearSummaryData` _(exported)_ - `/business-logic/calculations/reporting/annual-summary.ts`
- `chainResult` _(exported)_ - `/errors/index.ts`
- `checkContinuousResidence` _(exported)_ - `/business-logic/calculations/presence/calculator.ts`
- `checkIfTripApproachesContinuousResidenceRisk` _(exported)_ - `/business-logic/calculations/travel-risk/abandonment.ts`
- `checkIfTripApproachesGreenCardLoss` _(exported)_ - `/business-logic/calculations/travel-risk/abandonment.ts`
- `checkIfTripBreaksContinuousResidence` _(exported)_ - `/business-logic/calculations/travel-risk/abandonment.ts`
- `checkIfTripRisksAutomaticGreenCardLoss` _(exported)_ - `/business-logic/calculations/travel-risk/abandonment.ts`
- `combineResults` _(exported)_ - `/errors/index.ts`
- `compareWithPreviousYear` _(exported)_ - `/business-logic/calculations/reporting/annual-summary.ts`
- `createEarlyFilingMilestone` _(internal)_ - `/business-logic/calculations/reporting/milestones.ts`
- `createNoHistoryProjection` _(internal)_ - `/business-logic/calculations/travel-analytics/analytics.ts`
- `createPhysicalPresenceMilestone` _(internal)_ - `/business-logic/calculations/reporting/milestones.ts`
- `createPresenceStreak` _(exported)_ - `/business-logic/calculations/travel-analytics/helpers.ts`
- `createProjectionWithHistory` _(internal)_ - `/business-logic/calculations/travel-analytics/analytics.ts`
- `createResidenceWarning` _(exported)_ - `/business-logic/calculations/presence/helpers.ts`
- `determineCurrentStatus` _(exported)_ - `/business-logic/calculations/lpr-status/advanced-helpers.ts`
- `determineCurrentStatus` _(internal)_ - `/business-logic/calculations/compliance/removal-of-conditions.ts`
- `determineGreenCardRenewalUrgency` _(exported)_ - `/business-logic/calculations/compliance/compliance-helpers.ts`
- `determineGreenCardRiskLevel` _(exported)_ - `/business-logic/calculations/travel-risk/assessment-helpers.ts`
- `determineIfReentryPermitProvidesProtection` _(exported)_ - `/business-logic/calculations/lpr-status/permit-helpers.ts`
- `determineIfReentryPermitProvidesProtectionAdvanced` _(exported)_ - `/business-logic/calculations/lpr-status/permit-helpers.ts`
- `determineTaxFilingUrgency` _(exported)_ - `/business-logic/calculations/compliance/compliance-helpers.ts`
- `determineTravelBudgetRisk` _(exported)_ - `/business-logic/calculations/travel-risk/helpers.ts`
- `determineTravelTrend` _(exported)_ - `/business-logic/calculations/travel-risk/helpers.ts`
- `endOfUTCDay` _(exported)_ - `/utils/date-helpers.ts`
- `err` _(exported)_ - `/errors/index.ts`
- `filterValidTrips` _(exported)_ - `/utils/validation.ts`
- `formatDate` _(exported)_ - `/utils/date-helpers.ts`
- `formatDateRange` _(exported)_ - `/business-logic/calculations/travel-analytics/helpers.ts`
- `formatLongestTrip` _(exported)_ - `/business-logic/calculations/reporting/annual-summary.ts`
- `formatUTCDate` _(exported)_ - `/utils/date-helpers.ts`, `/utils/utc-date-helpers.ts`
- `generateAnnualTravelSummary` _(exported)_ - `/business-logic/calculations/reporting/annual-summary.ts`
- `generateLPRStatusRecommendations` _(exported)_ - `/business-logic/calculations/lpr-status/helpers.ts`
- `generateRecommendationsForRiskLevel` _(exported)_ - `/business-logic/calculations/travel-risk/assessment-helpers.ts`
- `generateSuggestions` _(exported)_ - `/business-logic/calculations/lpr-status/advanced-helpers.ts`
- `generateWarningsForDaysAbroad` _(exported)_ - `/business-logic/calculations/travel-risk/assessment-helpers.ts`
- `getActiveComplianceItems` _(exported)_ - `/business-logic/calculations/compliance/compliance-coordinator.ts`
- `getActiveGreenCardRenewalItem` _(exported)_ - `/business-logic/calculations/compliance/active-item-helpers.ts`
- `getActiveRemovalOfConditionsItem` _(exported)_ - `/business-logic/calculations/compliance/active-item-helpers.ts`
- `getActiveSelectiveServiceItem` _(exported)_ - `/business-logic/calculations/compliance/active-item-helpers.ts`
- `getActiveTaxFilingItem` _(exported)_ - `/business-logic/calculations/compliance/active-item-helpers.ts`
- `getActualTaxDeadline` _(exported)_ - `/business-logic/calculations/compliance/tax-reminders.ts`
- `getActualValidTrips` _(exported)_ - `/business-logic/calculations/travel-analytics/helpers.ts`, `/utils/validation.ts`
- `getAdvancedRiskLevel` _(internal)_ - `/business-logic/calculations/lpr-status/advanced-helpers.ts`
- `getAgeInYears` _(exported)_ - `/business-logic/calculations/compliance/selective-service.ts`
- `getBaseDeadlineForYear` _(internal)_ - `/business-logic/calculations/compliance/tax-reminders.ts`
- `getCurrentDate` _(exported)_ - `/utils/date-helpers.ts`
- `getCurrentUTCDate` _(exported)_ - `/utils/date-helpers.ts`, `/utils/utc-date-helpers.ts`
- `getDaysInMonth` _(exported)_ - `/utils/date-helpers.ts`
- `getDaysUntilAgedOut` _(exported)_ - `/business-logic/calculations/compliance/selective-service.ts`
- `getDaysUntilFilingWindow` _(exported)_ - `/business-logic/calculations/compliance/removal-of-conditions.ts`
- `getDaysUntilRegistrationRequired` _(exported)_ - `/business-logic/calculations/compliance/selective-service.ts`
- `getDaysUntilSpecificDeadline` _(exported)_ - `/business-logic/calculations/compliance/tax-reminders.ts`
- `getDaysUntilTaxDeadline` _(exported)_ - `/business-logic/calculations/compliance/tax-reminders.ts`
- `getDefaultCountryData` _(exported)_ - `/business-logic/calculations/travel-analytics/helpers.ts`
- `getEffectiveTripDates` _(internal)_ - `/business-logic/calculations/travel-analytics/helpers.ts`
- `getExtensionInfo` _(exported)_ - `/business-logic/calculations/compliance/tax-reminders.ts`
- `getFilingWindowDates` _(exported)_ - `/business-logic/calculations/compliance/removal-of-conditions.ts`
- `getGreenCardExpirationDeadline` _(exported)_ - `/business-logic/calculations/compliance/compliance-helpers.ts`
- `getGreenCardRenewalPriorityItem` _(exported)_ - `/business-logic/calculations/compliance/compliance-helpers.ts`
- `getHighRiskRecommendation` _(internal)_ - `/business-logic/calculations/travel-risk/helpers.ts`
- `getLowRiskRecommendation` _(internal)_ - `/business-logic/calculations/travel-risk/helpers.ts`
- `getMediumRiskRecommendation` _(internal)_ - `/business-logic/calculations/travel-risk/helpers.ts`
- `getMonthsUntilExpiration` _(exported)_ - `/business-logic/calculations/compliance/green-card-renewal.ts`
- `getNextTaxDeadline` _(exported)_ - `/business-logic/calculations/compliance/tax-reminders.ts`
- `getNoRiskRecommendation` _(internal)_ - `/business-logic/calculations/travel-risk/helpers.ts`
- `getPriorityComplianceItems` _(exported)_ - `/business-logic/calculations/compliance/compliance-coordinator.ts`
- `getRecentYearsData` _(internal)_ - `/business-logic/calculations/travel-risk/helpers.ts`
- `getReentryPermitProtectedThresholds` _(exported)_ - `/business-logic/calculations/travel-risk/abandonment.ts`
- `getRegistrationDeadline` _(exported)_ - `/business-logic/calculations/compliance/selective-service.ts`
- `getRemovalOfConditionsDeadline` _(exported)_ - `/business-logic/calculations/compliance/removal-of-conditions.ts`
- `getRemovalOfConditionsPriorityItem` _(exported)_ - `/business-logic/calculations/compliance/compliance-helpers.ts`
- `getRemovalOfConditionsStatus` _(internal)_ - `/business-logic/calculations/compliance/compliance-coordinator.ts`
- `getRemovalOfConditionsUpcomingDeadline` _(exported)_ - `/business-logic/calculations/compliance/compliance-helpers.ts`
- `getRenewalUrgency` _(exported)_ - `/business-logic/calculations/compliance/green-card-renewal.ts`
- `getRenewalWindowStartDate` _(exported)_ - `/business-logic/calculations/compliance/green-card-renewal.ts`
- `getRequiredDays` _(exported)_ - `/business-logic/calculations/travel-analytics/helpers.ts`
- `getRequiredYears` _(exported)_ - `/business-logic/calculations/travel-analytics/helpers.ts`
- `getRiskImpactDescription` _(exported)_ - `/business-logic/calculations/travel-risk/helpers.ts`
- `getRiskRecommendation` _(exported)_ - `/business-logic/calculations/travel-risk/helpers.ts`
- `getSelectiveServiceDeadline` _(exported)_ - `/business-logic/calculations/compliance/compliance-helpers.ts`
- `getSelectiveServicePriorityItem` _(exported)_ - `/business-logic/calculations/compliance/compliance-helpers.ts`
- `getSimulatedValidTrips` _(exported)_ - `/utils/validation.ts`
- `getTaxFilingDeadline` _(exported)_ - `/business-logic/calculations/compliance/compliance-helpers.ts`
- `getTaxFilingPriorityItem` _(exported)_ - `/business-logic/calculations/compliance/compliance-helpers.ts`
- `getTaxSeasonDateRange` _(exported)_ - `/business-logic/calculations/compliance/tax-reminders.ts`
- `getTopDestinations` _(exported)_ - `/business-logic/calculations/reporting/annual-summary.ts`
- `getUpcomingDeadlines` _(exported)_ - `/business-logic/calculations/compliance/compliance-coordinator.ts`
- `getUTCYear` _(exported)_ - `/utils/date-helpers.ts`, `/utils/utc-date-helpers.ts`
- `getVeryHighRiskRecommendation` _(internal)_ - `/business-logic/calculations/travel-risk/helpers.ts`
- `getYearBoundaries` _(exported)_ - `/business-logic/calculations/travel-analytics/helpers.ts`
- `getYearTrips` _(exported)_ - `/business-logic/calculations/reporting/annual-summary.ts`
- `handleAbandonmentRiskSuggestions` _(exported)_ - `/business-logic/calculations/lpr-status/suggestion-helpers.ts`
- `handleAlreadyEligible` _(internal)_ - `/business-logic/calculations/travel-analytics/analytics.ts`
- `handleConditionalResidentSuggestions` _(exported)_ - `/business-logic/calculations/lpr-status/suggestion-helpers.ts`
- `handleGeneralRiskSuggestions` _(exported)_ - `/business-logic/calculations/lpr-status/suggestion-helpers.ts`
- `handleImpossibleEligibility` _(internal)_ - `/business-logic/calculations/travel-analytics/analytics.ts`
- `handleN470ExemptionSuggestions` _(exported)_ - `/business-logic/calculations/lpr-status/suggestion-helpers.ts`
- `handleReentryPermitSuggestions` _(exported)_ - `/business-logic/calculations/lpr-status/suggestion-helpers.ts`
- `hasHighFrequencyShortTrips` _(internal)_ - `/business-logic/calculations/lpr-status/advanced-helpers.ts`
- `hasRiskyTrips` _(exported)_ - `/business-logic/calculations/lpr-status/helpers.ts`
- `isCurrentlyTaxSeason` _(exported)_ - `/business-logic/calculations/compliance/tax-reminders.ts`
- `isEligibleForEarlyFiling` _(exported)_ - `/business-logic/calculations/presence/calculator.ts`
- `isErr` _(exported)_ - `/errors/index.ts`
- `isInFilingWindow` _(exported)_ - `/business-logic/calculations/compliance/removal-of-conditions.ts`
- `isInRenewalWindow` _(exported)_ - `/business-logic/calculations/compliance/green-card-renewal.ts`
- `isLeapYear` _(exported)_ - `/utils/date-helpers.ts`
- `isOk` _(exported)_ - `/errors/index.ts`
- `isSelectiveServiceRequired` _(exported)_ - `/business-logic/calculations/compliance/selective-service.ts`
- `isValidDate` _(exported)_ - `/utils/date-helpers.ts`
- `isValidDateFormat` _(exported)_ - `/utils/date-helpers.ts`
- `isValidTrip` _(exported)_ - `/utils/validation.ts`
- `isValidTripForResidenceCheck` _(exported)_ - `/utils/validation.ts`
- `isValidTripForRiskAssessment` _(exported)_ - `/utils/validation.ts`
- `isValidTripWithId` _(exported)_ - `/utils/validation.ts`
- `isWithinYearBoundaries` _(internal)_ - `/business-logic/calculations/travel-analytics/helpers.ts`
- `mapError` _(exported)_ - `/errors/index.ts`
- `mapResult` _(exported)_ - `/errors/index.ts`
- `mapRiskLevelToDescription` _(exported)_ - `/business-logic/calculations/travel-risk/assessment-helpers.ts`
- `mapToBasicRiskLevel` _(internal)_ - `/business-logic/calculations/lpr-status/helpers.ts`
- `ok` _(exported)_ - `/errors/index.ts`
- `parseDate` _(exported)_ - `/utils/date-helpers.ts`
- `parseDateInput` _(exported)_ - `/utils/date-helpers.ts`
- `parseTripDates` _(exported)_ - `/business-logic/calculations/travel-analytics/helpers.ts`
- `parseUTCDate` _(exported)_ - `/utils/date-helpers.ts`, `/utils/utc-date-helpers.ts`
- `populateTripDaysSet` _(exported)_ - `/utils/trip-calculations.ts`
- `projectEligibilityDate` _(exported)_ - `/business-logic/calculations/travel-analytics/analytics.ts`
- `safeAssessRiskOfLosingPermanentResidentStatus` _(exported)_ - `/business-logic/calculations/lpr-status/safe-calculator.ts`
- `safeAssessRiskOfLosingPermanentResidentStatusAdvanced` _(exported)_ - `/business-logic/calculations/lpr-status/safe-calculator.ts`
- `safeAssessTripRiskForAllLegalThresholds` _(exported)_ - `/business-logic/calculations/travel-risk/safe-assessment.ts`
- `safeAssessUpcomingTripRisk` _(exported)_ - `/business-logic/calculations/travel-analytics/safe-analytics.ts`
- `safeCalculateComprehensiveCompliance` _(exported)_ - `/business-logic/calculations/compliance/safe-compliance-coordinator.ts`
- `safeCalculateCountryStatistics` _(exported)_ - `/business-logic/calculations/travel-analytics/safe-analytics.ts`
- `safeCalculateDaysAbroadByYear` _(exported)_ - `/business-logic/calculations/travel-analytics/safe-analytics.ts`
- `safeCalculateDaysOfPhysicalPresence` _(exported)_ - `/business-logic/calculations/presence/safe-calculator.ts`
- `safeCalculateEligibilityDates` _(exported)_ - `/business-logic/calculations/presence/safe-calculator.ts`
- `safeCalculateGreenCardRenewalStatus` _(exported)_ - `/business-logic/calculations/compliance/safe-compliance-functions.ts`
- `safeCalculateMaximumTripDurationWithExemptions` _(exported)_ - `/business-logic/calculations/lpr-status/safe-calculator.ts`
- `safeCalculatePresenceStatus` _(exported)_ - `/business-logic/calculations/presence/safe-calculator.ts`
- `safeCalculateRemovalOfConditionsStatus` _(exported)_ - `/business-logic/calculations/compliance/safe-compliance-functions.ts`
- `safeCalculateSelectiveServiceStatus` _(exported)_ - `/business-logic/calculations/compliance/safe-compliance-functions.ts`
- `safeCalculateTaxReminderStatus` _(exported)_ - `/business-logic/calculations/compliance/safe-compliance-functions.ts`
- `safeCalculateTripDaysInPeriod` _(exported)_ - `/utils/safe-trip-calculations.ts`
- `safeCalculateTripDaysInYear` _(exported)_ - `/utils/safe-trip-calculations.ts`
- `safeCalculateTripDuration` _(exported)_ - `/utils/safe-trip-calculations.ts`
- `safeCheckContinuousResidence` _(exported)_ - `/business-logic/calculations/presence/safe-calculator.ts`
- `safeProjectEligibilityDate` _(exported)_ - `/business-logic/calculations/travel-analytics/safe-analytics.ts`
- `sortPriorityItems` _(exported)_ - `/business-logic/calculations/compliance/compliance-helpers.ts`
- `startOfUTCDay` _(exported)_ - `/utils/date-helpers.ts`
- `subUTCDays` _(exported)_ - `/utils/date-helpers.ts`, `/utils/utc-date-helpers.ts`
- `toActiveComplianceItemOutput` _(exported)_ - `/schemas/compliance-helpers.ts`
- `toCountryStatisticsOutput` _(exported)_ - `/schemas/travel-analytics-helpers.ts`
- `toDaysAbroadByYearOutput` _(exported)_ - `/schemas/calculation-helpers.ts`
- `toPriorityComplianceItemOutput` _(exported)_ - `/schemas/compliance-helpers.ts`
- `toTravelStreakOutput` _(exported)_ - `/schemas/travel-analytics-helpers.ts`
- `toTripRiskAssessmentOutput` _(exported)_ - `/schemas/travel-analytics-helpers.ts`
- `toUpcomingDeadlineOutput` _(exported)_ - `/schemas/compliance-helpers.ts`
- `unwrapOr` _(exported)_ - `/errors/index.ts`
- `unwrapResult` _(exported)_ - `/errors/index.ts`
- `updateCountryData` _(exported)_ - `/business-logic/calculations/travel-analytics/helpers.ts`
- `validateAndParseDates` _(exported)_ - `/business-logic/calculations/presence/helpers.ts`
- `validateTripForCalculation` _(exported)_ - `/utils/validation.ts`
- `willBeAbroadDuringTaxSeason` _(exported)_ - `/business-logic/calculations/compliance/tax-reminders.ts`

---

## Functions by File Path

### Business Logic Files

#### `/business-logic/calculations/compliance/active-item-helpers.ts`

- getActiveGreenCardRenewalItem _(exported)_
- getActiveRemovalOfConditionsItem _(exported)_
- getActiveSelectiveServiceItem _(exported)_
- getActiveTaxFilingItem _(exported)_

#### `/business-logic/calculations/compliance/compliance-coordinator.ts`

- calculateComprehensiveCompliance _(exported)_
- getActiveComplianceItems _(exported)_
- getPriorityComplianceItems _(exported)_
- getUpcomingDeadlines _(exported)_
- getRemovalOfConditionsStatus _(internal)_

#### `/business-logic/calculations/compliance/compliance-helpers.ts`

- determineGreenCardRenewalUrgency _(exported)_
- determineTaxFilingUrgency _(exported)_
- getGreenCardExpirationDeadline _(exported)_
- getGreenCardRenewalPriorityItem _(exported)_
- getRemovalOfConditionsPriorityItem _(exported)_
- getRemovalOfConditionsUpcomingDeadline _(exported)_
- getSelectiveServiceDeadline _(exported)_
- getSelectiveServicePriorityItem _(exported)_
- getTaxFilingDeadline _(exported)_
- getTaxFilingPriorityItem _(exported)_
- sortPriorityItems _(exported)_

#### `/business-logic/calculations/compliance/green-card-renewal.ts`

- calculateGreenCardRenewalStatus _(exported)_
- getMonthsUntilExpiration _(exported)_
- getRenewalUrgency _(exported)_
- getRenewalWindowStartDate _(exported)_
- isInRenewalWindow _(exported)_

#### `/business-logic/calculations/compliance/removal-of-conditions.ts`

- calculateRemovalOfConditionsStatus _(exported)_
- getDaysUntilFilingWindow _(exported)_
- getFilingWindowDates _(exported)_
- getRemovalOfConditionsDeadline _(exported)_
- isInFilingWindow _(exported)_
- determineCurrentStatus _(internal)_

#### `/business-logic/calculations/compliance/selective-service.ts`

- calculateSelectiveServiceStatus _(exported)_
- getAgeInYears _(exported)_
- getDaysUntilAgedOut _(exported)_
- getDaysUntilRegistrationRequired _(exported)_
- getRegistrationDeadline _(exported)_
- isSelectiveServiceRequired _(exported)_

#### `/business-logic/calculations/compliance/tax-deadline-helpers.ts`

- adjustForWeekend _(exported)_

#### `/business-logic/calculations/compliance/tax-reminders.ts`

- calculateTaxReminderStatus _(exported)_
- getActualTaxDeadline _(exported)_
- getDaysUntilSpecificDeadline _(exported)_
- getDaysUntilTaxDeadline _(exported)_
- getExtensionInfo _(exported)_
- getNextTaxDeadline _(exported)_
- getTaxSeasonDateRange _(exported)_
- isCurrentlyTaxSeason _(exported)_
- willBeAbroadDuringTaxSeason _(exported)_
- getBaseDeadlineForYear _(internal)_

#### `/business-logic/calculations/lpr-status/advanced-helpers.ts`

- calculateRebuttablePresumption _(exported)_
- calculateRiskFactors _(exported)_
- determineCurrentStatus _(exported)_
- generateSuggestions _(exported)_
- getAdvancedRiskLevel _(internal)_
- calculateAdvancedRiskScore _(internal)_
- calculateTimeInsideUSA _(internal)_
- hasHighFrequencyShortTrips _(internal)_

#### `/business-logic/calculations/lpr-status/analysis-helpers.ts`

- analyzePatterns _(exported)_
- assessRiskAndStatus _(exported)_
- calculateBasicRiskScore _(internal)_
- adjustRiskScoreForMitigatingFactors _(internal)_

#### `/business-logic/calculations/lpr-status/calculator.ts`

- assessRiskOfLosingPermanentResidentStatus _(exported)_
- assessRiskOfLosingPermanentResidentStatusAdvanced _(exported)_
- calculateMaximumTripDurationWithExemptions _(exported)_

#### `/business-logic/calculations/lpr-status/duration-calculator.ts`

- calculateMaximumTripDurationToMaintainAllStatuses _(exported)_

#### `/business-logic/calculations/lpr-status/helpers.ts`

- calculateTripMetrics _(exported)_
- generateLPRStatusRecommendations _(exported)_
- hasRiskyTrips _(exported)_
- mapToBasicRiskLevel _(internal)_

#### `/business-logic/calculations/lpr-status/pattern-analysis.ts`

- analyzePatternOfNonResidence _(exported)_

#### `/business-logic/calculations/lpr-status/permit-helpers.ts`

- determineIfReentryPermitProvidesProtection _(exported)_
- determineIfReentryPermitProvidesProtectionAdvanced _(exported)_

#### `/business-logic/calculations/lpr-status/suggestion-helpers.ts`

- handleAbandonmentRiskSuggestions _(exported)_
- handleConditionalResidentSuggestions _(exported)_
- handleGeneralRiskSuggestions _(exported)_
- handleN470ExemptionSuggestions _(exported)_
- handleReentryPermitSuggestions _(exported)_

#### `/business-logic/calculations/presence/calculator.ts`

- calculateDaysOfPhysicalPresence _(exported)_
- calculateEligibilityDates _(exported)_
- calculatePresenceStatus _(exported)_
- checkContinuousResidence _(exported)_
- isEligibleForEarlyFiling _(exported)_

#### `/business-logic/calculations/presence/helpers.ts`

- calculateTripDaysAbroad _(exported)_
- createResidenceWarning _(exported)_
- validateAndParseDates _(exported)_

#### `/business-logic/calculations/reporting/annual-summary.ts`

- calculateYearSummaryData _(exported)_
- compareWithPreviousYear _(exported)_
- formatLongestTrip _(exported)_
- generateAnnualTravelSummary _(exported)_
- getTopDestinations _(exported)_
- getYearTrips _(exported)_

#### `/business-logic/calculations/reporting/milestones.ts`

- calculateMilestones _(exported)_
- createEarlyFilingMilestone _(internal)_
- createPhysicalPresenceMilestone _(internal)_

#### `/business-logic/calculations/travel-analytics/analytics.ts`

- assessUpcomingTripRisk _(exported)_
- calculateCountryStatistics _(exported)_
- calculateDaysAbroadByYear _(exported)_
- projectEligibilityDate _(exported)_
- calculateHistoricalAbsenceRate _(internal)_
- handleAlreadyEligible _(internal)_
- handleImpossibleEligibility _(internal)_
- calculateProjectionConfidence _(internal)_
- createNoHistoryProjection _(internal)_
- createProjectionWithHistory _(internal)_

#### `/business-logic/calculations/travel-analytics/budget-helpers.ts`

- calculateSafeTravelBudget _(exported)_

#### `/business-logic/calculations/travel-analytics/helpers.ts`

- calculateAnniversaryDate _(exported)_
- calculateDaysAbroadInYear _(exported)_
- calculateTotalInclusiveDays _(exported)_
- calculateTripDaysAbroadExcludingTravelDays _(exported)_
- createPresenceStreak _(exported)_
- formatDateRange _(exported)_
- getActualValidTrips _(exported)_
- getDefaultCountryData _(exported)_
- getRequiredDays _(exported)_
- getRequiredYears _(exported)_
- getYearBoundaries _(exported)_
- parseTripDates _(exported)_
- updateCountryData _(exported)_
- isWithinYearBoundaries _(internal)_
- getEffectiveTripDates _(internal)_
- calculateBoundaryAdjustment _(internal)_

#### `/business-logic/calculations/travel-analytics/streak-helpers.ts`

- calculateTravelStreaks _(exported)_
- addFinalPresenceStreak _(internal)_
- addGapStreaks _(internal)_
- addInitialPresenceStreak _(internal)_

#### `/business-logic/calculations/travel-risk/abandonment.ts`

- calculateGreenCardAbandonmentRisk _(exported)_
- checkIfTripApproachesContinuousResidenceRisk _(exported)_
- checkIfTripApproachesGreenCardLoss _(exported)_
- checkIfTripBreaksContinuousResidence _(exported)_
- checkIfTripRisksAutomaticGreenCardLoss _(exported)_
- getReentryPermitProtectedThresholds _(exported)_

#### `/business-logic/calculations/travel-risk/assessment-helpers.ts`

- determineGreenCardRiskLevel _(exported)_
- generateRecommendationsForRiskLevel _(exported)_
- generateWarningsForDaysAbroad _(exported)_
- mapRiskLevelToDescription _(exported)_

#### `/business-logic/calculations/travel-risk/assessment.ts`

- assessTripRiskForAllLegalThresholds _(exported)_

#### `/business-logic/calculations/travel-risk/helpers.ts`

- assessTravelRisk _(exported)_
- calculateConfidenceLevel _(exported)_
- determineTravelBudgetRisk _(exported)_
- determineTravelTrend _(exported)_
- getRiskImpactDescription _(exported)_
- getRiskRecommendation _(exported)_
- calculatePercentageOfTimeAbroad _(internal)_
- getHighRiskRecommendation _(internal)_
- getMediumRiskRecommendation _(internal)_
- getLowRiskRecommendation _(internal)_
- getVeryHighRiskRecommendation _(internal)_
- getNoRiskRecommendation _(internal)_
- calculateRecentYearsData _(internal)_
- calculateVariance _(internal)_

### Utility Files

#### `/utils/date-helpers.ts`

- addUTCDays _(exported)_
- endOfUTCDay _(exported)_
- formatDate _(exported)_
- formatUTCDate _(exported)_
- getCurrentDate _(exported)_
- getCurrentUTCDate _(exported)_
- getDaysInMonth _(exported)_
- getUTCYear _(exported)_
- isLeapYear _(exported)_
- isValidDate _(exported)_
- isValidDateFormat _(exported)_
- parseDate _(exported)_
- parseDateInput _(exported)_
- parseUTCDate _(exported)_
- startOfUTCDay _(exported)_
- subUTCDays _(exported)_

#### `/utils/trip-calculations.ts`

- calculateTripDuration _(exported)_
- calculateTripDaysExcludingTravel _(exported)_
- calculateTripDaysInPeriod _(exported)_
- calculateTripDaysInYear _(exported)_
- populateTripDaysSet _(exported)_

#### `/utils/utc-date-helpers.ts`

- formatUTCDate _(exported)_
- getCurrentUTCDate _(exported)_
- getUTCYear _(exported)_
- parseUTCDate _(exported)_
- subUTCDays _(exported)_

#### `/utils/validation.ts`

- filterValidTrips _(exported)_
- getActualValidTrips _(exported)_
- getSimulatedValidTrips _(exported)_
- isValidTrip _(exported)_
- isValidTripForResidenceCheck _(exported)_
- isValidTripForRiskAssessment _(exported)_
- isValidTripWithId _(exported)_
- validateTripForCalculation _(exported)_

### Schema Files

#### `/schemas/calculation-helpers.ts`

- toDaysAbroadByYearOutput _(exported)_

#### `/schemas/compliance-helpers.ts`

- toActiveComplianceItemOutput _(exported)_
- toPriorityComplianceItemOutput _(exported)_
- toUpcomingDeadlineOutput _(exported)_

#### `/schemas/travel-analytics-helpers.ts`

- toCountryStatisticsOutput _(exported)_
- toTravelStreakOutput _(exported)_
- toTripRiskAssessmentOutput _(exported)_

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
