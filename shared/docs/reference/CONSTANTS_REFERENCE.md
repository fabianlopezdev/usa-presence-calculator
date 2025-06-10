# Comprehensive Constants Reference - USA Presence Calculator Shared Package

This document is the complete reference for ALL constants, enums, and configuration values in the shared package, providing a centralized resource for understanding business rules, thresholds, and system configuration.

## Summary Audit

### Overall Statistics

- **Total Constant Files**: 7 (6 specific + 1 index)
- **Total Constants**: 52 main constant objects
- **Total Enum Types**: 15 TypeScript enum-like types
- **Constant Categories**: 6 major categories
- **Total Individual Values**: ~300+

### Constants by Category

| Category                | Constant Count | Primary Purpose                                  |
| ----------------------- | -------------- | ------------------------------------------------ |
| **USCIS Rules**         | 12             | Official immigration requirements and thresholds |
| **Compliance**          | 10             | Status tracking, forms, and user messages        |
| **Priority & Urgency**  | 8              | Time thresholds and sorting priorities           |
| **Travel Analytics**    | 8              | Risk assessment and projection configuration     |
| **Date & Time**         | 4              | Time conversions and calendar utilities          |
| **Validation Messages** | 10             | Centralized error messages for consistency       |

## Table of Contents

1. [USCIS Official Rules](#uscis-official-rules)
2. [Compliance Constants](#compliance-constants)
3. [Priority & Urgency Constants](#priority--urgency-constants)
4. [Travel Analytics Constants](#travel-analytics-constants)
5. [Date & Time Constants](#date--time-constants)
6. [Validation Messages](#validation-messages)
7. [Alphabetical Constant Index](#alphabetical-constant-index)
8. [TypeScript Types Index](#typescript-types-index)
9. [Constants by Usage](#constants-by-usage)

---

## USCIS Official Rules

**File**: `/constants/uscis-rules.ts`

### Physical Presence Requirements

```typescript
PHYSICAL_PRESENCE_REQUIREMENTS = {
  FIVE_YEAR_PATH: 913, // days (2.5 years out of 5)
  THREE_YEAR_PATH: 548, // days (1.5 years out of 3)
} as const;
```

**Purpose**: Minimum days physically present in USA for naturalization

### Continuous Residence Requirements

```typescript
CONTINUOUS_RESIDENCE_REQUIREMENTS = {
  FIVE_YEAR_PATH: 5, // years
  THREE_YEAR_PATH: 3, // years
} as const;
```

**Purpose**: Years of continuous residence required for naturalization

### Continuous Residence Thresholds

```typescript
CONTINUOUS_RESIDENCE_THRESHOLDS = {
  RESETS_CLOCK: 365, // days - Breaks continuous residence
  CRITICAL: 365, // days - Same as RESETS_CLOCK
  HIGH_RISK: 180, // days - Presumed to break residence
  MEDIUM_RISK: 150, // days - Approaching dangerous territory
  LOW_RISK: 90, // days - Safe but notable absence
} as const;
```

**Purpose**: Trip duration thresholds affecting continuous residence

### LPR Abandonment Thresholds

```typescript
LPR_ABANDONMENT_THRESHOLDS = {
  AUTOMATIC_LOSS: 365, // days - Risk of automatic green card loss
  HIGH_RISK: 330, // days - Very high risk of abandonment
  CRITICAL: 270, // days - Critical risk level
  SEVERE: 210, // days - Severe risk level
  PRESUMPTION_OF_ABANDONMENT: 180, // days - Rebuttable presumption triggered
  WARNING: 150, // days - Warning level
} as const;
```

**Purpose**: Trip duration thresholds affecting permanent resident status

### Reentry Permit Rules

```typescript
REENTRY_PERMIT_RULES = {
  MAXIMUM_PROTECTION_DAYS: 730, // days (2 years max protection)
  WARNING_BEFORE_EXPIRY_DAYS: 60, // days before permit expires
  APPROACHING_LIMIT_DAYS: 670, // days approaching max protection
} as const;
```

**Purpose**: Rules for reentry permit protection periods

### Early Filing Window

```typescript
EARLY_FILING_WINDOW_DAYS = 90; // Can file N-400 90 days early
```

**Purpose**: Days before eligibility date when N-400 can be filed

### Removal of Conditions

```typescript
REMOVAL_OF_CONDITIONS = {
  FILING_WINDOW_DAYS: 90, // Days before 2-year anniversary
  CONDITIONAL_PERIOD_YEARS: 2, // Duration of conditional status
  FILING_DEADLINE_DAYS: 0, // Must file by 2-year anniversary
  LATE_FILING_GRACE_PERIOD_DAYS: 0, // No grace period
} as const;
```

**Purpose**: I-751 filing requirements for conditional residents

### Document Renewal

```typescript
DOCUMENT_RENEWAL = {
  GREEN_CARD_VALIDITY_YEARS: 10, // 10-year green cards
  RENEWAL_WINDOW_MONTHS: 6, // Can renew 6 months before expiry
} as const;
```

**Purpose**: Green card validity and renewal timing

### Selective Service

```typescript
SELECTIVE_SERVICE = {
  MIN_AGE: 18, // Must register at 18
  MAX_AGE: 26, // No longer required at 26
  GENDER_REQUIRED: 'male', // Only males must register
  REGISTRATION_GRACE_PERIOD_DAYS: 30, // 30 days after 18th birthday
} as const;
```

**Purpose**: Selective service registration requirements

### Tax Filing

```typescript
TAX_FILING = {
  STANDARD_DEADLINE_MONTH: 3, // April (0-indexed)
  STANDARD_DEADLINE_DAY: 15, // April 15
  ABROAD_EXTENSION_MONTH: 5, // June (0-indexed)
  ABROAD_EXTENSION_DAY: 15, // June 15
  OCTOBER_EXTENSION_MONTH: 9, // October (0-indexed)
  OCTOBER_EXTENSION_DAY: 15, // October 15
  TAX_SEASON_START_MONTH: 0, // January (0-indexed)
  TAX_SEASON_START_DAY: 29, // Late January
} as const;
```

**Purpose**: IRS tax filing deadlines and extensions

### Risk Warning Thresholds

```typescript
RISK_WARNING_THRESHOLDS = {
  CONTINUOUS_RESIDENCE: {
    DAYS_BEFORE_SIX_MONTHS: 30, // Warn 30 days before 180-day mark
    DAYS_BEFORE_ONE_YEAR: 30, // Warn 30 days before 365-day mark
  },
  LPR_STATUS: {
    DAYS_BEFORE_SIX_MONTHS: 30, // Warn 30 days before 180-day mark
    DAYS_BEFORE_ONE_YEAR: 60, // Warn 60 days before 365-day mark
  },
} as const;
```

**Purpose**: When to warn users about approaching risk thresholds

---

## Compliance Constants

**File**: `/constants/compliance.ts`

### Compliance Item Types

```typescript
COMPLIANCE_ITEM_TYPE = {
  removal_of_conditions: 'removal_of_conditions',
  green_card_renewal: 'green_card_renewal',
  selective_service: 'selective_service',
  tax_filing: 'tax_filing',
} as const;
```

**Type**: `ComplianceItemType`

### Removal of Conditions Status

```typescript
REMOVAL_CONDITIONS_STATUS = {
  not_yet: 'not_yet', // Before filing window
  in_window: 'in_window', // Can file now
  filed: 'filed', // Application submitted
  approved: 'approved', // USCIS approved
  overdue: 'overdue', // Past deadline
} as const;
```

**Type**: `RemovalConditionsStatus`

### Green Card Renewal Status

```typescript
GREEN_CARD_RENEWAL_STATUS = {
  valid: 'valid', // 6+ months remaining
  renewal_recommended: 'renewal_recommended', // Within 6-month window
  renewal_urgent: 'renewal_urgent', // < 2 months remaining
  expired: 'expired', // Already expired
} as const;
```

**Type**: `GreenCardRenewalStatus`

### Selective Service Status

```typescript
SELECTIVE_SERVICE_STATUS = {
  not_applicable: 'not_applicable', // Not male or wrong age
  must_register: 'must_register', // Required but not registered
  registered: 'registered', // Completed registration
  aged_out: 'aged_out', // Over 26, no longer required
} as const;
```

**Type**: `SelectiveServiceStatus`

### Tax Deadline Type

```typescript
TAX_DEADLINE_TYPE = {
  standard: 'standard', // April 15
  abroad_extension: 'abroad_extension', // June 15 (automatic)
  october_extension: 'october_extension', // October 15 (with form)
} as const;
```

**Type**: `TaxDeadlineType`

### Gender

```typescript
GENDER = {
  male: 'male',
  female: 'female',
  other: 'other',
} as const;
```

**Type**: `Gender`

### User-Facing Messages

#### Active Item Messages

```typescript
COMPLIANCE_ACTIVE_ITEM_MESSAGES = {
  [COMPLIANCE_ITEM_TYPE.removal_of_conditions]: 'File Form I-751 to remove conditions',
  [COMPLIANCE_ITEM_TYPE.green_card_renewal]: 'Renew your green card',
  [COMPLIANCE_ITEM_TYPE.selective_service]: 'Register with Selective Service',
  [COMPLIANCE_ITEM_TYPE.tax_filing]: 'File your U.S. tax return',
} as const;
```

#### Priority Messages

```typescript
COMPLIANCE_PRIORITY_MESSAGES = {
  [COMPLIANCE_ITEM_TYPE.removal_of_conditions]: 'I-751 filing deadline approaching',
  [COMPLIANCE_ITEM_TYPE.green_card_renewal]: 'Green card expiring soon',
  [COMPLIANCE_ITEM_TYPE.selective_service]: 'Selective Service registration required',
  [COMPLIANCE_ITEM_TYPE.tax_filing]: 'Tax filing deadline approaching',
} as const;
```

#### Deadline Descriptions

```typescript
COMPLIANCE_DEADLINE_DESCRIPTIONS = {
  [COMPLIANCE_ITEM_TYPE.removal_of_conditions]: 'I-751 must be filed by',
  [COMPLIANCE_ITEM_TYPE.green_card_renewal]: 'Green card expires on',
  [COMPLIANCE_ITEM_TYPE.selective_service]: 'Must register by',
  [COMPLIANCE_ITEM_TYPE.tax_filing]: 'Taxes due by',
} as const;
```

### Government Forms

```typescript
GOVERNMENT_FORM_NAMES = {
  removal_of_conditions: 'Form I-751',
  tax_extension: 'Form 4868',
} as const;
```

### Tax Extension Display

```typescript
TAX_EXTENSION_DEADLINE_DISPLAY = {
  abroad_extension: 'June 15',
  october_extension: 'October 15',
} as const;
```

---

## Priority & Urgency Constants

**File**: `/constants/priority-urgency.ts`

### Priority Levels

```typescript
PRIORITY_LEVEL = {
  critical: 'critical', // Immediate action required
  high: 'high', // Urgent action needed
  medium: 'medium', // Action recommended soon
  low: 'low', // Action can be planned
  none: 'none', // No priority
} as const;
```

**Type**: `PriorityLevel`

### Tax Filing Thresholds

```typescript
TAX_FILING_THRESHOLDS_DAYS = {
  ACTIVE_ITEM_THRESHOLD: 45, // Show as active item
  PRIORITY_ITEM_THRESHOLD: 30, // Show as priority item
  CRITICAL_URGENCY: 7, // Critical priority
  HIGH_URGENCY: 14, // High priority
} as const;
```

### Green Card Renewal Thresholds

```typescript
GREEN_CARD_RENEWAL_THRESHOLDS_MONTHS = {
  URGENT_THRESHOLD: 2, // Urgent renewal needed
  MEDIUM_THRESHOLD: 4, // Medium priority
  LOW_THRESHOLD: 6, // Low priority (renewal window)
} as const;
```

### Removal of Conditions Urgency

```typescript
REMOVAL_CONDITIONS_URGENCY_DAYS = {
  CRITICAL: 7, // 1 week before deadline
  HIGH: 14, // 2 weeks
  MEDIUM: 30, // 1 month
  LOW: 60, // 2 months
} as const;
```

### Selective Service Urgency

```typescript
SELECTIVE_SERVICE_URGENCY_DAYS = {
  CRITICAL: 7, // 1 week to register
  HIGH: 14, // 2 weeks
  MEDIUM: 20, // ~3 weeks
} as const;
```

### Sort Orders

```typescript
PRIORITY_SORT_ORDER = {
  [PRIORITY_LEVEL.critical]: 0,
  [PRIORITY_LEVEL.high]: 1,
  [PRIORITY_LEVEL.medium]: 2,
  [PRIORITY_LEVEL.low]: 3,
  [PRIORITY_LEVEL.none]: 4,
} as const;

COMPLIANCE_TYPE_SORT_ORDER = {
  [COMPLIANCE_ITEM_TYPE.green_card_renewal]: 0,
  [COMPLIANCE_ITEM_TYPE.removal_of_conditions]: 1,
  [COMPLIANCE_ITEM_TYPE.selective_service]: 2,
  [COMPLIANCE_ITEM_TYPE.tax_filing]: 3,
} as const;
```

### Consolidated Priority Thresholds

```typescript
PRIORITY_THRESHOLDS = {
  tax_filing: TAX_FILING_THRESHOLDS_DAYS,
  green_card_renewal: GREEN_CARD_RENEWAL_THRESHOLDS_MONTHS,
  removal_of_conditions: REMOVAL_CONDITIONS_URGENCY_DAYS,
  selective_service: SELECTIVE_SERVICE_URGENCY_DAYS,
} as const;
```

---

## Travel Analytics Constants

**File**: `/constants/travel-analytics.ts`

### Travel Budget Buffers

```typescript
TRAVEL_BUDGET_BUFFERS = {
  WARNING: 30, // 30-day critical buffer
  CAUTION: 90, // 90-day reasonable buffer
} as const;
```

### Confidence Thresholds

```typescript
CONFIDENCE_THRESHOLDS = {
  HIGH_VARIANCE: 900, // 30 days std deviation squared
  MEDIUM_VARIANCE: 400, // 20 days std deviation squared
  MINIMUM_YEARS_FOR_HIGH_CONFIDENCE: 3, // Need 3 years of data
} as const;
```

### Travel Trend Thresholds

```typescript
TRAVEL_TREND_THRESHOLDS = {
  SIGNIFICANT_CHANGE_DAYS: 20, // 20+ day change is significant
} as const;
```

### Configuration

```typescript
ANNUAL_SUMMARY_CONFIG = {
  TOP_DESTINATIONS_LIMIT: 5, // Show top 5 destinations
} as const;

TIME_PERIODS = {
  DAYS_IN_YEAR: 365, // Standard year length
} as const;
```

### Default Values

```typescript
DEFAULT_VALUES = {
  UNKNOWN_LOCATION: 'Unknown', // When location not specified
} as const;

PROJECTION_DEFAULTS = {
  FAR_FUTURE_DATE: '2099-12-31', // Default far future date
} as const;
```

### Risk Messages

```typescript
RISK_MESSAGES = {
  CONTINUOUS_RESIDENCE: {
    NONE: 'Trip duration safe for continuous residence',
    LOW: 'Approaching continuous residence risk threshold',
    MEDIUM: 'High risk to continuous residence',
    HIGH: 'Will likely break continuous residence',
    CRITICAL: 'Will break continuous residence requirement',
  },
  PHYSICAL_PRESENCE: {
    LOW: 'Minimal impact on physical presence requirement',
    MEDIUM: 'Moderate impact on physical presence timeline',
    HIGH: 'Significant impact on eligibility timeline',
    VERY_HIGH: 'Major setback to naturalization timeline',
  },
} as const;
```

### Risk Recommendations

```typescript
RISK_RECOMMENDATIONS = {
  CONTINUOUS_RESIDENCE: {
    NONE: 'Safe to travel',
    LOW: 'Consider shorter trip to stay safe',
    MEDIUM: 'Strongly recommend shorter trip',
    HIGH: 'Trip not recommended - high risk',
    CRITICAL: 'Do not take this trip',
  },
  PHYSICAL_PRESENCE: {
    LOW: 'Track your days carefully',
    MEDIUM: 'Budget remaining travel days wisely',
    HIGH: 'Minimize future travel',
    VERY_HIGH: 'Avoid all non-essential travel',
  },
} as const;
```

### Budget Recommendations

```typescript
BUDGET_RECOMMENDATIONS = {
  WARNING: 'Critical: You have very few travel days remaining',
  CAUTION: 'Caution: Budget your remaining days carefully',
  SAFE: 'You have a comfortable buffer of travel days',
} as const;
```

---

## Date & Time Constants

**File**: `/constants/date-time.ts`

### Time Conversions

```typescript
MILLISECONDS = {
  PER_SECOND: 1_000,
  PER_MINUTE: 60_000,
  PER_HOUR: 3_600_000,
  PER_DAY: 86_400_000,
} as const;
```

### Days of Week

```typescript
DAY_OF_WEEK = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
} as const;
```

**Type**: `DayOfWeek`

### Month Indices

```typescript
MONTH_INDEX = {
  JANUARY: 0,
  FEBRUARY: 1,
  MARCH: 2,
  APRIL: 3,
  MAY: 4,
  JUNE: 5,
  JULY: 6,
  AUGUST: 7,
  SEPTEMBER: 8,
  OCTOBER: 9,
  NOVEMBER: 10,
  DECEMBER: 11,
} as const;
```

**Type**: `MonthIndex`

### ISO Date Utilities

```typescript
ISO_DATE_UTILS = {
  DATE_ONLY_REGEX: /^\d{4}-\d{2}-\d{2}/,
  TIME_SEPARATOR: 'T',
} as const;
```

### DC Emancipation Day (Tax Adjustments)

```typescript
DC_EMANCIPATION_DAY = {
  TAX_DEADLINE_DAY: 15, // Normal April 15
  HOLIDAY_DAY: 16, // DC Emancipation Day
  DAY_AFTER_HOLIDAY: 17, // Day after holiday
  MONDAY_AFTER_WEEKEND_HOLIDAY: 18, // If holiday on weekend
  FRIDAY_SKIP_DAYS: 3, // Skip weekend + Monday
} as const;
```

---

## Validation Messages

**File**: `/constants/validation-messages.ts`

### Date Validation Messages

```typescript
DATE_VALIDATION = {
  INVALID_FORMAT: 'Date must be in YYYY-MM-DD format',
  RETURN_BEFORE_DEPARTURE: 'Return date must be after or equal to departure date',
} as const;
```

**Purpose**: Consistent date format validation messages

### Presence Validation Messages

```typescript
PRESENCE_VALIDATION = {
  INVALID_INPUT: 'Invalid input for presence calculation',
  INVALID_GREEN_CARD_DATE: 'Invalid green card date',
  INVALID_CALCULATION_DATE: 'Invalid calculation date',
  GREEN_CARD_FUTURE: 'Green card date cannot be in the future',
  UNKNOWN_ERROR: 'An unknown error occurred during presence calculation',
} as const;
```

**Purpose**: Physical presence calculation error messages

### LPR Status Validation Messages

```typescript
LPR_STATUS_VALIDATION = {
  INVALID_INPUT: 'Invalid input for LPR status assessment',
  INVALID_PARAMS: 'Invalid parameters for LPR status assessment',
  INVALID_TRIP_DURATION: 'Invalid parameters for trip duration calculation',
  UNKNOWN_ERROR_GREEN_CARD_RISK: 'An unknown error occurred during green card risk assessment',
  UNKNOWN_ERROR: 'An unknown error occurred during LPR status assessment',
} as const;
```

**Purpose**: LPR status assessment error messages

### Compliance Validation Messages

```typescript
COMPLIANCE_VALIDATION = {
  INVALID_INPUT: 'Invalid input for compliance calculation',
  INVALID_REMOVAL_CONDITIONS: 'Invalid input for removal of conditions calculation',
  INVALID_GREEN_CARD_RENEWAL: 'Invalid input for green card renewal calculation',
  INVALID_SELECTIVE_SERVICE: 'Invalid input for selective service calculation',
  INVALID_TAX_REMINDER: 'Invalid input for tax reminder calculation',
  UNKNOWN_ERROR: 'An unknown error occurred during compliance calculation',
} as const;
```

**Purpose**: Compliance tracking error messages

### Analytics Validation Messages

```typescript
ANALYTICS_VALIDATION = {
  INVALID_INPUT: 'Invalid input for analytics calculation',
  UNKNOWN_ERROR: 'An unknown error occurred during analytics calculation',
} as const;
```

**Purpose**: Travel analytics error messages

### Travel Risk Validation Messages

```typescript
TRAVEL_RISK_VALIDATION = {
  INVALID_ASSESSMENT: 'Invalid input for trip risk assessment',
  UNKNOWN_ERROR: 'An unknown error occurred during trip risk assessment',
} as const;
```

**Purpose**: Travel risk assessment error messages

### Trip Validation Messages

```typescript
TRIP_VALIDATION = {
  INVALID_DURATION: 'Invalid input for trip duration calculation',
  INVALID_RANGE: 'Invalid input for trip days calculation',
  UNKNOWN_ERROR: 'An unknown error occurred during trip calculation',
} as const;
```

**Purpose**: Trip calculation error messages

### User Validation Messages

```typescript
USER_VALIDATION = {
  INVALID_PROFILE: 'Invalid user profile data',
  INVALID_SETTINGS: 'Invalid user settings',
} as const;
```

**Purpose**: User data validation messages

### Notification Validation Messages

```typescript
NOTIFICATION_VALIDATION = {
  INVALID_DATA: 'Invalid notification data',
  INVALID_PREFERENCES: 'Invalid notification preferences',
} as const;
```

**Purpose**: Notification system error messages

### Schema Validation Messages

```typescript
SCHEMA_VALIDATION = {
  EXTRA_PROPERTIES: 'Object contains unexpected properties',
  MISSING_REQUIRED: 'Missing required fields',
  TYPE_MISMATCH: 'Invalid data type',
} as const;
```

**Purpose**: Generic schema validation messages

---

## Alphabetical Constant Index

- ANALYTICS_VALIDATION - `/constants/validation-messages.ts`
- ANNUAL_SUMMARY_CONFIG - `/constants/travel-analytics.ts`
- BUDGET_RECOMMENDATIONS - `/constants/travel-analytics.ts`
- COMPLIANCE_ACTIVE_ITEM_MESSAGES - `/constants/compliance.ts`
- COMPLIANCE_DEADLINE_DESCRIPTIONS - `/constants/compliance.ts`
- COMPLIANCE_ITEM_TYPE - `/constants/compliance.ts`
- COMPLIANCE_PRIORITY_MESSAGES - `/constants/compliance.ts`
- COMPLIANCE_TYPE_SORT_ORDER - `/constants/priority-urgency.ts`
- COMPLIANCE_VALIDATION - `/constants/validation-messages.ts`
- CONFIDENCE_THRESHOLDS - `/constants/travel-analytics.ts`
- CONTINUOUS_RESIDENCE_REQUIREMENTS - `/constants/uscis-rules.ts`
- CONTINUOUS_RESIDENCE_THRESHOLDS - `/constants/uscis-rules.ts`
- DATE_VALIDATION - `/constants/validation-messages.ts`
- DAY_OF_WEEK - `/constants/date-time.ts`
- DC_EMANCIPATION_DAY - `/constants/date-time.ts`
- DEFAULT_VALUES - `/constants/travel-analytics.ts`
- DOCUMENT_RENEWAL - `/constants/uscis-rules.ts`
- EARLY_FILING_WINDOW_DAYS - `/constants/uscis-rules.ts`
- GENDER - `/constants/compliance.ts`
- GOVERNMENT_FORM_NAMES - `/constants/compliance.ts`
- GREEN_CARD_RENEWAL_STATUS - `/constants/compliance.ts`
- GREEN_CARD_RENEWAL_THRESHOLDS_MONTHS - `/constants/priority-urgency.ts`
- ISO_DATE_UTILS - `/constants/date-time.ts`
- LPR_ABANDONMENT_THRESHOLDS - `/constants/uscis-rules.ts`
- LPR_STATUS_VALIDATION - `/constants/validation-messages.ts`
- MILLISECONDS - `/constants/date-time.ts`
- MONTH_INDEX - `/constants/date-time.ts`
- NOTIFICATION_VALIDATION - `/constants/validation-messages.ts`
- PHYSICAL_PRESENCE_REQUIREMENTS - `/constants/uscis-rules.ts`
- PRESENCE_VALIDATION - `/constants/validation-messages.ts`
- PRIORITY_LEVEL - `/constants/priority-urgency.ts`
- PRIORITY_SORT_ORDER - `/constants/priority-urgency.ts`
- PRIORITY_THRESHOLDS - `/constants/priority-urgency.ts`
- PROJECTION_DEFAULTS - `/constants/travel-analytics.ts`
- REENTRY_PERMIT_RULES - `/constants/uscis-rules.ts`
- REMOVAL_CONDITIONS_STATUS - `/constants/compliance.ts`
- REMOVAL_CONDITIONS_URGENCY_DAYS - `/constants/priority-urgency.ts`
- REMOVAL_OF_CONDITIONS - `/constants/uscis-rules.ts`
- RISK_MESSAGES - `/constants/travel-analytics.ts`
- RISK_RECOMMENDATIONS - `/constants/travel-analytics.ts`
- RISK_WARNING_THRESHOLDS - `/constants/uscis-rules.ts`
- SCHEMA_VALIDATION - `/constants/validation-messages.ts`
- SELECTIVE_SERVICE - `/constants/uscis-rules.ts`
- SELECTIVE_SERVICE_STATUS - `/constants/compliance.ts`
- SELECTIVE_SERVICE_URGENCY_DAYS - `/constants/priority-urgency.ts`
- TAX_DEADLINE_TYPE - `/constants/compliance.ts`
- TAX_EXTENSION_DEADLINE_DISPLAY - `/constants/compliance.ts`
- TAX_FILING - `/constants/uscis-rules.ts`
- TAX_FILING_THRESHOLDS_DAYS - `/constants/priority-urgency.ts`
- TIME_PERIODS - `/constants/travel-analytics.ts`
- TRAVEL_BUDGET_BUFFERS - `/constants/travel-analytics.ts`
- TRAVEL_RISK_VALIDATION - `/constants/validation-messages.ts`
- TRAVEL_TREND_THRESHOLDS - `/constants/travel-analytics.ts`
- TRIP_VALIDATION - `/constants/validation-messages.ts`
- USER_VALIDATION - `/constants/validation-messages.ts`

---

## TypeScript Types Index

All TypeScript types derived from constants:

- ComplianceItemType - from `COMPLIANCE_ITEM_TYPE`
- DayOfWeek - from `DAY_OF_WEEK`
- Gender - from `GENDER`
- GreenCardRenewalStatus - from `GREEN_CARD_RENEWAL_STATUS`
- MonthIndex - from `MONTH_INDEX`
- PriorityLevel - from `PRIORITY_LEVEL`
- RemovalConditionsStatus - from `REMOVAL_CONDITIONS_STATUS`
- SelectiveServiceStatus - from `SELECTIVE_SERVICE_STATUS`
- TaxDeadlineType - from `TAX_DEADLINE_TYPE`

---

## Constants by Usage

### User Interface Display

- COMPLIANCE_ACTIVE_ITEM_MESSAGES - Action button text
- COMPLIANCE_PRIORITY_MESSAGES - Alert/warning messages
- COMPLIANCE_DEADLINE_DESCRIPTIONS - Deadline labels
- TAX_EXTENSION_DEADLINE_DISPLAY - Date display strings
- GOVERNMENT_FORM_NAMES - Official form names
- RISK_MESSAGES - Risk level descriptions
- RISK_RECOMMENDATIONS - Action recommendations
- BUDGET_RECOMMENDATIONS - Travel budget status

### Business Logic Calculations

- PHYSICAL_PRESENCE_REQUIREMENTS - Naturalization requirements
- CONTINUOUS_RESIDENCE_THRESHOLDS - Trip risk thresholds
- LPR_ABANDONMENT_THRESHOLDS - Green card risk levels
- REENTRY_PERMIT_RULES - Permit protection periods
- EARLY_FILING_WINDOW_DAYS - N-400 filing window
- All urgency/threshold constants - Priority calculations

### Sorting and Prioritization

- PRIORITY_SORT_ORDER - UI list ordering
- COMPLIANCE_TYPE_SORT_ORDER - Type precedence
- PRIORITY_LEVEL - Urgency classification

### Date/Time Operations

- MILLISECONDS - Time conversions
- DAY_OF_WEEK - Calendar operations
- MONTH_INDEX - Month references
- DC_EMANCIPATION_DAY - Tax deadline adjustments
- TAX_FILING - IRS deadline dates

### Configuration

- TRAVEL_BUDGET_BUFFERS - Safety margins
- CONFIDENCE_THRESHOLDS - Projection confidence
- ANNUAL_SUMMARY_CONFIG - Report settings
- DEFAULT_VALUES - Fallback values

---

This comprehensive reference provides:

- Complete constant definitions with exact values
- Purpose and usage context for each constant
- TypeScript type mappings
- Multiple ways to find constants (by category, alphabetically, by usage)
- Clear relationships between related constants

Use this document as your primary reference for understanding business rules, thresholds, and configuration values throughout the USA Presence Calculator shared package.
