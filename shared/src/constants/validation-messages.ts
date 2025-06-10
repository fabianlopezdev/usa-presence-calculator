/**
 * Centralized validation messages for consistency and maintainability
 *
 * Benefits:
 * - Single source of truth for all user-facing messages
 * - Easy to update messaging across the entire app
 * - Supports future internationalization (i18n)
 * - Ensures consistent tone and formatting
 */

// Date validation messages
export const DATE_VALIDATION = {
  INVALID_FORMAT: 'Date must be in YYYY-MM-DD format',
  RETURN_BEFORE_DEPARTURE: 'Return date must be after or equal to departure date',
} as const;

// Presence calculation messages
export const PRESENCE_VALIDATION = {
  INVALID_INPUT: 'Invalid input for presence calculation',
  INVALID_ELIGIBILITY_DATES: 'Invalid input for eligibility dates calculation',
  INVALID_STATUS: 'Invalid input for presence status calculation',
  INVALID_CONTINUOUS_RESIDENCE: 'Invalid input for continuous residence check',
  INVALID_EARLY_FILING: 'Invalid input for early filing eligibility check',
  UNKNOWN_ERROR: 'Unknown error during presence calculation',
  UNKNOWN_ERROR_ELIGIBILITY: 'Unknown error during eligibility dates calculation',
  UNKNOWN_ERROR_STATUS: 'Unknown error during presence status calculation',
  UNKNOWN_ERROR_CONTINUOUS: 'Unknown error during continuous residence check',
  UNKNOWN_ERROR_EARLY_FILING: 'Unknown error during early filing eligibility check',
} as const;

// Travel risk messages
export const TRAVEL_RISK_VALIDATION = {
  INVALID_ASSESSMENT: 'Invalid input for trip risk assessment',
  UNKNOWN_ERROR: 'Unknown error during trip risk assessment',
} as const;

// LPR status messages
export const LPR_STATUS_VALIDATION = {
  INVALID_INPUT: 'Invalid input for LPR risk assessment',
  INVALID_ADVANCED: 'Invalid input for advanced LPR risk assessment',
  INVALID_MAX_DURATION: 'Invalid input for maximum trip duration calculation',
  UNKNOWN_ERROR: 'Unknown error during LPR risk assessment',
  UNKNOWN_ERROR_ADVANCED: 'Unknown error during advanced LPR risk assessment',
  UNKNOWN_ERROR_MAX_DURATION: 'Unknown error during maximum trip duration calculation',
  UNKNOWN_ERROR_GREEN_CARD_RISK: 'Unknown error during green card risk calculation',
} as const;

// Compliance messages
export const COMPLIANCE_VALIDATION = {
  INVALID_REMOVAL_CONDITIONS: 'Invalid input for removal of conditions calculation',
  INVALID_GREEN_CARD_RENEWAL: 'Invalid input for green card renewal calculation',
  INVALID_SELECTIVE_SERVICE: 'Invalid input for selective service calculation',
  INVALID_TAX_REMINDER: 'Invalid input for tax reminder calculation',
  INVALID_COMPREHENSIVE: 'Invalid input for comprehensive compliance calculation',
  UNKNOWN_ERROR: 'Unknown error during compliance calculation',
} as const;

// Travel analytics messages
export const ANALYTICS_VALIDATION = {
  INVALID_INPUT: 'Invalid input for travel analytics calculation',
  UNKNOWN_ERROR: 'Unknown error during travel analytics calculation',
} as const;

// Trip calculation messages
export const TRIP_VALIDATION = {
  INVALID_DURATION: 'Invalid input for trip duration calculation',
  INVALID_OVERLAP: 'Invalid input for trips overlap check',
  INVALID_RANGE: 'Invalid input for trips in range',
  UNKNOWN_ERROR: 'Unknown error during trip calculation',
} as const;
