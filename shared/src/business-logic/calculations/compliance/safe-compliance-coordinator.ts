import { z } from 'zod';

import { 
  ComplianceCalculationError,
  DateRangeError,
  err,
  ok,
  Result
} from '@errors/index';

import {
  calculateComprehensiveCompliance,
  getActiveComplianceItems,
  getPriorityComplianceItems,
  getUpcomingDeadlines,
} from './compliance-coordinator';
import type {
  ActiveComplianceItem,
  ComplianceCalculationParams,
  ComprehensiveComplianceStatus,
  PriorityComplianceItem,
  UpcomingDeadline,
} from './compliance-coordinator';

/**
 * Input validation schema for compliance calculations
 */
const ComplianceCalculationInputSchema = z.object({
  currentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  greenCardDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  isConditionalResident: z.boolean().optional(),
  hadRemovalOfConditions: z.boolean().optional(),
  renewalFilingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  lastTaxFilingYear: z.number().int().min(2000).max(2100).optional(),
});

/**
 * Safe wrapper for calculateComprehensiveCompliance
 * Validates inputs and handles errors gracefully
 */
export function safeCalculateComprehensiveCompliance(
  params: unknown
): Result<ComprehensiveComplianceStatus, DateRangeError | ComplianceCalculationError> {
  try {
    const parseResult = ComplianceCalculationInputSchema.safeParse(params);
    
    if (!parseResult.success) {
      return err(new DateRangeError(
        'Invalid input for compliance calculation',
        parseResult.error.format()
      ));
    }

    const result = calculateComprehensiveCompliance(parseResult.data as ComplianceCalculationParams);
    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      return err(new ComplianceCalculationError(error.message));
    }
    return err(new ComplianceCalculationError('Unknown error during compliance calculation'));
  }
}

/**
 * Safe wrapper for getActiveComplianceItems
 * Validates inputs and handles errors gracefully
 */
export function safeGetActiveComplianceItems(
  complianceStatus: unknown
): Result<ActiveComplianceItem[], ComplianceCalculationError> {
  try {
    // Validate that complianceStatus has the expected structure
    if (!complianceStatus || typeof complianceStatus !== 'object') {
      return err(new ComplianceCalculationError('Invalid compliance status object'));
    }

    const result = getActiveComplianceItems(complianceStatus as ComprehensiveComplianceStatus);
    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      return err(new ComplianceCalculationError(error.message));
    }
    return err(new ComplianceCalculationError('Unknown error getting active compliance items'));
  }
}

/**
 * Safe wrapper for getPriorityComplianceItems
 * Validates inputs and handles errors gracefully
 */
export function safeGetPriorityComplianceItems(
  complianceStatus: unknown
): Result<PriorityComplianceItem[], ComplianceCalculationError> {
  try {
    // Validate that complianceStatus has the expected structure
    if (!complianceStatus || typeof complianceStatus !== 'object') {
      return err(new ComplianceCalculationError('Invalid compliance status object'));
    }

    const result = getPriorityComplianceItems(complianceStatus as ComprehensiveComplianceStatus);
    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      return err(new ComplianceCalculationError(error.message));
    }
    return err(new ComplianceCalculationError('Unknown error getting priority compliance items'));
  }
}

/**
 * Safe wrapper for getUpcomingDeadlines
 * Validates inputs and handles errors gracefully
 */
export function safeGetUpcomingDeadlines(
  complianceStatus: unknown,
  daysAhead: unknown = 90
): Result<UpcomingDeadline[], ComplianceCalculationError> {
  try {
    // Validate inputs
    if (!complianceStatus || typeof complianceStatus !== 'object') {
      return err(new ComplianceCalculationError('Invalid compliance status object'));
    }

    const daysAheadNumber = Number(daysAhead);
    if (isNaN(daysAheadNumber) || daysAheadNumber < 0) {
      return err(new ComplianceCalculationError('Invalid daysAhead parameter'));
    }

    const result = getUpcomingDeadlines(
      complianceStatus as ComprehensiveComplianceStatus,
      daysAheadNumber
    );
    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      return err(new ComplianceCalculationError(error.message));
    }
    return err(new ComplianceCalculationError('Unknown error getting upcoming deadlines'));
  }
}

/**
 * Comprehensive safe compliance calculation that returns all compliance data
 * Chains the comprehensive calculation with active items and deadlines
 */
export function safeGetFullComplianceReport(
  params: unknown,
  daysAhead: number = 90
): Result<{
  status: ComprehensiveComplianceStatus;
  activeItems: ActiveComplianceItem[];
  priorityItems: PriorityComplianceItem[];
  upcomingDeadlines: UpcomingDeadline[];
}, DateRangeError | ComplianceCalculationError> {
  // First calculate comprehensive compliance
  const statusResult = safeCalculateComprehensiveCompliance(params);
  
  if (!statusResult.success) {
    return statusResult;
  }

  const status = statusResult.data;

  // Get active items
  const activeItemsResult = safeGetActiveComplianceItems(status);
  if (!activeItemsResult.success) {
    return activeItemsResult;
  }

  // Get priority items
  const priorityItemsResult = safeGetPriorityComplianceItems(status);
  if (!priorityItemsResult.success) {
    return priorityItemsResult;
  }

  // Get upcoming deadlines
  const deadlinesResult = safeGetUpcomingDeadlines(status, daysAhead);
  if (!deadlinesResult.success) {
    return deadlinesResult;
  }

  return ok({
    status,
    activeItems: activeItemsResult.data,
    priorityItems: priorityItemsResult.data,
    upcomingDeadlines: deadlinesResult.data,
  });
}