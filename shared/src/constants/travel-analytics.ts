/**
 * Travel analytics constants for risk assessment and projections
 */

// Travel budget risk assessment buffers (in days)
export const TRAVEL_BUDGET_BUFFERS = {
  WARNING: 30, // Critical buffer for emergency travel
  CAUTION: 90, // Reasonable buffer for planned travel
} as const;

// Confidence level calculation thresholds
export const CONFIDENCE_THRESHOLDS = {
  // Variance thresholds (in days squared)
  HIGH_VARIANCE: 900, // 30 days standard deviation
  MEDIUM_VARIANCE: 400, // 20 days standard deviation

  // Minimum data requirements
  MINIMUM_YEARS_FOR_HIGH_CONFIDENCE: 3,
} as const;

// Travel trend analysis thresholds
export const TRAVEL_TREND_THRESHOLDS = {
  SIGNIFICANT_CHANGE_DAYS: 20, // Days difference to consider a meaningful change
} as const;

// Default values for projections
export const PROJECTION_DEFAULTS = {
  FAR_FUTURE_DATE: '2099-12-31', // Used when eligibility is impossible
} as const;

// Risk assessment messages
export const RISK_MESSAGES = {
  CONTINUOUS_RESIDENCE: {
    CRITICAL: 'This trip would break continuous residence and reset your naturalization timeline',
    HIGH: 'This trip creates a presumption of breaking continuous residence',
    MEDIUM: 'This trip approaches the continuous residence warning threshold',
  },
  PHYSICAL_PRESENCE: {
    EXCEEDED: 'This trip would exceed your safe travel budget for maintaining physical presence',
  },
  SAFE: 'This trip poses minimal risk to your naturalization timeline',
} as const;

// Risk recommendations
export const RISK_RECOMMENDATIONS = {
  CONTINUOUS_RESIDENCE: {
    CRITICAL: 'Cancel or significantly shorten this trip to maintain eligibility',
    HIGH: 'Shorten trip to under 180 days and prepare documentation to prove ties to USA',
    MEDIUM: 'Consider shortening trip to maintain a safety buffer',
  },
  PHYSICAL_PRESENCE: {
    EXCEEDED: 'Postpone or shorten this trip to ensure eligibility requirements are met',
  },
  SAFE: 'Trip appears safe for naturalization requirements',
} as const;

// Travel budget recommendations
export const BUDGET_RECOMMENDATIONS = {
  WARNING:
    'Minimize travel to ensure eligibility requirements are met. Consider postponing non-essential trips.',
  CAUTION: 'Travel carefully and track all trips precisely. Avoid extended international travel.',
  SAFE: 'You have a comfortable travel budget remaining. Continue tracking all trips accurately.',
} as const;

// Annual summary configuration
export const ANNUAL_SUMMARY_CONFIG = {
  TOP_DESTINATIONS_LIMIT: 5, // Number of top destinations to show in summary
} as const;

// Time period constants
export const TIME_PERIODS = {
  DAYS_IN_YEAR: 365, // Standard days in a year for calculations
} as const;

// Default values
export const DEFAULT_VALUES = {
  UNKNOWN_LOCATION: 'Unknown', // Default location when trip location is missing
} as const;
