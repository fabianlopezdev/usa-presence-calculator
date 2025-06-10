# Safe Wrapper Functions Reference - USA Presence Calculator Shared Package

This document provides a comprehensive reference for all safe wrapper functions that provide validated input handling using the Result type pattern.

## Overview

Safe wrapper functions provide a secure layer between external input and core business logic by:

- Validating all inputs against strict Zod schemas
- Returning `Result<T, E>` instead of throwing exceptions
- Providing detailed error messages for debugging
- Preventing malicious or malformed data from reaching business logic

## Result Type Pattern

```typescript
type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };
```

## Usage Pattern

```typescript
import { safeCalculateDaysOfPhysicalPresence } from '@usa-presence/shared';

const result = safeCalculateDaysOfPhysicalPresence(trips, greenCardDate, currentDate);

if (result.success) {
  console.log(`Days in USA: ${result.data}`);
} else {
  console.error(`Calculation failed: ${result.error.message}`);
}
```

## Safe Wrapper Functions by Module

### Presence Calculation (4 functions)

**File**: `/business-logic/calculations/presence/safe-calculator.ts`

#### `safeCalculateDaysOfPhysicalPresence`

```typescript
(trips: unknown, greenCardDate: unknown, currentDate?: unknown) =>
  Result<number, TripValidationError | DateRangeError>;
```

Validates inputs and calculates total days physically present in USA.

#### `safeCalculatePresenceStatus`

```typescript
(trips: unknown, eligibilityCategory: unknown, greenCardDate: unknown, currentDate?: unknown) =>
  Result<PresenceStatus, TripValidationError | DateRangeError>;
```

Validates inputs and calculates comprehensive presence status.

#### `safeCheckContinuousResidence`

```typescript
(trips: unknown) => Result<ContinuousResidenceResult, TripValidationError>;
```

Validates trips and checks for continuous residence violations.

#### `safeCalculateEligibilityDates`

```typescript
(
  totalDaysInUSA: unknown,
  eligibilityCategory: unknown,
  greenCardDate: unknown,
  currentDate?: unknown,
) => Result<EligibilityDates, TripValidationError | DateRangeError>;
```

Validates inputs and calculates citizenship eligibility dates.

### LPR Status Assessment (3 functions)

**File**: `/business-logic/calculations/lpr-status/safe-calculator.ts`

#### `safeAssessRiskOfLosingPermanentResidentStatus`

```typescript
(trips: unknown, greenCardDate: unknown, asOfDate?: unknown) =>
  Result<LPRStatusRiskAssessment, TripValidationError | LPRStatusError>;
```

Validates inputs for basic LPR status risk assessment.

#### `safeAssessRiskOfLosingPermanentResidentStatusAdvanced`

```typescript
(params: unknown) => Result<AdvancedLPRStatusAssessment, TripValidationError | LPRStatusError>;
```

Validates comprehensive parameters for advanced LPR assessment.

#### `safeCalculateMaximumTripDurationWithExemptions`

```typescript
(params: unknown) => Result<MaximumTripDurationResult, TripValidationError | LPRStatusError>;
```

Validates parameters for maximum trip duration calculation.

### Compliance Tracking (5 functions)

#### Coordinator

**File**: `/business-logic/calculations/compliance/safe-compliance-coordinator.ts`

##### `safeCalculateComprehensiveCompliance`

```typescript
(params: unknown) =>
  Result<ComprehensiveComplianceStatus, TripValidationError | ComplianceCalculationError>;
```

Validates parameters for comprehensive compliance calculation.

#### Individual Functions

**File**: `/business-logic/calculations/compliance/safe-compliance-functions.ts`

##### `safeCalculateRemovalOfConditionsStatus`

```typescript
(isConditionalResident: unknown, greenCardDate: unknown, currentDate?: unknown) =>
  Result<RemovalOfConditionsStatus, DateRangeError | ComplianceCalculationError>;
```

Validates inputs for I-751 status calculation.

##### `safeCalculateGreenCardRenewalStatus`

```typescript
(greenCardExpirationDate: unknown, currentDate?: unknown) =>
  Result<GreenCardRenewalStatus, DateRangeError | ComplianceCalculationError>;
```

