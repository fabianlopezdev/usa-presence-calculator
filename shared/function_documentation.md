# Function and Method Documentation

This document provides a comprehensive list of all functions and methods found in the shared TypeScript codebase, organized by feature and also in alphabetical order. Its purpose is to aid in code auditing and to serve as a reference for developers.

---

## Functions by Feature

### Feature: Compliance Management

#### Active Compliance Items

- `getActiveRemovalOfConditionsItem()`: Returns active compliance item for removal of conditions if applicable
- `getActiveGreenCardRenewalItem()`: Returns active compliance item for green card renewal if needed
- `getActiveSelectiveServiceItem()`: Returns active compliance item for selective service registration if required
- `getActiveTaxFilingItem()`: Returns active compliance item for tax filing if deadline is approaching

#### Compliance Coordination

- `calculateComprehensiveCompliance()`: Calculates comprehensive compliance status across all areas
- `getActiveComplianceItems()`: Gets list of active compliance items requiring action
- `getPriorityComplianceItems()`: Gets priority compliance items sorted by urgency
- `getUpcomingDeadlines()`: Gets all upcoming deadlines sorted by date

#### Compliance Helpers

- `determineGreenCardRenewalUrgency()`: Determines urgency level for green card renewal
- `determineTaxFilingUrgency()`: Determines urgency level for tax filing
- `getRemovalOfConditionsPriorityItem()`: Gets priority item for removal of conditions if overdue
- `getGreenCardRenewalPriorityItem()`: Gets priority item for green card renewal if urgent/expired
- `getSelectiveServicePriorityItem()`: Gets priority item for selective service if registration required
- `getTaxFilingPriorityItem()`: Gets priority item for tax filing if abroad during tax season
- `sortPriorityItems()`: Sorts priority items by urgency and deadline
- `getRemovalOfConditionsDeadline()`: Gets removal of conditions deadline if applicable
- `getGreenCardExpirationDeadline()`: Gets green card expiration deadline
- `getSelectiveServiceDeadline()`: Gets selective service registration deadline
- `getTaxFilingDeadline()`: Gets tax filing deadline

#### Green Card Renewal

- `calculateGreenCardRenewalStatus()`: Calculates the green card renewal status for 10-year cards
- `getMonthsUntilExpiration()`: Calculates months until green card expiration
- `isInRenewalWindow()`: Checks if currently in the 6-month renewal window
- `getRenewalUrgency()`: Gets the renewal urgency level
- `getRenewalWindowStartDate()`: Calculates when renewal window opens

#### Removal of Conditions

- `calculateRemovalOfConditionsStatus()`: Calculates removal of conditions status for conditional residents
- `getDaysUntilFilingWindow()`: Gets days until the 90-day filing window opens
- `isInFilingWindow()`: Checks if currently in the 90-day filing window
- `getFilingWindowDates()`: Calculates filing window start and end dates
- `getRemovalOfConditionsDeadline()`: Gets the deadline for filing Form I-751

#### Selective Service

- `calculateSelectiveServiceStatus()`: Calculates selective service registration status
- `isSelectiveServiceRequired()`: Checks if selective service registration is required
- `getAgeInYears()`: Calculates age in years
- `getRegistrationDeadline()`: Gets registration deadline for males
- `getDaysUntilRegistrationRequired()`: Gets days until registration deadline
- `getDaysUntilAgedOut()`: Gets days until aged out at 26th birthday

#### Tax Filing

- `calculateTaxReminderStatus()`: Calculates tax filing reminder status
- `getActualTaxDeadline()`: Gets actual tax deadline adjusted for weekends and holidays
- `getNextTaxDeadline()`: Gets next tax filing deadline for backward compatibility
- `getDaysUntilSpecificDeadline()`: Calculates days until a specific deadline
- `getDaysUntilTaxDeadline()`: Calculates days until next tax deadline
- `isCurrentlyTaxSeason()`: Checks if currently in tax season
- `willBeAbroadDuringTaxSeason()`: Checks if user will be abroad during upcoming tax season
- `getTaxSeasonDateRange()`: Gets tax season date range for current year
- `getExtensionInfo()`: Gets information about available tax extensions
- `adjustForWeekend()`: Adjusts date to next business day if weekend or DC Emancipation Day

