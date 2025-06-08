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
  CRITICAL: 365, // 1 year or more breaks continuous residence
  HIGH_RISK: 180, // 6 months or more creates presumption of breaking residence
  MEDIUM_RISK: 150, // Approaching the 6-month threshold
} as const;

// Early filing window (in days before eligibility)
export const EARLY_FILING_WINDOW_DAYS = 90;
