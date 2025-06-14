/**
 * USCIS (United States Citizenship and Immigration Services) rule constants
 * These values are based on official USCIS naturalization requirements
 */

// Physical presence requirements (in days)
export const PHYSICAL_PRESENCE_REQUIREMENTS = {
  FIVE_YEAR_PATH: 913, // 2.5 years out of 5 years
  THREE_YEAR_PATH: 548, // 1.5 years out of 3 years
} as const;

// Continuous residence requirements (in years)
export const CONTINUOUS_RESIDENCE_REQUIREMENTS = {
  FIVE_YEAR_PATH: 5,
  THREE_YEAR_PATH: 3,
} as const;

// Continuous residence trip duration thresholds (in days)
export const CONTINUOUS_RESIDENCE_THRESHOLDS = {
  RESETS_CLOCK: 365, // 1 year or more breaks continuous residence
  CRITICAL: 365, // 1 year or more breaks continuous residence
  HIGH_RISK: 180, // 6 months or more creates presumption of breaking residence
  MEDIUM_RISK: 150, // Approaching the 6-month threshold
  LOW_RISK: 90, // Low risk threshold
} as const;

// LPR (Lawful Permanent Resident) status abandonment thresholds (in days)
export const LPR_ABANDONMENT_THRESHOLDS = {
  AUTOMATIC_LOSS: 365, // 1 year or more without reentry permit = automatic loss of green card
  HIGH_RISK: 330, // Approaching 1 year, urgent warning needed
  CRITICAL: 270, // Critical risk level
  SEVERE: 210, // Severe risk level
  PRESUMPTION_OF_ABANDONMENT: 180, // Creates rebuttable presumption of abandonment
  WARNING: 150, // Early warning to plan return
} as const;

// Reentry permit protection rules
export const REENTRY_PERMIT_RULES = {
  MAXIMUM_PROTECTION_DAYS: 730, // 2 years maximum with reentry permit
  WARNING_BEFORE_EXPIRY_DAYS: 60, // Warn 60 days before permit expires
  APPROACHING_LIMIT_DAYS: 670, // Warn when approaching 2-year limit
} as const;

// Comprehensive risk warning thresholds for notifications
export const RISK_WARNING_THRESHOLDS = {
  CONTINUOUS_RESIDENCE: {
    APPROACHING: 150, // "Plan your return to protect continuous residence"
    AT_RISK: 180, // "May reset citizenship eligibility timeline"
    BROKEN: 365, // "Continuous residence has been broken"
  },
  LPR_STATUS: {
    EARLY_WARNING: 150, // "Extended absence - maintain US ties"
    APPROACHING_RISK: 330, // "Green card at risk - return soon"
    CRITICAL: 365, // "Risk of losing permanent resident status"
  },
} as const;

// Early filing window (in days before eligibility)
export const EARLY_FILING_WINDOW_DAYS = 90;

// Removal of Conditions (Form I-751) Constants
export const REMOVAL_OF_CONDITIONS = {
  FILING_WINDOW_DAYS: 90, // Can file 90 days before 2-year anniversary
  CONDITIONAL_PERIOD_DAYS: 730, // 2 years (365 * 2)
  CONDITIONAL_PERIOD_YEARS: 2, // Conditional resident period duration
} as const;

// Document Renewal Constants
export const DOCUMENT_RENEWAL = {
  GREEN_CARD_VALIDITY_YEARS: 10,
  RENEWAL_WINDOW_MONTHS: 6, // Recommend renewal 6 months before expiration
} as const;

// Selective Service Constants
export const SELECTIVE_SERVICE = {
  MIN_AGE: 18,
  MAX_AGE: 26,
  GENDER_REQUIRED: 'male' as const,
  REGISTRATION_GRACE_PERIOD_DAYS: 30, // 30 days after 18th birthday to register
} as const;

// Tax Filing Constants
export const TAX_FILING = {
  DEADLINE_MONTH: '04', // April
  DEADLINE_DAY: '15',
  SEASON_START_MONTH: '01', // January (IRS starts accepting returns)
  SEASON_START_DAY: '23', // Typically late January
  ABROAD_EXTENSION_MONTH: '06', // June
  ABROAD_EXTENSION_DAY: '15', // Automatic 2-month extension for those abroad
  OCTOBER_EXTENSION_MONTH: '10', // October
  OCTOBER_EXTENSION_DAY: '15', // Extension with Form 4868
} as const;
