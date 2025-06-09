import { z } from 'zod';

import { TripSchema } from '@schemas/trip';
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
  currentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  greenCardDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  greenCardExpirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  isConditionalResident: z.boolean(),
  isSelectiveServiceRegistered: z.boolean().optional(),
  taxReminderDismissed: z.boolean().optional(),
  trips: z.array(TripSchema),
  hadRemovalOfConditions: z.boolean().optional(),
  renewalFilingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  lastTaxFilingYear: z.number().int().min(2000).max(2100).optional(),
}).strict();

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
  params: unknown
): Result<ActiveComplianceItem[], DateRangeError | ComplianceCalculationError> {
  try {
    // First calculate comprehensive compliance status
    const statusResult = safeCalculateComprehensiveCompliance(params);
    if (!statusResult.success) {
      return statusResult;
    }

    const result = getActiveComplianceItems(statusResult.data);
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
  params: unknown
): Result<PriorityComplianceItem[], DateRangeError | ComplianceCalculationError> {
  try {
    // First calculate comprehensive compliance status
    const statusResult = safeCalculateComprehensiveCompliance(params);
    if (!statusResult.success) {
      return statusResult;
    }

    const result = getPriorityComplianceItems(statusResult.data);
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
  params: unknown,
  daysAhead: unknown = 90
): Result<UpcomingDeadline[], DateRangeError | ComplianceCalculationError> {
  try {
    // First calculate comprehensive compliance status
    const statusResult = safeCalculateComprehensiveCompliance(params);
    if (!statusResult.success) {
      return statusResult;
    }

    const daysAheadNumber = Number(daysAhead);
    if (isNaN(daysAheadNumber) || daysAheadNumber < 0) {
      return err(new ComplianceCalculationError('Invalid daysAhead parameter'));
    }

    // Get all deadlines
    const allDeadlines = getUpcomingDeadlines(
      statusResult.data,
      new Date().toISOString()
    );
    
    // Filter by days ahead
    const filteredDeadlines = allDeadlines.filter(
      deadline => deadline.daysRemaining <= daysAheadNumber
    );
    
    return ok(filteredDeadlines);
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
  const activeItemsResult = safeGetActiveComplianceItems(params);
  if (!activeItemsResult.success) {
    return activeItemsResult;
  }

  // Get priority items
  const priorityItemsResult = safeGetPriorityComplianceItems(params);
  if (!priorityItemsResult.success) {
    return priorityItemsResult;
  }

  // Get upcoming deadlines
  const deadlinesResult = safeGetUpcomingDeadlines(params, daysAhead);
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