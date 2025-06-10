import { z } from 'zod';

import { REMOVAL_CONDITIONS_STATUS } from '@constants/compliance';
import { COMPLIANCE_VALIDATION, DATE_VALIDATION } from '@constants/validation-messages';
import { ComplianceCalculationError, DateRangeError, err, ok, Result } from '@errors/index';
import { TripSchema } from '@schemas/trip';

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
  greenCardDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT),
  currentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT)
    .optional(),
});

/**
 * Input validation schema for green card renewal calculation
 */
const GreenCardRenewalInputSchema = z.object({
  greenCardExpirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT),
  currentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT)
    .optional(),
});

/**
 * Input validation schema for selective service calculation
 */
const SelectiveServiceInputSchema = z.object({
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT)
    .optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  isSelectiveServiceRegistered: z.boolean().optional(),
  currentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT)
    .optional(),
});

/**
 * Input validation schema for tax reminder calculation
 */
const TaxReminderInputSchema = z.object({
  trips: z.array(TripSchema),
  isDismissed: z.boolean().optional(),
  currentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT)
    .optional(),
});

/**
 * Safe wrapper for calculateRemovalOfConditionsStatus
 * Validates inputs and handles errors gracefully
 */
export function safeCalculateRemovalOfConditionsStatus(
  isConditionalResident: unknown,
  greenCardDate: unknown,
  currentDate?: unknown,
): Result<RemovalOfConditionsStatus, DateRangeError | ComplianceCalculationError> {
  try {
    const parseResult = RemovalOfConditionsInputSchema.safeParse({
      isConditionalResident,
      greenCardDate,
      currentDate,
    });

    if (!parseResult.success) {
      return err(
        new DateRangeError(
          COMPLIANCE_VALIDATION.INVALID_REMOVAL_CONDITIONS,
          parseResult.error.format(),
        ),
      );
    }

    const validatedData = parseResult.data;
    const result = calculateRemovalOfConditionsStatus(
      validatedData.isConditionalResident,
      validatedData.greenCardDate,
      validatedData.currentDate,
    );

    if (!result) {
      // Non-conditional residents return null, which is valid
      return ok({
        applies: false,
        greenCardDate: validatedData.greenCardDate,
        filingWindowStart: '',
        filingWindowEnd: '',
        currentStatus: REMOVAL_CONDITIONS_STATUS.NOT_YET,
        daysUntilWindow: null,
        daysUntilDeadline: null,
      });
    }

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      return err(new ComplianceCalculationError(error.message));
    }
    return err(new ComplianceCalculationError(COMPLIANCE_VALIDATION.UNKNOWN_ERROR));
  }
}

/**
 * Safe wrapper for calculateGreenCardRenewalStatus
 * Validates inputs and handles errors gracefully
 */
export function safeCalculateGreenCardRenewalStatus(
  greenCardExpirationDate: unknown,
  currentDate?: unknown,
): Result<GreenCardRenewalStatus, DateRangeError | ComplianceCalculationError> {
  try {
    const parseResult = GreenCardRenewalInputSchema.safeParse({
      greenCardExpirationDate,
      currentDate,
    });

    if (!parseResult.success) {
      return err(
        new DateRangeError(
          COMPLIANCE_VALIDATION.INVALID_GREEN_CARD_RENEWAL,
          parseResult.error.format(),
        ),
      );
    }

    const validatedData = parseResult.data;
    const result = calculateGreenCardRenewalStatus(
      validatedData.greenCardExpirationDate,
      validatedData.currentDate,
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      return err(new ComplianceCalculationError(error.message));
    }
    return err(new ComplianceCalculationError(COMPLIANCE_VALIDATION.UNKNOWN_ERROR));
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
  currentDate?: unknown,
): Result<SelectiveServiceStatus, DateRangeError | ComplianceCalculationError> {
  try {
    const parseResult = SelectiveServiceInputSchema.safeParse({
      birthDate,
      gender,
      isSelectiveServiceRegistered,
      currentDate,
    });

    if (!parseResult.success) {
      return err(
        new DateRangeError(
          COMPLIANCE_VALIDATION.INVALID_SELECTIVE_SERVICE,
          parseResult.error.format(),
        ),
      );
    }

    const validatedData = parseResult.data;
    const result = calculateSelectiveServiceStatus(
      validatedData.birthDate || '',
      validatedData.gender || 'other',
      validatedData.isSelectiveServiceRegistered || false,
      validatedData.currentDate || new Date().toISOString(),
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      return err(new ComplianceCalculationError(error.message));
    }
    return err(new ComplianceCalculationError(COMPLIANCE_VALIDATION.UNKNOWN_ERROR));
  }
}

/**
 * Safe wrapper for calculateTaxReminderStatus
 * Validates inputs and handles errors gracefully
 */
export function safeCalculateTaxReminderStatus(
  trips: unknown,
  isDismissed?: unknown,
  currentDate?: unknown,
): Result<TaxReminderStatus, DateRangeError | ComplianceCalculationError> {
  try {
    const parseResult = TaxReminderInputSchema.safeParse({
      trips,
      isDismissed,
      currentDate,
    });

    if (!parseResult.success) {
      return err(
        new DateRangeError(COMPLIANCE_VALIDATION.INVALID_TAX_REMINDER, parseResult.error.format()),
      );
    }

    const validatedData = parseResult.data;
    const result = calculateTaxReminderStatus(
      validatedData.trips,
      validatedData.isDismissed || false,
      validatedData.currentDate,
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      return err(new ComplianceCalculationError(error.message));
    }
    return err(new ComplianceCalculationError(COMPLIANCE_VALIDATION.UNKNOWN_ERROR));
  }
}
