/**
 * LPR Compliance Coordinator
 *
 * Aggregates all compliance statuses into a comprehensive compliance report
 * and provides helper functions for prioritization and deadline tracking
 */

// External dependencies
// None needed - using internal utilities

// Internal dependencies - Schemas & Types
import {
  ComplianceCalculationParams,
  ComprehensiveComplianceStatus,
  RemovalOfConditionsStatus,
} from '@schemas/compliance';
import {
  ActiveComplianceItem,
  PriorityComplianceItem,
  UpcomingDeadline,
} from '@schemas/compliance-helpers';

// Internal dependencies - Constants
import { REMOVAL_CONDITIONS_STATUS } from '@constants/compliance';

// Internal dependencies - Business Logic
import {
  getActiveGreenCardRenewalItem,
  getActiveRemovalOfConditionsItem,
  getActiveSelectiveServiceItem,
  getActiveTaxFilingItem,
} from '@business-logic/calculations/compliance/active-item-helpers';
import {
  getGreenCardExpirationDeadline,
  getGreenCardRenewalPriorityItem,
  getRemovalOfConditionsUpcomingDeadline,
  getRemovalOfConditionsPriorityItem,
  getSelectiveServiceDeadline,
  getSelectiveServicePriorityItem,
  getTaxFilingDeadline,
  getTaxFilingPriorityItem,
  sortPriorityItems,
} from '@business-logic/calculations/compliance/compliance-helpers';
import { calculateGreenCardRenewalStatus } from '@business-logic/calculations/compliance/green-card-renewal';
import { calculateRemovalOfConditionsStatus } from '@business-logic/calculations/compliance/removal-of-conditions';
import { calculateSelectiveServiceStatus } from '@business-logic/calculations/compliance/selective-service';
import { calculateTaxReminderStatus } from '@business-logic/calculations/compliance/tax-reminders';

// Internal dependencies - Utilities
import { parseDate } from '@utils/date-helpers';

/**
 * Calculate comprehensive compliance status
 */
export function calculateComprehensiveCompliance(
  params: ComplianceCalculationParams,
): ComprehensiveComplianceStatus {
  const {
    isConditionalResident,
    greenCardDate,
    greenCardExpirationDate,
    birthDate,
    gender,
    isSelectiveServiceRegistered,
    taxReminderDismissed,
    trips,
    currentDate,
  } = params;

  // Calculate individual compliance statuses
  const removalOfConditions = getRemovalOfConditionsStatus(
    isConditionalResident,
    greenCardDate,
    currentDate,
  );

  const greenCardRenewal = calculateGreenCardRenewalStatus(greenCardExpirationDate, currentDate);

  const selectiveService = calculateSelectiveServiceStatus(
    birthDate,
    gender,
    isSelectiveServiceRegistered,
    currentDate,
  );

  const taxReminder = calculateTaxReminderStatus(trips, taxReminderDismissed, currentDate);

  return {
    removalOfConditions,
    greenCardRenewal,
    selectiveService,
    taxReminder,
  };
}

/**
 * Get active compliance items requiring action
 */
export function getActiveComplianceItems(
  compliance: ComprehensiveComplianceStatus,
): ActiveComplianceItem[] {
  const activeItems: ActiveComplianceItem[] = [];

  // Check each compliance area
  const removalItem = getActiveRemovalOfConditionsItem(compliance.removalOfConditions);
  if (removalItem) activeItems.push(removalItem);

  const renewalItem = getActiveGreenCardRenewalItem(compliance.greenCardRenewal);
  if (renewalItem) activeItems.push(renewalItem);

  const selectiveServiceItem = getActiveSelectiveServiceItem(compliance.selectiveService);
  if (selectiveServiceItem) activeItems.push(selectiveServiceItem);

  const taxItem = getActiveTaxFilingItem(compliance.taxReminder);
  if (taxItem) activeItems.push(taxItem);

  return activeItems;
}

/**
 * Get priority compliance items sorted by urgency
 */
export function getPriorityComplianceItems(
  compliance: ComprehensiveComplianceStatus,
): PriorityComplianceItem[] {
  const priorityItems: PriorityComplianceItem[] = [];

  // Add removal of conditions if critical
  const removalItem = getRemovalOfConditionsPriorityItem(compliance.removalOfConditions);
  if (removalItem) priorityItems.push(removalItem);

  // Add green card renewal if urgent
  const renewalItem = getGreenCardRenewalPriorityItem(compliance.greenCardRenewal);
  if (renewalItem) priorityItems.push(renewalItem);

  // Add selective service if required
  const selectiveServiceItem = getSelectiveServicePriorityItem(compliance.selectiveService);
  if (selectiveServiceItem) priorityItems.push(selectiveServiceItem);

  // Add tax filing if deadline approaching and abroad
  const taxItem = getTaxFilingPriorityItem(compliance.taxReminder);
  if (taxItem) priorityItems.push(taxItem);

  // Sort by priority (critical first) then by deadline
  return sortPriorityItems(priorityItems);
}

/**
 * Get all upcoming deadlines sorted by date
 */
export function getUpcomingDeadlines(
  compliance: ComprehensiveComplianceStatus,
  currentDate: string = new Date().toISOString(),
): UpcomingDeadline[] {
  const deadlines: UpcomingDeadline[] = [];
  const current = parseDate(currentDate);

  // Add removal of conditions deadline
  const removalDeadline = getRemovalOfConditionsUpcomingDeadline(compliance.removalOfConditions);
  if (removalDeadline) deadlines.push(removalDeadline);

  // Add green card expiration
  const greenCardDeadline = getGreenCardExpirationDeadline(compliance.greenCardRenewal, current);
  if (greenCardDeadline) deadlines.push(greenCardDeadline);

  // Add selective service deadline
  const selectiveServiceDeadline = getSelectiveServiceDeadline(
    compliance.selectiveService,
    current,
  );
  if (selectiveServiceDeadline) deadlines.push(selectiveServiceDeadline);

  // Add tax deadline
  const taxDeadline = getTaxFilingDeadline(compliance.taxReminder, current);
  if (taxDeadline) deadlines.push(taxDeadline);

  // Sort by date
  return deadlines.sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());
}

/**
 * Get removal of conditions status with default for non-conditional residents
 */
function getRemovalOfConditionsStatus(
  isConditionalResident: boolean,
  greenCardDate: string,
  currentDate?: string,
): RemovalOfConditionsStatus {
  const result = calculateRemovalOfConditionsStatus(
    isConditionalResident,
    greenCardDate,
    currentDate,
  );

  // Return default status for non-conditional residents
  return (
    result || {
      applies: false,
      greenCardDate,
      filingWindowStart: '',
      filingWindowEnd: '',
      currentStatus: REMOVAL_CONDITIONS_STATUS.NOT_YET,
      daysUntilWindow: null,
      daysUntilDeadline: null,
    }
  );
}

// Re-export types
export type {
  ActiveComplianceItem,
  ComplianceCalculationParams,
  ComprehensiveComplianceStatus,
  PriorityComplianceItem,
  UpcomingDeadline,
};
