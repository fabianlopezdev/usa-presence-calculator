/**
 * Helper functions for compliance calculations
 */

// External dependencies
// None needed - using internal utilities

// Internal dependencies - Schemas & Types
import {
  GreenCardRenewalStatus,
  RemovalOfConditionsStatus,
  SelectiveServiceStatus,
  TaxReminderStatus,
} from '@schemas/compliance';
import {
  ActiveComplianceItem,
  PriorityComplianceItem,
  UpcomingDeadline,
} from '@schemas/compliance-helpers';

// Internal dependencies - Constants
import {
  GREEN_CARD_RENEWAL_STATUS,
  REMOVAL_CONDITIONS_STATUS,
  COMPLIANCE_PRIORITY_MESSAGES,
  COMPLIANCE_DEADLINE_DESCRIPTIONS,
  COMPLIANCE_ITEM_TYPE,
} from '@constants/compliance';
import {
  PRIORITY_LEVEL,
  PRIORITY_SORT_ORDER,
  COMPLIANCE_TYPE_SORT_ORDER,
  TAX_FILING_THRESHOLDS_DAYS,
} from '@constants/priority-urgency';
import { MILLISECONDS } from '@constants/date-time';

// Internal dependencies - Utilities
import { parseDate } from '@utils/date-helpers';

/**
 * Determine green card renewal urgency
 */
export function determineGreenCardRenewalUrgency(
  status: GreenCardRenewalStatus['currentStatus'],
): ActiveComplianceItem['urgency'] {
  switch (status) {
    case GREEN_CARD_RENEWAL_STATUS.EXPIRED:
      return PRIORITY_LEVEL.CRITICAL;
    case GREEN_CARD_RENEWAL_STATUS.RENEWAL_URGENT:
      return PRIORITY_LEVEL.HIGH;
    case GREEN_CARD_RENEWAL_STATUS.RENEWAL_RECOMMENDED:
      return PRIORITY_LEVEL.MEDIUM;
    default:
      return PRIORITY_LEVEL.LOW;
  }
}

/**
 * Determine tax filing urgency
 */
export function determineTaxFilingUrgency(
  daysUntilDeadline: number,
  isAbroad: boolean,
): ActiveComplianceItem['urgency'] {
  if (daysUntilDeadline <= TAX_FILING_THRESHOLDS_DAYS.CRITICAL_URGENCY)
    return PRIORITY_LEVEL.CRITICAL;
  if (
    daysUntilDeadline <= TAX_FILING_THRESHOLDS_DAYS.HIGH_URGENCY ||
    (daysUntilDeadline <= TAX_FILING_THRESHOLDS_DAYS.PRIORITY_ITEM_THRESHOLD && isAbroad)
  )
    return PRIORITY_LEVEL.HIGH;
  if (daysUntilDeadline <= TAX_FILING_THRESHOLDS_DAYS.PRIORITY_ITEM_THRESHOLD)
    return PRIORITY_LEVEL.MEDIUM;
  return PRIORITY_LEVEL.LOW;
}

/**
 * Get removal of conditions priority item if applicable
 */
export function getRemovalOfConditionsPriorityItem(
  status: RemovalOfConditionsStatus,
): PriorityComplianceItem | null {
  if (!status.applies || status.currentStatus !== REMOVAL_CONDITIONS_STATUS.OVERDUE) {
    return null;
  }

  return {
    type: COMPLIANCE_ITEM_TYPE.REMOVAL_CONDITIONS,
    description: COMPLIANCE_PRIORITY_MESSAGES.REMOVAL_CONDITIONS_OVERDUE,
    deadline: status.filingWindowEnd,
    priority: PRIORITY_LEVEL.CRITICAL,
  };
}

/**
 * Get green card renewal priority item if applicable
 */
export function getGreenCardRenewalPriorityItem(
  status: GreenCardRenewalStatus,
): PriorityComplianceItem | null {
  if (
    status.currentStatus !== GREEN_CARD_RENEWAL_STATUS.RENEWAL_URGENT &&
    status.currentStatus !== GREEN_CARD_RENEWAL_STATUS.EXPIRED
  ) {
    return null;
  }

  return {
    type: COMPLIANCE_ITEM_TYPE.GREEN_CARD_RENEWAL,
    description:
      status.currentStatus === GREEN_CARD_RENEWAL_STATUS.EXPIRED
        ? COMPLIANCE_PRIORITY_MESSAGES.GREEN_CARD_EXPIRED
        : COMPLIANCE_PRIORITY_MESSAGES.GREEN_CARD_EXPIRING_SOON,
    deadline: status.expirationDate,
    priority:
      status.currentStatus === GREEN_CARD_RENEWAL_STATUS.EXPIRED
        ? PRIORITY_LEVEL.CRITICAL
        : PRIORITY_LEVEL.HIGH,
  };
}

/**
 * Get selective service priority item if applicable
 */