### Feature: LPR Status Tracking

#### Advanced Analysis

- `calculateRebuttablePresumption()`: Calculates rebuttable presumption based on trip duration
- `calculateRiskFactors()`: Calculates risk factors for LPR status
- `determineCurrentStatus()`: Determines current LPR status based on risk factors
- `generateSuggestions()`: Generates suggestions based on current status and risk factors

#### Core Calculator

- `assessRiskOfLosingPermanentResidentStatus()`: Comprehensive assessment of risk to LPR status
- `assessRiskOfLosingPermanentResidentStatusAdvanced()`: Advanced LPR status assessment with pattern analysis
- `calculateMaximumTripDurationWithExemptions()`: Calculate maximum safe trip duration with exemptions

#### Duration Calculations

- `calculateMaximumTripDurationToMaintainAllStatuses()`: Calculate maximum safe trip duration for all statuses

#### General Helpers

- `calculateTripMetrics()`: Calculate trip metrics including current year trips
- `generateLPRStatusRecommendations()`: Generate recommendations based on LPR risk level
- `hasRiskyTrips()`: Check if any trips pose a risk to continuous residence

#### Pattern Analysis

- `analyzePatternOfNonResidence()`: Analyze pattern of non-residence for LPR status
- `analyzePatterns()`: Analyzes patterns with rebuttable presumption
- `assessRiskAndStatus()`: Assesses risk and determines current status

#### Reentry Permit

- `determineIfReentryPermitProvidesProtection()`: Determine if reentry permit provides protection
- `determineIfReentryPermitProvidesProtectionAdvanced()`: Enhanced reentry permit protection check

#### Suggestions

- `handleConditionalResidentSuggestions()`: Handles conditional resident suggestions
- `handleN470ExemptionSuggestions()`: Handles N-470 exemption suggestions
- `handleAbandonmentRiskSuggestions()`: Handles abandonment risk suggestions
- `handleReentryPermitSuggestions()`: Handles reentry permit suggestions
- `handleGeneralRiskSuggestions()`: Handles general risk suggestions

### Feature: Physical Presence Calculation

#### Core Calculator

- `calculateDaysOfPhysicalPresence()`: Calculates total days in USA vs abroad based on trips
- `calculateEligibilityDates()`: Determines eligibility and early filing dates
- `calculatePresenceStatus()`: Calculates presence status including percentage complete
- `checkContinuousResidence()`: Checks trips for continuous residence warnings
- `isEligibleForEarlyFiling()`: Determines if eligible for early N-400 filing

#### Helpers

- `calculateTripDaysAbroad()`: Calculates days abroad for a single trip
- `createResidenceWarning()`: Creates continuous residence warning if threshold exceeded
- `isValidTrip()`: Validates trip has required fields and valid dates
- `isValidTripForResidenceCheck()`: Extended validation including trip ID
- `validateAndParseDates()`: Validates and parses date range

### Feature: Travel Risk Assessment

#### Abandonment Risk

- `calculateGreenCardAbandonmentRisk()`: Calculates risk of green card abandonment
- `getReentryPermitProtectedThresholds()`: Returns modified thresholds for permit holders
- `checkIfTripApproachesContinuousResidenceRisk()`: Checks if trip approaches residence risk
- `checkIfTripBreaksContinuousResidence()`: Checks if trip breaks continuous residence
- `checkIfTripApproachesGreenCardLoss()`: Checks if trip approaches green card loss risk
- `checkIfTripRisksAutomaticGreenCardLoss()`: Checks if trip risks automatic green card loss

#### Risk Assessment

- `assessTripRiskForAllLegalThresholds()`: Evaluates impact on all legal thresholds
- `mapRiskLevelToDescription()`: Maps risk level to string description
- `determineGreenCardRiskLevel()`: Determines risk level for green card
- `generateWarningsForDaysAbroad()`: Generates warnings based on days abroad
- `generateRecommendationsForRiskLevel()`: Generates recommendations based on risk level

#### General Risk Helpers