Validates inputs for green card renewal status.

##### `safeCalculateSelectiveServiceStatus`

```typescript
(
  birthDate?: unknown,
  gender?: unknown,
  isSelectiveServiceRegistered?: unknown,
  currentDate?: unknown,
) => Result<SelectiveServiceStatus, DateRangeError | ComplianceCalculationError>;
```

Validates inputs for selective service status.

##### `safeCalculateTaxReminderStatus`

```typescript
(trips: unknown, isDismissed?: unknown, currentDate?: unknown) =>
  Result<TaxReminderStatus, DateRangeError | ComplianceCalculationError>;
```

Validates inputs for tax reminder status.

### Travel Analytics (4 functions)

**File**: `/business-logic/calculations/travel-analytics/safe-analytics.ts`

#### `safeAssessUpcomingTripRisk`

```typescript
(
  upcomingTrips: unknown,
  currentTotalDaysAbroad: unknown,
  eligibilityCategory: unknown,
  greenCardDate: unknown,
  currentDate?: unknown,
) => Result<TripRiskAssessment[], TripValidationError | USCISCalculationError>;
```

Validates inputs for upcoming trip risk assessment.

#### `safeCalculateCountryStatistics`

```typescript
(trips: unknown) => Result<CountryStatistics[], TripValidationError | USCISCalculationError>;
```

Validates trips for country statistics calculation.

#### `safeCalculateDaysAbroadByYear`

```typescript
(trips: unknown, greenCardDate: unknown, currentDate?: unknown) =>
  Result<YearlyDaysAbroad[], DateRangeError | TripValidationError | USCISCalculationError>;
```

Validates inputs for yearly days abroad calculation.

#### `safeProjectEligibilityDate`

```typescript
(
  trips: unknown,
  totalDaysInUSA: unknown,
  eligibilityCategory: unknown,
  greenCardDate: unknown,
  currentDate?: unknown,
) => Result<TravelProjection, DateRangeError | TripValidationError | USCISCalculationError>;
```

Validates inputs for eligibility date projection.

### Travel Risk Assessment (1 function)

**File**: `/business-logic/calculations/travel-risk/safe-assessment.ts`

#### `safeAssessTripRiskForAllLegalThresholds`

```typescript
(trip: unknown, reentryPermitInfo?: unknown) =>
  Result<ComprehensiveRiskAssessment, TripValidationError | USCISCalculationError>;
```

Validates inputs for comprehensive trip risk assessment.

### Utility Functions (3 functions)

**File**: `/utils/safe-trip-calculations.ts`

#### `safeCalculateTripDuration`

```typescript
(trip: unknown, options?: unknown) => Result<number, TripValidationError | DateRangeError>;
```

Validates trip for duration calculation.

#### `safeCalculateTripDaysInPeriod`

```typescript
(trip: unknown, startDate: unknown, endDate: unknown, options?: unknown) =>
  Result<number, TripValidationError | DateRangeError>;
```

Validates inputs for trip days in period calculation.

#### `safeCalculateTripDaysInYear`

```typescript
(trip: unknown, year: unknown, options?: unknown) =>
  Result<number, TripValidationError | DateRangeError>;
```

Validates inputs for trip days in year calculation.

## Error Types

All safe wrappers return specific error types:

- **`TripValidationError`**: Invalid trip data or structure
- **`DateRangeError`**: Invalid date formats or ranges
- **`LPRStatusError`**: LPR-specific calculation errors
- **`ComplianceCalculationError`**: Compliance-specific errors
- **`USCISCalculationError`**: General USCIS calculation errors

## Best Practices

1. **Always use safe wrappers** when accepting external input
2. **Check result.success** before accessing result.data
3. **Log errors** for debugging but don't expose internal details to users
4. **Use type guards** (isOk/isErr) for better TypeScript inference
5. **Chain operations** using chainResult for complex workflows

## Performance

Safe wrappers add minimal overhead:

- Schema validation: ~1-2ms per operation
- Result wrapping: <0.1ms
- Total overhead: <3ms typical

This small performance cost provides significant security and reliability benefits.

---

Last updated: January 2025
