/**
 * LPR Compliance Coordinator
 *
 * Aggregates all compliance statuses into a comprehensive compliance report
 * and provides helper functions for prioritization and deadline tracking
 */

// External dependencies
import { parseISO } from 'date-fns';

// Internal dependencies - Schemas & Types
import { Trip } from '@schemas/trip';
import {
  RemovalOfConditionsStatus,
  GreenCardRenewalStatus,
  SelectiveServiceStatus,
  TaxReminderStatus,
} from '@schemas/compliance';

// Internal dependencies - Business Logic
import { calculateRemovalOfConditionsStatus } from './removal-of-conditions';
import { calculateGreenCardRenewalStatus } from './green-card-renewal';
import { calculateSelectiveServiceStatus } from './selective-service';
import { calculateTaxReminderStatus } from './tax-reminders';
import type {
  ActiveComplianceItem,
  PriorityComplianceItem,
  UpcomingDeadline,
} from './compliance-helpers';

import {
  getRemovalOfConditionsPriorityItem,
  getGreenCardRenewalPriorityItem,
  getSelectiveServicePriorityItem,
  getTaxFilingPriorityItem,
  sortPriorityItems,
  getRemovalOfConditionsDeadline,
  getGreenCardExpirationDeadline,
  getSelectiveServiceDeadline,
  getTaxFilingDeadline,
} from './compliance-helpers';

import {
  getActiveRemovalOfConditionsItem,
  getActiveGreenCardRenewalItem,
  getActiveSelectiveServiceItem,
  getActiveTaxFilingItem,
} from './active-item-helpers';

// Re-export types
export type { ActiveComplianceItem, PriorityComplianceItem, UpcomingDeadline };

/**
 * Comprehensive compliance status for all LPR requirements
 */
export interface ComprehensiveComplianceStatus {
  removalOfConditions: RemovalOfConditionsStatus;
  greenCardRenewal: GreenCardRenewalStatus;
  selectiveService: SelectiveServiceStatus;
  taxReminder: TaxReminderStatus;
}

/**
 * Parameters for calculating comprehensive compliance
 */
export interface ComplianceCalculationParams {
  // Removal of conditions
  isConditionalResident: boolean;
  greenCardDate: string;

  // Green card renewal
  greenCardExpirationDate: string;

  // Selective service
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  isSelectiveServiceRegistered: boolean;

  // Tax reminders
  taxReminderDismissed: boolean;
  trips: Trip[];

  // Optional current date for testing
  currentDate?: string;
}

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
  const current = parseISO(currentDate);

  // Add removal of conditions deadline
  const removalDeadline = getRemovalOfConditionsDeadline(compliance.removalOfConditions);
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
  return deadlines.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
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
      currentStatus: 'not_yet',
      daysUntilWindow: null,
      daysUntilDeadline: null,
    }
  );
}