- `assessTravelRisk()`: Assesses travel risk based on various factors
- `determineTravelBudgetRisk()`: Determines travel budget risk level
- `calculateConfidenceLevel()`: Calculates confidence level for projections
- `determineTravelTrend()`: Determines travel trend from historical data
- `getRiskImpactDescription()`: Gets risk impact description
- `getRiskRecommendation()`: Gets risk recommendation

### Feature: Travel Analytics

#### Core Analytics

- `assessUpcomingTripRisk()`: Assesses risk for future trips
- `calculateCountryStatistics()`: Calculates statistics per country visited
- `calculateDaysAbroadByYear()`: Calculates days abroad broken down by year
- `projectEligibilityDate()`: Projects when eligibility will be met
- `calculateSafeTravelBudget()`: Calculates safe travel budget until eligibility

#### Annual Summary

- `calculateYearSummaryData()`: Calculates total days abroad and longest trip for a year
- `compareWithPreviousYear()`: Compares travel between years
- `formatLongestTrip()`: Formats longest trip data for display
- `generateAnnualTravelSummary()`: Generates comprehensive annual travel summary
- `getTopDestinations()`: Returns top destinations by days spent
- `getYearTrips()`: Filters trips by departure year

#### Analytics Helpers

- `calculateAnniversaryDate()`: Calculates anniversary date handling leap years
- `calculateDaysAbroadInYear()`: Calculates days abroad for a trip within a specific year
- `calculateTotalInclusiveDays()`: Calculates total days including departure and return
- `calculateTripDaysAbroadExcludingTravelDays()`: Calculates days abroad excluding travel days
- `createPresenceStreak()`: Creates a presence streak object
- `formatDateRange()`: Formats date range for display
- `getActualValidTrips()`: Filters to only valid non-simulated trips
- `getDefaultCountryData()`: Returns default country data structure
- `getRequiredDays()`: Returns required presence days
- `getRequiredYears()`: Returns required years for eligibility
- `getYearBoundaries()`: Gets year boundary dates
- `isValidTripForRiskAssessment()`: Validates trip for risk assessment
- `parseTripDates()`: Parses trip dates into date objects
- `updateCountryData()`: Updates country statistics

#### Milestones

- `calculateMilestones()`: Calculates physical presence and early filing milestones

#### Travel Streaks

- `calculateTravelStreaks()`: Calculates presence streaks between trips

### Feature: Date and Time Utilities

- `parseUTCDate()`: Parses date string to UTC Date object
- `formatUTCDate()`: Formats date to YYYY-MM-DD using UTC components
- `getCurrentUTCDate()`: Gets current UTC date
- `getUTCYear()`: Gets UTC year from date
- `subUTCDays()`: Subtracts days from a UTC date

---

## Alphabetical Function & Method Index