export function getSelectiveServicePriorityItem(
  status: SelectiveServiceStatus,
): PriorityComplianceItem | null {
  if (!status.applies || !status.registrationRequired || !status.registrationDeadline) {
    return null;
  }

  return {
    type: COMPLIANCE_ITEM_TYPE.SELECTIVE_SERVICE,
    description: COMPLIANCE_PRIORITY_MESSAGES.SELECTIVE_SERVICE_REQUIRED,
    deadline: status.registrationDeadline,
    priority: PRIORITY_LEVEL.HIGH,
  };
}

/**
 * Get tax filing priority item if applicable
 */
export function getTaxFilingPriorityItem(status: TaxReminderStatus): PriorityComplianceItem | null {
  if (
    status.reminderDismissed ||
    status.daysUntilDeadline > TAX_FILING_THRESHOLDS_DAYS.PRIORITY_ITEM_THRESHOLD ||
    !status.isAbroadDuringTaxSeason
  ) {
    return null;
  }

  return {
    type: COMPLIANCE_ITEM_TYPE.TAX_FILING,
    description: COMPLIANCE_PRIORITY_MESSAGES.TAX_FILING_ABROAD_WARNING,
    deadline: status.nextDeadline,
    priority: PRIORITY_LEVEL.HIGH,
  };
}

/**
 * Sort priority items by urgency and deadline
 */
export function sortPriorityItems(items: PriorityComplianceItem[]): PriorityComplianceItem[] {
  return items.sort((a, b) => {
    const priorityDiff = PRIORITY_SORT_ORDER[a.priority] - PRIORITY_SORT_ORDER[b.priority];

    if (priorityDiff !== 0) return priorityDiff;

    // If same priority, sort by deadline
    const deadlineDiff = parseDate(a.deadline).getTime() - parseDate(b.deadline).getTime();
    if (deadlineDiff !== 0) return deadlineDiff;

    // If same deadline, use compliance type sort order
    return COMPLIANCE_TYPE_SORT_ORDER[a.type] - COMPLIANCE_TYPE_SORT_ORDER[b.type];
  });
}

/**
 * Get removal of conditions deadline as UpcomingDeadline object if applicable
 */
export function getRemovalOfConditionsUpcomingDeadline(
  status: RemovalOfConditionsStatus,
): UpcomingDeadline | null {
  if (!status.applies || status.daysUntilDeadline === null || status.daysUntilDeadline < 0) {
    return null;
  }

  return {
    type: COMPLIANCE_ITEM_TYPE.REMOVAL_CONDITIONS,
    description: COMPLIANCE_DEADLINE_DESCRIPTIONS.REMOVAL_CONDITIONS,
    date: status.filingWindowEnd,
    daysRemaining: status.daysUntilDeadline,
  };
}

/**
 * Get green card expiration deadline
 */
export function getGreenCardExpirationDeadline(
  status: GreenCardRenewalStatus,
  current: Date,
): UpcomingDeadline | null {
  const expiration = parseDate(status.expirationDate);

  if (expiration.getTime() <= current.getTime()) {
    return null;
  }

  return {
    type: COMPLIANCE_ITEM_TYPE.GREEN_CARD_RENEWAL,
    description: COMPLIANCE_DEADLINE_DESCRIPTIONS.GREEN_CARD_EXPIRY,
    date: status.expirationDate,
    daysRemaining: Math.floor((expiration.getTime() - current.getTime()) / MILLISECONDS.PER_DAY),
  };
}

/**
 * Get selective service registration deadline
 */
export function getSelectiveServiceDeadline(
  status: SelectiveServiceStatus,
  current: Date,
): UpcomingDeadline | null {
  if (!status.registrationDeadline || !status.registrationRequired) {
    return null;
  }

  const deadline = parseDate(status.registrationDeadline);

  if (deadline.getTime() <= current.getTime()) {
    return null;
  }

  return {
    type: COMPLIANCE_ITEM_TYPE.SELECTIVE_SERVICE,
    description: COMPLIANCE_DEADLINE_DESCRIPTIONS.SELECTIVE_SERVICE_REGISTRATION,
    date: status.registrationDeadline,
    daysRemaining: Math.floor((deadline.getTime() - current.getTime()) / MILLISECONDS.PER_DAY),
  };
}

/**
 * Get tax filing deadline
 */
export function getTaxFilingDeadline(
  status: TaxReminderStatus,
  current: Date,
): UpcomingDeadline | null {
  if (status.reminderDismissed) {
    return null;
  }

  const deadline = parseDate(status.nextDeadline);

  if (deadline.getTime() <= current.getTime()) {
    return null;
  }

  return {
    type: COMPLIANCE_ITEM_TYPE.TAX_FILING,
    description: COMPLIANCE_DEADLINE_DESCRIPTIONS.TAX_FILING,
    date: status.nextDeadline,
    daysRemaining: status.daysUntilDeadline,
  };
}
