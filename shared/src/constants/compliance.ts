/**
 * Compliance-related constants for LPR tracking
 *
 * These constants define statuses, types, and messages used throughout
 * the compliance calculation modules. They serve as the single source
 * of truth for all compliance-related string values.
 */

// ============================================================================
// STATUS CONSTANTS
// ============================================================================

/**
 * Removal of Conditions (Form I-751) Status Values
 * Used to track the filing status for conditional residents
 */
export const REMOVAL_CONDITIONS_STATUS = {
  /** Before the 90-day filing window opens */
  NOT_YET: 'not_yet',
  /** Within the 90-day filing window */
  IN_WINDOW: 'in_window',
  /** Form I-751 has been filed */
  FILED: 'filed',
  /** USCIS has approved the petition */
  APPROVED: 'approved',
  /** Past the filing deadline without filing */
  OVERDUE: 'overdue',
} as const;

/**
 * Green Card Renewal Status Values
 * Tracks the renewal status of permanent resident cards
 */
export const GREEN_CARD_RENEWAL_STATUS = {
  /** Card is valid with 6+ months remaining */
  VALID: 'valid',
  /** Within 6-month renewal window */
  RENEWAL_RECOMMENDED: 'renewal_recommended',
  /** Less than 2 months until expiration */
  RENEWAL_URGENT: 'renewal_urgent',
  /** Card has already expired */
  EXPIRED: 'expired',
} as const;

/**
 * Selective Service Registration Status Values
 * For male residents aged 18-26
 */
export const SELECTIVE_SERVICE_STATUS = {
  /** Not male or outside age range */
  NOT_APPLICABLE: 'not_applicable',
  /** Required to register but hasn't yet */
  MUST_REGISTER: 'must_register',
  /** Successfully registered */
  REGISTERED: 'registered',
  /** Over 26 years old, no longer required */
  AGED_OUT: 'aged_out',
} as const;

/**
 * Tax Filing Deadline Types
 * Different deadline scenarios for tax filing
 */
export const TAX_DEADLINE_TYPE = {
  /** Standard April 15 deadline */
  STANDARD: 'standard',
  /** Automatic June 15 extension for those abroad */
  ABROAD_EXTENSION: 'abroad_extension',
  /** October 15 extension with Form 4868 */
  OCTOBER_EXTENSION: 'october_extension',
} as const;

// ============================================================================
// TYPE CONSTANTS
// ============================================================================

/**
 * Compliance Item Types
 * Used to identify different compliance requirements
 */
export const COMPLIANCE_ITEM_TYPE = {
  REMOVAL_CONDITIONS: 'removal_of_conditions',
  GREEN_CARD_RENEWAL: 'green_card_renewal',
  SELECTIVE_SERVICE: 'selective_service',
  TAX_FILING: 'tax_filing',
} as const;

/**
 * Gender Values
 * Used for selective service determination
 */
export const GENDER = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
} as const;

// ============================================================================
// USER-FACING MESSAGES
// ============================================================================

/**
 * Active Item Description Messages
 * Shown when user needs to take action on compliance items
 */
export const COMPLIANCE_ACTIVE_ITEM_MESSAGES = {
  REMOVAL_CONDITIONS: 'File Form I-751 to remove conditions on residence',
  GREEN_CARD_RENEWAL: 'Renew your green card',
  SELECTIVE_SERVICE: 'Register with Selective Service System',
  TAX_FILING: 'File your US tax return',
} as const;

/**
 * Priority Item Description Messages
 * Shown for urgent compliance matters requiring immediate attention
 */
export const COMPLIANCE_PRIORITY_MESSAGES = {
  REMOVAL_CONDITIONS_OVERDUE: 'Overdue: File Form I-751 immediately',
  GREEN_CARD_EXPIRED: 'Green card expired - renew immediately',
  GREEN_CARD_EXPIRING_SOON: 'Green card expiring soon - renew urgently',
  SELECTIVE_SERVICE_REQUIRED: 'Must register with Selective Service',
  TAX_FILING_ABROAD_WARNING: 'File taxes - you will be abroad during deadline',
} as const;

/**
 * Deadline Description Messages
 * Used in deadline listings and notifications
 */
export const COMPLIANCE_DEADLINE_DESCRIPTIONS = {
  REMOVAL_CONDITIONS: 'Remove conditions on residence',
  GREEN_CARD_EXPIRY: 'Green card expires',
  SELECTIVE_SERVICE_REGISTRATION: 'Register with Selective Service',
  TAX_FILING: 'File US tax return',
} as const;

// ============================================================================
// FORM NAMES
// ============================================================================

/**
 * Official USCIS and IRS Form Names
 */
export const GOVERNMENT_FORM_NAMES = {
  REMOVAL_CONDITIONS: 'Form I-751',
  TAX_EXTENSION: 'Form 4868',
} as const;

// ============================================================================
// TAX-SPECIFIC MESSAGES
// ============================================================================

/**
 * Tax Extension Deadline Display Strings
 */
export const TAX_EXTENSION_DEADLINE_DISPLAY = {
  JUNE: 'June 15',
  OCTOBER: 'October 15',
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Export types for TypeScript inference
export type RemovalConditionsStatusType =
  (typeof REMOVAL_CONDITIONS_STATUS)[keyof typeof REMOVAL_CONDITIONS_STATUS];
export type GreenCardRenewalStatusType =
  (typeof GREEN_CARD_RENEWAL_STATUS)[keyof typeof GREEN_CARD_RENEWAL_STATUS];
export type SelectiveServiceStatusType =
  (typeof SELECTIVE_SERVICE_STATUS)[keyof typeof SELECTIVE_SERVICE_STATUS];
export type TaxDeadlineType = (typeof TAX_DEADLINE_TYPE)[keyof typeof TAX_DEADLINE_TYPE];
export type ComplianceItemType = (typeof COMPLIANCE_ITEM_TYPE)[keyof typeof COMPLIANCE_ITEM_TYPE];
export type Gender = (typeof GENDER)[keyof typeof GENDER];