- `addFinalPresenceStreak()`: Adds streak after last trip
- `addGapStreaks()`: Adds streaks between trips
- `addInitialPresenceStreak()`: Adds streak before first trip
- `adjustForWeekend()`: Adjusts date to next business day if weekend or DC Emancipation Day
- `analyzePatternOfNonResidence()`: Analyze pattern of non-residence for LPR status
- `analyzePatterns()`: Analyzes patterns with rebuttable presumption
- `assessContinuousResidenceImpact()`: Assesses continuous residence impact
- `assessContinuousResidenceRisk()`: Assesses continuous residence risk
- `assessLprStatusRisk()`: Assesses LPR status risk
- `assessLPRStatusRisk()`: Assesses LPR status risk
- `assessPhysicalPresenceImpact()`: Assesses physical presence impact
- `assessRiskAndStatus()`: Assesses risk and determines current status
- `assessRiskOfLosingPermanentResidentStatus()`: Comprehensive assessment of risk to LPR status
- `assessRiskOfLosingPermanentResidentStatusAdvanced()`: Advanced LPR status assessment with pattern analysis
- `assessTravelRisk()`: Assesses travel risk based on various factors
- `assessTripRiskForAllLegalThresholds()`: Evaluates impact on all legal thresholds
- `assessUpcomingTripRisk()`: Assesses risk for future trips
- `buildAdvancedAssessmentResult()`: Builds advanced assessment result
- `calculateAnniversaryDate()`: Calculates anniversary date handling leap years
- `calculateBoundaryAdjustment()`: Calculates boundary adjustments
- `calculateComprehensiveCompliance()`: Calculates comprehensive compliance status across all areas
- `calculateConfidenceLevel()`: Calculates confidence level for projections
- `calculateCountryStatistics()`: Calculates statistics per country visited
- `calculateDaysAbroadByYear()`: Calculates days abroad broken down by year
- `calculateDaysAbroadInYear()`: Calculates days abroad for a trip within a specific year
- `calculateDaysOfPhysicalPresence()`: Calculates total days in USA vs abroad based on trips
- `calculateDaysUntilExpiry()`: Calculates days until expiry
- `calculateDaysUntilNextThreshold()`: Calculates days until next risk threshold
- `calculateEligibilityDates()`: Determines eligibility and early filing dates
- `calculateGreenCardAbandonmentRisk()`: Calculates risk of green card abandonment
- `calculateGreenCardRenewalStatus()`: Calculates the green card renewal status for 10-year cards
- `calculateHistoricalAbsenceRate()`: Calculates historical absence rate
- `calculateMaximumTripDurationToMaintainAllStatuses()`: Calculate maximum safe trip duration for all statuses
- `calculateMaximumTripDurationWithExemptions()`: Calculate maximum safe trip duration with exemptions
- `calculateMilestones()`: Calculates physical presence and early filing milestones
- `calculatePresenceStatus()`: Calculates presence status including percentage complete
- `calculateProjectionConfidence()`: Calculates confidence metrics for projection
- `calculateRebuttablePresumption()`: Calculates rebuttable presumption based on trip duration
- `calculateRemovalOfConditionsStatus()`: Calculates removal of conditions status for conditional residents
- `calculateRiskFactors()`: Calculates risk factors for LPR status
- `calculateSafeTravelBudget()`: Calculates safe travel budget until eligibility
- `calculateSafetyDays()`: Helper function to calculate safety days for each requirement
- `calculateSelectiveServiceStatus()`: Calculates selective service registration status
- `calculateStandardRisk()`: Calculates standard risk without permit protection
- `calculateTaxReminderStatus()`: Calculates tax filing reminder status
- `calculateTotalDaysAbroadInPeriod()`: Helper function to calculate total days abroad in eligibility period
- `calculateTotalInclusiveDays()`: Calculates total days including departure and return
- `calculateTotalRiskScore()`: Calculates total risk score
- `calculateTravelStreaks()`: Calculates presence streaks between trips
- `calculateTripDaysAbroad()`: Calculates days abroad for a single trip
- `calculateTripDaysAbroadExcludingTravelDays()`: Calculates days abroad excluding travel days
- `calculateTripMetrics()`: Calculate trip metrics including current year trips
- `calculateTripStatistics()`: Calculates trip statistics
- `calculateWithPermitProtection()`: Calculates risk when protected by reentry permit
- `calculateYearSummaryData()`: Calculates total days abroad and longest trip for a year
- `checkContinuousResidence()`: Checks trips for continuous residence warnings
- `checkIfReentryPermitExpired()`: Checks if reentry permit is expired
- `checkIfTripApproachesContinuousResidenceRisk()`: Checks if trip approaches residence risk
- `checkIfTripApproachesGreenCardLoss()`: Checks if trip approaches green card loss risk
- `checkIfTripBreaksContinuousResidence()`: Checks if trip breaks continuous residence
- `checkIfTripRisksAutomaticGreenCardLoss()`: Checks if trip risks automatic green card loss
- `compareWithPreviousYear()`: Compares travel between years
- `createAlreadyAtRiskResult()`: Creates already at risk result
- `createBaseAssessment()`: Creates base assessment result
- `createEarlyFilingMilestone()`: Creates early filing milestone info
- `createNoHistoryProjection()`: Creates projection when no travel history
- `createPhysicalPresenceMilestone()`: Creates physical presence milestone info
- `createPresenceStreak()`: Creates a presence streak object
- `createProjectionWithHistory()`: Creates projection with historical data
- `createResidenceWarning()`: Creates continuous residence warning if threshold exceeded
- `dateRangeRefinement()`: Custom refinement to ensure return date is after departure date
- `determineCurrentStatus()`: Determines current LPR status based on risk factors
- `determineGreenCardRiskLevel()`: Determines risk level for green card
- `determineIfHasPattern()`: Determines if has pattern
- `determineIfReentryPermitProvidesProtection()`: Determine if reentry permit provides protection
- `determineIfReentryPermitProvidesProtectionAdvanced()`: Enhanced reentry permit protection check
- `determineLimitingFactor()`: Determines limiting factor
- `determineOverallRiskLevel()`: Determines overall risk level
- `determineTravelBudgetRisk()`: Determines travel budget risk level
- `determineTravelTrend()`: Determines travel trend from historical data
- `extractAdvancedParams()`: Extracts advanced parameters
- `formatDateRange()`: Formats date range for display
- `formatLongestTrip()`: Formats longest trip data for display
- `formatUTCDate()`: Formats date to YYYY-MM-DD using UTC components
- `generateAnnualTravelSummary()`: Generates comprehensive annual travel summary
- `generateLPRStatusRecommendations()`: Generate recommendations based on LPR risk level
- `generateRecommendations()`: Generates recommendations
- `generateRecommendationsForRiskLevel()`: Generates recommendations based on risk level
- `generateSuggestions()`: Generates suggestions based on current status and risk factors
- `generateWarnings()`: Generates warnings
- `generateWarningsForDaysAbroad()`: Generates warnings based on days abroad
- `getActiveComplianceItems()`: Gets list of active compliance items requiring action
- `getActiveGreenCardRenewalItem()`: Returns active compliance item for green card renewal if needed
- `getActiveRemovalOfConditionsItem()`: Returns active compliance item for removal of conditions if applicable
- `getActiveSelectiveServiceItem()`: Returns active compliance item for selective service registration if required
- `getActiveTaxFilingItem()`: Returns active compliance item for tax filing if deadline is approaching
- `getActualTaxDeadline()`: Gets actual tax deadline adjusted for weekends and holidays
- `getActualValidTrips()`: Filters to only valid non-simulated trips
- `getAgeInYears()`: Calculates age in years
- `getBaseDeadlineForYear()`: Gets base deadline for a specific year and type
- `getCurrentUTCDate()`: Gets current UTC date
- `getDaysUntilAgedOut()`: Gets days until aged out at 26th birthday
- `getDaysUntilFilingWindow()`: Gets days until the 90-day filing window opens
- `getDaysUntilRegistrationRequired()`: Gets days until registration deadline
- `getDaysUntilSpecificDeadline()`: Calculates days until a specific deadline
- `getDaysUntilTaxDeadline()`: Calculates days until next tax deadline
- `getDefaultCountryData()`: Returns default country data structure
- `getEffectiveTripDates()`: Gets effective trip dates within boundaries
- `getExtensionInfo()`: Gets information about available tax extensions
- `getFilingWindowDates()`: Calculates filing window start and end dates
- `getGreenCardExpirationDeadline()`: Gets green card expiration deadline
- `getGreenCardRenewalPriorityItem()`: Gets priority item for green card renewal if urgent/expired
- `getLastTrip()`: Gets the last trip
- `getLastTripFromList()`: Gets the last trip from the list
- `getMonthsUntilExpiration()`: Calculates months until green card expiration
- `getNextTaxDeadline()`: Gets next tax filing deadline for backward compatibility
- `getPriorityComplianceItems()`: Gets priority compliance items sorted by urgency
- `getRecommendationsByRiskLevel()`: Get recommendations for different risk levels
- `getReentryPermitProtectedThresholds()`: Returns modified thresholds for permit holders
- `getRegistrationDeadline()`: Gets registration deadline for males
- `getRemovalOfConditionsDeadline()`: Gets removal of conditions deadline if applicable
- `getRemovalOfConditionsDeadline()`: Gets the deadline for filing Form I-751
- `getRemovalOfConditionsPriorityItem()`: Gets priority item for removal of conditions if overdue
- `getRemovalOfConditionsStatus()`: Gets removal of conditions status with default for non-conditional residents
- `getRenewalUrgency()`: Gets the renewal urgency level
- `getRenewalWindowStartDate()`: Calculates when renewal window opens
- `getRequiredDays()`: Returns required presence days
- `getRequiredDaysForCategory()`: Returns required days based on 3 or 5 year path
- `getRequiredYears()`: Returns required years for eligibility
- `getRiskImpactDescription()`: Gets risk impact description
- `getRiskMessage()`: Gets risk message for level
- `getRiskRecommendation()`: Gets risk recommendation
- `getSelectiveServiceDeadline()`: Gets selective service registration deadline
- `getSelectiveServicePriorityItem()`: Gets priority item for selective service if registration required
- `getTaxFilingDeadline()`: Gets tax filing deadline
- `getTaxFilingPriorityItem()`: Gets priority item for tax filing if abroad during tax season
- `getTaxSeasonDateRange()`: Gets tax season date range for current year
- `getTopDestinations()`: Returns top destinations by days spent
- `getUpcomingDeadlines()`: Gets all upcoming deadlines sorted by date
- `getUTCYear()`: Gets UTC year from date
- `getYearBoundaries()`: Gets year boundary dates
- `getYearTrips()`: Filters trips by departure year
- `handleAbandonmentRiskSuggestions()`: Handles abandonment risk suggestions
- `handleAlreadyEligible()`: Returns projection for already eligible cases
- `handleApproachingPermitLimit()`: Handles approaching permit limit
- `handleApprovedPermit()`: Handles approved permit
- `handleAutomaticLoss()`: Handles automatic loss scenario
- `handleConditionalResidentSuggestions()`: Handles conditional resident suggestions
- `handleExpiredPermit()`: Handles expired permit
- `handleGeneralRiskSuggestions()`: Handles general risk suggestions
- `handleHighRisk()`: Handles high risk scenario
- `handleImpossibleEligibility()`: Returns projection for impossible eligibility cases
- `handleLPRRiskLevel()`: Handles different LPR risk levels
- `handleN470ExemptionSuggestions()`: Handles N-470 exemption suggestions
- `handlePendingPermit()`: Handles pending permit
- `handlePresumptionOfAbandonment()`: Handles presumption of abandonment
- `handleProtectedByPermit()`: Handles permit protection scenario
- `handleReentryPermitSuggestions()`: Handles reentry permit suggestions
- `handleWarning()`: Handles warning level
- `hasRiskyTrips()`: Check if any trips pose a risk to continuous residence
- `initializeAssessmentResult()`: Initializes the assessment result object
- `initializeLPRStatusAssessment()`: Initializes LPR status assessment
- `initializeMaxTripResult()`: Initializes max trip result
- `initializeReentryPermitProtection()`: Initializes reentry permit protection
- `isCurrentlyAbroad()`: Checks if currently abroad
- `isCurrentlyTaxSeason()`: Checks if currently in tax season
- `isEligibleForEarlyFiling()`: Determines if eligible for early N-400 filing
- `isInFilingWindow()`: Checks if currently in the 90-day filing window
- `isInRenewalWindow()`: Checks if currently in the 6-month renewal window
- `isSelectiveServiceRequired()`: Checks if selective service registration is required
- `isValidTrip()`: Validates trip has required fields and valid dates
- `isValidTripForResidenceCheck()`: Extended validation including trip ID
- `isValidTripForRiskAssessment()`: Validates trip for risk assessment
- `isWithinYearBoundaries()`: Checks if trip is within year boundaries
- `mapInputToTrips()`: Maps input to trips
- `mapRiskLevelToDescription()`: Maps risk level to string description
- `parseDateRange()`: Parses date range
- `parseTripDates()`: Parses trip dates into date objects
- `parseUTCDate()`: Parses date string to UTC Date object
- `performAdvancedAnalysis()`: Performs advanced analysis
- `projectEligibilityDate()`: Projects when eligibility will be met
- `sortPriorityItems()`: Sorts priority items by urgency and deadline
- `subUTCDays()`: Subtracts days from a UTC date
- `updateCountryData()`: Updates country statistics
- `updateRiskLevels()`: Updates risk levels
- `validateAndParseDates()`: Validates and parses date range
- `validateEligibilityCategory()`: Validates eligibility category parameter
- `willBeAbroadDuringTaxSeason()`: Checks if user will be abroad during upcoming tax season
