/**
 * Helper functions for compliance calculations
 */

// External dependencies
import { parseISO } from 'date-fns';

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

/**
 * Determine green card renewal urgency
 */
export function determineGreenCardRenewalUrgency(
  status: GreenCardRenewalStatus['currentStatus'],
): ActiveComplianceItem['urgency'] {
  switch (status) {
    case 'expired':
      return 'critical';
    case 'renewal_urgent':
      return 'high';
    case 'renewal_recommended':
      return 'medium';
    default:
      return 'low';
  }
}

/**
 * Determine tax filing urgency
 */
export function determineTaxFilingUrgency(
  daysUntilDeadline: number,
  isAbroad: boolean,
): ActiveComplianceItem['urgency'] {
  if (daysUntilDeadline <= 7) return 'critical';
  if (daysUntilDeadline <= 14 || (daysUntilDeadline <= 30 && isAbroad)) return 'high';
  if (daysUntilDeadline <= 30) return 'medium';
  return 'low';
}

/**
 * Get removal of conditions priority item if applicable
 */
export function getRemovalOfConditionsPriorityItem(
  status: RemovalOfConditionsStatus,
): PriorityComplianceItem | null {
  if (!status.applies || status.currentStatus !== 'overdue') {
    return null;
  }

  return {
    type: 'removal_of_conditions',
    description: 'Overdue: File Form I-751 immediately',
    deadline: status.filingWindowEnd,
    priority: 'critical',
  };
}

/**
 * Get green card renewal priority item if applicable
 */
export function getGreenCardRenewalPriorityItem(
  status: GreenCardRenewalStatus,
): PriorityComplianceItem | null {
  if (status.currentStatus !== 'renewal_urgent' && status.currentStatus !== 'expired') {
    return null;
  }

  return {
    type: 'green_card_renewal',
    description:
      status.currentStatus === 'expired'
        ? 'Green card expired - renew immediately'
        : 'Green card expiring soon - renew urgently',
    deadline: status.expirationDate,
    priority: status.currentStatus === 'expired' ? 'critical' : 'high',
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
    type: 'selective_service',
    description: 'Must register with Selective Service',
    deadline: status.registrationDeadline,
    priority: 'high',
  };
}

/**
 * Get tax filing priority item if applicable
 */
export function getTaxFilingPriorityItem(status: TaxReminderStatus): PriorityComplianceItem | null {
  if (
    status.reminderDismissed ||
    status.daysUntilDeadline > 30 ||
    !status.isAbroadDuringTaxSeason
  ) {
    return null;
  }

  return {
    type: 'tax_filing',
    description: 'File taxes - you will be abroad during deadline',
    deadline: status.nextDeadline,
    priority: 'high',
  };
}

/**
 * Sort priority items by urgency and deadline
 */
export function sortPriorityItems(items: PriorityComplianceItem[]): PriorityComplianceItem[] {
  return items.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];

    if (priorityDiff !== 0) return priorityDiff;

    // If same priority, sort by deadline
    const deadlineDiff = parseISO(a.deadline).getTime() - parseISO(b.deadline).getTime();
    if (deadlineDiff !== 0) return deadlineDiff;

    // If same deadline, prioritize green card renewal over other types
    const typeOrder = {
      green_card_renewal: 0,
      removal_of_conditions: 1,
      selective_service: 2,
      tax_filing: 3,
    };
    return typeOrder[a.type] - typeOrder[b.type];
  });
}

/**
 * Get removal of conditions deadline if applicable
 */
export function getRemovalOfConditionsDeadline(
  status: RemovalOfConditionsStatus,
): UpcomingDeadline | null {
  if (!status.applies || status.daysUntilDeadline === null || status.daysUntilDeadline < 0) {
    return null;
  }

  return {
    type: 'removal_of_conditions',
    description: 'Remove conditions on residence',
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
  const expiration = parseISO(status.expirationDate);

  if (expiration.getTime() <= current.getTime()) {
    return null;
  }

  return {
    type: 'green_card_renewal',
    description: 'Green card expires',
    date: status.expirationDate,
    daysRemaining: Math.floor((expiration.getTime() - current.getTime()) / (1000 * 60 * 60 * 24)),
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

  const deadline = parseISO(status.registrationDeadline);

  if (deadline.getTime() <= current.getTime()) {
    return null;
  }

  return {
    type: 'selective_service',
    description: 'Register with Selective Service',
    date: status.registrationDeadline,
    daysRemaining: Math.floor((deadline.getTime() - current.getTime()) / (1000 * 60 * 60 * 24)),
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

  const deadline = parseISO(status.nextDeadline);

  if (deadline.getTime() <= current.getTime()) {
    return null;
  }

  return {
    type: 'tax_filing',
    description: 'File US tax return',
    date: status.nextDeadline,
    daysRemaining: status.daysUntilDeadline,
  };
}
