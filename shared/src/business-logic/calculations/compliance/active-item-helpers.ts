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

// Internal dependencies - Constants
import {
  REMOVAL_CONDITIONS_STATUS,
  GREEN_CARD_RENEWAL_STATUS,
  COMPLIANCE_ITEM_TYPE,
  COMPLIANCE_ACTIVE_ITEM_MESSAGES,
} from '@constants/compliance';
import { PRIORITY_LEVEL, TAX_FILING_THRESHOLDS_DAYS } from '@constants/priority-urgency';

/**
 * Get active removal of conditions item
 */
export function getActiveRemovalOfConditionsItem(
  status: RemovalOfConditionsStatus,
): ActiveComplianceItem | null {
  if (
    !status.applies ||
    (status.currentStatus !== REMOVAL_CONDITIONS_STATUS.IN_WINDOW &&
      status.currentStatus !== REMOVAL_CONDITIONS_STATUS.OVERDUE)
  ) {
    return null;
  }

  return {
    type: COMPLIANCE_ITEM_TYPE.REMOVAL_CONDITIONS,
    description: COMPLIANCE_ACTIVE_ITEM_MESSAGES.REMOVAL_CONDITIONS,
    urgency:
      status.currentStatus === REMOVAL_CONDITIONS_STATUS.OVERDUE
        ? PRIORITY_LEVEL.CRITICAL
        : PRIORITY_LEVEL.HIGH,
  };
}

/**
 * Get active green card renewal item
 */
export function getActiveGreenCardRenewalItem(
  status: GreenCardRenewalStatus,
): ActiveComplianceItem | null {
  if (
    status.currentStatus !== GREEN_CARD_RENEWAL_STATUS.RENEWAL_RECOMMENDED &&
    status.currentStatus !== GREEN_CARD_RENEWAL_STATUS.RENEWAL_URGENT &&
    status.currentStatus !== GREEN_CARD_RENEWAL_STATUS.EXPIRED
  ) {
    return null;
  }

  return {
    type: COMPLIANCE_ITEM_TYPE.GREEN_CARD_RENEWAL,
    description: COMPLIANCE_ACTIVE_ITEM_MESSAGES.GREEN_CARD_RENEWAL,
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
    type: COMPLIANCE_ITEM_TYPE.SELECTIVE_SERVICE,
    description: COMPLIANCE_ACTIVE_ITEM_MESSAGES.SELECTIVE_SERVICE,
    urgency: PRIORITY_LEVEL.HIGH,
  };
}

/**
 * Get active tax filing item
 */
export function getActiveTaxFilingItem(status: TaxReminderStatus): ActiveComplianceItem | null {
  if (
    status.reminderDismissed ||
    status.daysUntilDeadline > TAX_FILING_THRESHOLDS_DAYS.PRIORITY_ITEM_THRESHOLD
  ) {
    return null;
  }

  return {
    type: COMPLIANCE_ITEM_TYPE.TAX_FILING,
    description: COMPLIANCE_ACTIVE_ITEM_MESSAGES.TAX_FILING,
    urgency: determineTaxFilingUrgency(status.daysUntilDeadline, status.isAbroadDuringTaxSeason),
  };
}
