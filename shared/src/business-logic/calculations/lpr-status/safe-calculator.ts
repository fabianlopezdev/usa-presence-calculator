import { z } from 'zod';

import { DATE_VALIDATION, LPR_STATUS_VALIDATION } from '@constants/validation-messages';
import { err, LPRStatusError, ok, Result, TripValidationError } from '@errors/index';
import {
  GreenCardRiskResult,
  LPRStatusAssessment,
  LPRStatusAssessmentAdvanced,
  LPRStatusInputSchema,
  MaximumTripDurationResult,
} from '@schemas/lpr-status';
import { TripSchema } from '@schemas/trip';
import { parseUTCDate } from '@utils/utc-date-helpers';

import {
  assessRiskOfLosingPermanentResidentStatus,
  assessRiskOfLosingPermanentResidentStatusAdvanced,
  calculateMaximumTripDurationWithExemptions,
} from './calculator';

/**
 * Input validation schema for basic LPR risk assessment
 */
const BasicLPRAssessmentInputSchema = z.object({
  trips: z.array(TripSchema),
  currentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT)
    .optional(),
});

/**
 * Input validation schema for maximum trip duration calculation
 */
const MaximumTripDurationInputSchema = z.object({
  trips: z.array(TripSchema),
  greenCardDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT),
  eligibilityCategory: z.enum(['three_year', 'five_year']),
  hasReentryPermit: z.boolean().optional(),
  permitExpiryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT)
    .optional(),
  currentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT)
    .optional(),
});

/**
 * Safe wrapper for assessRiskOfLosingPermanentResidentStatus
 * Validates inputs and handles errors gracefully
 */
export function safeAssessRiskOfLosingPermanentResidentStatus(
  trips: unknown,
  currentDate?: unknown,
): Result<LPRStatusAssessment, TripValidationError | LPRStatusError> {
  try {
    const parseResult = BasicLPRAssessmentInputSchema.safeParse({ trips, currentDate });

    if (!parseResult.success) {
      return err(
        new TripValidationError(LPR_STATUS_VALIDATION.INVALID_INPUT, parseResult.error.format()),
      );
    }

    const validatedData = parseResult.data;
    const result = assessRiskOfLosingPermanentResidentStatus(
      validatedData.trips,
      validatedData.currentDate || new Date().toISOString().split('T')[0],
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      return err(new LPRStatusError(error.message));
    }
    return err(new LPRStatusError(LPR_STATUS_VALIDATION.UNKNOWN_ERROR));
  }
}

/**
 * Safe wrapper for assessRiskOfLosingPermanentResidentStatusAdvanced
 * Validates inputs and handles errors gracefully
 */
export function safeAssessRiskOfLosingPermanentResidentStatusAdvanced(
  input: unknown,
): Result<LPRStatusAssessmentAdvanced, TripValidationError | LPRStatusError> {
  try {
    const parseResult = LPRStatusInputSchema.safeParse(input);

    if (!parseResult.success) {
      return err(
        new TripValidationError(LPR_STATUS_VALIDATION.INVALID_ADVANCED, parseResult.error.format()),
      );
    }

    const result = assessRiskOfLosingPermanentResidentStatusAdvanced(parseResult.data);
    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      return err(new LPRStatusError(error.message));
    }
    return err(new LPRStatusError(LPR_STATUS_VALIDATION.UNKNOWN_ERROR_ADVANCED));
  }
}

/**
 * Helper function to validate maximum trip duration input
 */
function validateMaximumTripDurationInput(input: {
  trips: unknown;
  greenCardDate: unknown;
  eligibilityCategory: unknown;
  hasReentryPermit?: unknown;
  permitExpiryDate?: unknown;
  currentDate?: unknown;
}): Result<{ validatedData: z.infer<typeof MaximumTripDurationInputSchema> }, TripValidationError> {
  const parseResult = MaximumTripDurationInputSchema.safeParse(input);

  if (!parseResult.success) {
    return err(
      new TripValidationError(
        LPR_STATUS_VALIDATION.INVALID_MAX_DURATION,
        parseResult.error.format(),
      ),
    );
  }

  return ok({ validatedData: parseResult.data });
}

/**
 * Helper function to build reentry permit info
 */
function buildReentryPermitInfo(
  hasReentryPermit?: boolean,
  permitExpiryDate?: string,
): { hasReentryPermit: boolean; permitExpiryDate?: string } | undefined {
  return hasReentryPermit && permitExpiryDate
    ? {
        hasReentryPermit: true,
        permitExpiryDate,
      }
    : undefined;
}

/**
 * Safe wrapper for calculateMaximumTripDurationWithExemptions
 * Validates inputs and handles errors gracefully
 */
export function safeCalculateMaximumTripDurationWithExemptions(
  trips: unknown,
  greenCardDate: unknown,
  eligibilityCategory: unknown,
  hasReentryPermit?: unknown,
  permitExpiryDate?: unknown,
  _currentDate?: unknown,
): Result<MaximumTripDurationResult, TripValidationError | LPRStatusError> {
  try {
    const validationResult = validateMaximumTripDurationInput({
      trips,
      greenCardDate,
      eligibilityCategory,
      hasReentryPermit,
      permitExpiryDate,
      currentDate: _currentDate,
    });

    if (!validationResult.success) {
      return validationResult;
    }

    const { validatedData } = validationResult.data;
    const parsedCurrentDate = validatedData.currentDate
      ? parseUTCDate(validatedData.currentDate)
      : new Date();

    const reentryPermitInfo = buildReentryPermitInfo(
      validatedData.hasReentryPermit,
      validatedData.permitExpiryDate,
    );

    const result = calculateMaximumTripDurationWithExemptions(
      validatedData.trips,
      validatedData.greenCardDate,
      validatedData.eligibilityCategory,
      parsedCurrentDate,
      reentryPermitInfo,
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      return err(new LPRStatusError(error.message));
    }
    return err(new LPRStatusError(LPR_STATUS_VALIDATION.UNKNOWN_ERROR_MAX_DURATION));
  }
}

/**
 * Safe wrapper for calculating green card abandonment risk
 * This is a utility function that extracts risk information from LPR assessment
 */
export function safeCalculateGreenCardAbandonmentRisk(
  trips: unknown,
  _hasReentryPermit: boolean = false,
  _permitExpiryDate?: unknown,
): Result<GreenCardRiskResult, TripValidationError | LPRStatusError> {
  try {
    // First perform basic assessment
    const assessmentResult = safeAssessRiskOfLosingPermanentResidentStatus(trips);

    if (!assessmentResult.success) {
      return assessmentResult;
    }

    const assessment = assessmentResult.data;

    // Extract risk information
    const riskResult: GreenCardRiskResult = {
      riskLevel:
        assessment.overallRisk === 'automatic_loss'
          ? 'automatic_loss'
          : assessment.overallRisk === 'high_risk'
            ? 'high_risk'
            : assessment.overallRisk === 'presumption_of_abandonment'
              ? 'presumption_of_abandonment'
              : assessment.overallRisk === 'warning'
                ? 'warning'
                : 'none',
      daysUntilNextThreshold: 0, // Would need additional calculation
      message: assessment.recommendations[0] || 'Monitor your travel patterns',
    };

    return ok(riskResult);
  } catch (error) {
    if (error instanceof Error) {
      return err(new LPRStatusError(error.message));
    }
    return err(new LPRStatusError(LPR_STATUS_VALIDATION.UNKNOWN_ERROR_GREEN_CARD_RISK));
  }
}
