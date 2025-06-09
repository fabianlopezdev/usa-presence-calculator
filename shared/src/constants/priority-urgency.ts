/**
 * Priority and Urgency Constants
 *
 * Defines priority levels, urgency thresholds, and sort orders
 * used across the compliance tracking system to determine
 * which items need immediate attention.
 */

// ============================================================================
// PRIORITY LEVELS
// ============================================================================

/**
 * Priority Levels for Compliance Items
 * Used to categorize the urgency of required actions
 */
export const PRIORITY_LEVEL = {
  /** Immediate action required - risk of serious consequences */
  CRITICAL: 'critical',
  /** Urgent action needed - approaching critical deadlines */
  HIGH: 'high',
  /** Action recommended soon - within normal timeframes */
  MEDIUM: 'medium',
  /** Action can be planned - plenty of time available */
  LOW: 'low',
  /** No priority assigned */
  NONE: 'none',
} as const;

// ============================================================================
// TIME THRESHOLDS
// ============================================================================

/**
 * Tax Filing Time Thresholds (in days)
 * Determines when tax reminders become active or urgent
 */
export const TAX_FILING_THRESHOLDS_DAYS = {
  /** Show as active compliance item */
  ACTIVE_ITEM_THRESHOLD: 45,
  /** Elevate to priority status */
  PRIORITY_ITEM_THRESHOLD: 30,
  /** Mark as critical urgency */
  CRITICAL_URGENCY: 7,
  /** Mark as high urgency */
  HIGH_URGENCY: 14,
} as const;

/**
 * Green Card Renewal Time Thresholds (in months)
 * Determines urgency levels for green card renewal
 */
export const GREEN_CARD_RENEWAL_THRESHOLDS_MONTHS = {
  /** Urgent renewal needed */
  URGENT_THRESHOLD: 2,
  /** Medium priority renewal */
  MEDIUM_THRESHOLD: 4,
  /** Low priority - just entered renewal window */
  LOW_THRESHOLD: 6,
} as const;

/**
 * Removal of Conditions Urgency Thresholds (in days)
 * For determining urgency of I-751 filing
 */
export const REMOVAL_CONDITIONS_URGENCY_DAYS = {
  /** Critical - very close to deadline */
  CRITICAL: 7,
  /** High - less than 2 weeks */
  HIGH: 14,
  /** Medium - less than 30 days */
  MEDIUM: 30,
  /** Low - more than 30 days */
  LOW: 60,
} as const;

/**
 * Selective Service Urgency Thresholds (in days)
 * Based on registration deadline after 18th birthday
 */
export const SELECTIVE_SERVICE_URGENCY_DAYS = {
  /** Must register immediately */
  CRITICAL: 7,
  /** Register very soon */
  HIGH: 14,
  /** Register soon */
  MEDIUM: 20,
} as const;

// ============================================================================
// SORT ORDERS
// ============================================================================

/**
 * Priority Level Sort Order
 * Lower numbers appear first (higher priority)
 */
export const PRIORITY_SORT_ORDER = {
  [PRIORITY_LEVEL.CRITICAL]: 0,
  [PRIORITY_LEVEL.HIGH]: 1,
  [PRIORITY_LEVEL.MEDIUM]: 2,
  [PRIORITY_LEVEL.LOW]: 3,
  [PRIORITY_LEVEL.NONE]: 4,
} as const;

/**
 * Compliance Type Sort Order
 * Determines order when priorities are equal
 */
export const COMPLIANCE_TYPE_SORT_ORDER = {
  green_card_renewal: 0, // Most important - affects legal status
  removal_of_conditions: 1, // Critical for conditional residents
  selective_service: 2, // Important for naturalization
  tax_filing: 3, // Annual requirement
} as const;

// ============================================================================
// COMPOSITE THRESHOLDS
// ============================================================================

/**
 * Consolidated Priority Thresholds
 * Groups all thresholds by compliance type for easier access
 */
export const PRIORITY_THRESHOLDS = {
  TAX_FILING: {
    ACTIVE_DAYS: TAX_FILING_THRESHOLDS_DAYS.ACTIVE_ITEM_THRESHOLD,
    PRIORITY_DAYS: TAX_FILING_THRESHOLDS_DAYS.PRIORITY_ITEM_THRESHOLD,
    CRITICAL_DAYS: TAX_FILING_THRESHOLDS_DAYS.CRITICAL_URGENCY,
    HIGH_DAYS: TAX_FILING_THRESHOLDS_DAYS.HIGH_URGENCY,
  },
  GREEN_CARD_RENEWAL: {
    URGENT_MONTHS: GREEN_CARD_RENEWAL_THRESHOLDS_MONTHS.URGENT_THRESHOLD,
    MEDIUM_MONTHS: GREEN_CARD_RENEWAL_THRESHOLDS_MONTHS.MEDIUM_THRESHOLD,
    LOW_MONTHS: GREEN_CARD_RENEWAL_THRESHOLDS_MONTHS.LOW_THRESHOLD,
  },
  REMOVAL_CONDITIONS: {
    CRITICAL_DAYS: REMOVAL_CONDITIONS_URGENCY_DAYS.CRITICAL,
    HIGH_DAYS: REMOVAL_CONDITIONS_URGENCY_DAYS.HIGH,
    MEDIUM_DAYS: REMOVAL_CONDITIONS_URGENCY_DAYS.MEDIUM,
    LOW_DAYS: REMOVAL_CONDITIONS_URGENCY_DAYS.LOW,
  },
  SELECTIVE_SERVICE: {
    CRITICAL_DAYS: SELECTIVE_SERVICE_URGENCY_DAYS.CRITICAL,
    HIGH_DAYS: SELECTIVE_SERVICE_URGENCY_DAYS.HIGH,
    MEDIUM_DAYS: SELECTIVE_SERVICE_URGENCY_DAYS.MEDIUM,
  },
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type PriorityLevel = (typeof PRIORITY_LEVEL)[keyof typeof PRIORITY_LEVEL];
