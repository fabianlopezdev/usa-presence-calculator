/**
 * Helper functions for active compliance items
 */

// Internal dependencies - Schemas & Types
import {
  GreenCardRenewalStatus,
  RemovalOfConditionsStatus,
  SelectiveServiceStatus,
  TaxReminderStatus,
} from '@schemas/compliance';
import { ActiveComplianceItem } from '@schemas/compliance-helpers';

// Internal dependencies - Business Logic
import {
  determineGreenCardRenewalUrgency,
  determineTaxFilingUrgency,
} from '@business-logic/calculations/compliance/compliance-helpers';

/**
 * Get active removal of conditions item
 */
export function getActiveRemovalOfConditionsItem(
  status: RemovalOfConditionsStatus,
): ActiveComplianceItem | null {
  if (
    !status.applies ||
    (status.currentStatus !== 'in_window' && status.currentStatus !== 'overdue')
  ) {
    return null;
  }

  return {
    type: 'removal_of_conditions',
    description: 'File Form I-751 to remove conditions on residence',
    urgency: status.currentStatus === 'overdue' ? 'critical' : 'high',
  };
}

/**
 * Get active green card renewal item
 */
export function getActiveGreenCardRenewalItem(
  status: GreenCardRenewalStatus,
): ActiveComplianceItem | null {
  if (
    status.currentStatus !== 'renewal_recommended' &&
    status.currentStatus !== 'renewal_urgent' &&
    status.currentStatus !== 'expired'
  ) {
    return null;
  }

  return {
    type: 'green_card_renewal',
    description: 'Renew your green card',
    urgency: determineGreenCardRenewalUrgency(status.currentStatus),
  };
}

/**
 * Get active selective service item
 */
export function getActiveSelectiveServiceItem(
  status: SelectiveServiceStatus,
): ActiveComplianceItem | null {
  if (!status.applies || !status.registrationRequired) {
    return null;
  }

  return {
    type: 'selective_service',
    description: 'Register with Selective Service System',
    urgency: 'high',
  };
}

/**
 * Get active tax filing item
 */
export function getActiveTaxFilingItem(status: TaxReminderStatus): ActiveComplianceItem | null {
  if (status.reminderDismissed || status.daysUntilDeadline > 45) {
    return null;
  }

  return {
    type: 'tax_filing',
    description: 'File your US tax return',
    urgency: determineTaxFilingUrgency(status.daysUntilDeadline, status.isAbroadDuringTaxSeason),
  };
}
