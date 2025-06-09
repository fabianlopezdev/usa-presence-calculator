import { z } from 'zod';

import { TripSchema } from '@schemas/trip';
import { 
  ComplianceCalculationError,
  DateRangeError,
  err,
  ok,
  Result
} from '@errors/index';

import { calculateGreenCardRenewalStatus } from './green-card-renewal';
import { calculateRemovalOfConditionsStatus } from './removal-of-conditions';
import { calculateSelectiveServiceStatus } from './selective-service';
import { calculateTaxReminderStatus } from './tax-reminders';
import type {
  GreenCardRenewalStatus,
  RemovalOfConditionsStatus,
  SelectiveServiceStatus,
  TaxReminderStatus,
} from '@schemas/compliance';

/**
 * Input validation schema for removal of conditions calculation
 */
const RemovalOfConditionsInputSchema = z.object({
  isConditionalResident: z.boolean(),
  greenCardDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  currentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
});

/**
 * Input validation schema for green card renewal calculation
 */
const GreenCardRenewalInputSchema = z.object({
  greenCardExpirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  currentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
});

/**
 * Input validation schema for selective service calculation
 */
const SelectiveServiceInputSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  isSelectiveServiceRegistered: z.boolean().optional(),
  currentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
});

/**
 * Input validation schema for tax reminder calculation
 */
const TaxReminderInputSchema = z.object({
  trips: z.array(TripSchema),
  isDismissed: z.boolean().optional(),
  currentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
});

/**
 * Safe wrapper for calculateRemovalOfConditionsStatus
 * Validates inputs and handles errors gracefully
 */
export function safeCalculateRemovalOfConditionsStatus(
  isConditionalResident: unknown,
  greenCardDate: unknown,
  currentDate?: unknown
): Result<RemovalOfConditionsStatus, DateRangeError | ComplianceCalculationError> {
  try {
    const parseResult = RemovalOfConditionsInputSchema.safeParse({
      isConditionalResident,
      greenCardDate,
      currentDate,
    });
    
    if (!parseResult.success) {
      return err(new DateRangeError(
        'Invalid input for removal of conditions calculation',
        parseResult.error.format()
      ));
    }

    const validatedData = parseResult.data;
    const result = calculateRemovalOfConditionsStatus(
      validatedData.isConditionalResident,
      validatedData.greenCardDate,
      validatedData.currentDate
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      return err(new ComplianceCalculationError(error.message));
    }
    return err(new ComplianceCalculationError('Unknown error during removal of conditions calculation'));
  }
}

/**
 * Safe wrapper for calculateGreenCardRenewalStatus
 * Validates inputs and handles errors gracefully
 */
export function safeCalculateGreenCardRenewalStatus(
  greenCardExpirationDate: unknown,
  currentDate?: unknown
): Result<GreenCardRenewalStatus, DateRangeError | ComplianceCalculationError> {
  try {
    const parseResult = GreenCardRenewalInputSchema.safeParse({
      greenCardExpirationDate,
      currentDate,
    });
    
    if (!parseResult.success) {
      return err(new DateRangeError(
        'Invalid input for green card renewal calculation',
        parseResult.error.format()
      ));
    }

    const validatedData = parseResult.data;
    const result = calculateGreenCardRenewalStatus(
      validatedData.greenCardExpirationDate,
      validatedData.currentDate
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      return err(new ComplianceCalculationError(error.message));
    }
    return err(new ComplianceCalculationError('Unknown error during green card renewal calculation'));
  }
}

/**
 * Safe wrapper for calculateSelectiveServiceStatus
 * Validates inputs and handles errors gracefully
 */
export function safeCalculateSelectiveServiceStatus(
  birthDate?: unknown,
  gender?: unknown,
  isSelectiveServiceRegistered?: unknown,
  currentDate?: unknown
): Result<SelectiveServiceStatus, DateRangeError | ComplianceCalculationError> {
  try {
    const parseResult = SelectiveServiceInputSchema.safeParse({
      birthDate,
      gender,
      isSelectiveServiceRegistered,
      currentDate,
    });
    
    if (!parseResult.success) {
      return err(new DateRangeError(
        'Invalid input for selective service calculation',
        parseResult.error.format()
      ));
    }

    const validatedData = parseResult.data;
    const result = calculateSelectiveServiceStatus(
      validatedData.birthDate,
      validatedData.gender,
      validatedData.isSelectiveServiceRegistered,
      validatedData.currentDate
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      return err(new ComplianceCalculationError(error.message));
    }
    return err(new ComplianceCalculationError('Unknown error during selective service calculation'));
  }
}

/**
 * Safe wrapper for calculateTaxReminderStatus
 * Validates inputs and handles errors gracefully
 */
export function safeCalculateTaxReminderStatus(
  trips: unknown,
  isDismissed?: unknown,
  currentDate?: unknown
): Result<TaxReminderStatus, DateRangeError | ComplianceCalculationError> {
  try {
    const parseResult = TaxReminderInputSchema.safeParse({
      trips,
      isDismissed,
      currentDate,
    });
    
    if (!parseResult.success) {
      return err(new DateRangeError(
        'Invalid input for tax reminder calculation',
        parseResult.error.format()
      ));
    }

    const validatedData = parseResult.data;
    const result = calculateTaxReminderStatus(
      validatedData.trips,
      validatedData.isDismissed,
      validatedData.currentDate
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      return err(new ComplianceCalculationError(error.message));
    }
    return err(new ComplianceCalculationError('Unknown error during tax reminder calculation'));
  }
}