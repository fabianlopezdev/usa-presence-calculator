import { z } from 'zod';

import { DATE_VALIDATION, TRAVEL_RISK_VALIDATION } from '@constants/validation-messages';
import { 
  err,
  ok,
  Result,
  TripValidationError,
  USCISCalculationError
} from '@errors/index';
import { ComprehensiveRiskAssessment } from '@schemas/lpr-status';
import { TripSchema } from '@schemas/trip';

import { assessTripRiskForAllLegalThresholds } from './assessment';

/**
 * Input validation schema for trip risk assessment
 */
const TripRiskAssessmentInputSchema = z.object({
  trip: TripSchema,
  reentryPermitInfo: z.object({
    hasReentryPermit: z.boolean(),
    permitExpiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT).optional(),
  }).strict().optional(),
});

/**
 * Safe wrapper for assessTripRiskForAllLegalThresholds
 * Validates inputs and handles errors gracefully
 */
export function safeAssessTripRiskForAllLegalThresholds(
  trip: unknown,
  reentryPermitInfo?: unknown
): Result<ComprehensiveRiskAssessment, TripValidationError | USCISCalculationError> {
  try {
    const parseResult = TripRiskAssessmentInputSchema.safeParse({
      trip,
      reentryPermitInfo,
    });
    
    if (!parseResult.success) {
      return err(new TripValidationError(
        TRAVEL_RISK_VALIDATION.INVALID_ASSESSMENT,
        parseResult.error.format()
      ));
    }

    const validatedData = parseResult.data;
    const result = assessTripRiskForAllLegalThresholds(
      validatedData.trip,
      validatedData.reentryPermitInfo
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      return err(new USCISCalculationError(error.message));
    }
    return err(new USCISCalculationError(TRAVEL_RISK_VALIDATION.UNKNOWN_ERROR));
  }
}