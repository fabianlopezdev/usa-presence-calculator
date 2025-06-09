import { z } from 'zod';

import { TripSchema } from '@schemas/trip';
import { 
  err,
  ok,
  Result,
  TripValidationError,
  USCISCalculationError
} from '@errors/index';

import { assessTripRiskForAllLegalThresholds } from './assessment';
import type { ComprehensiveRiskAssessment } from '@schemas/lpr-status';

/**
 * Input validation schema for trip risk assessment
 */
const TripRiskAssessmentInputSchema = z.object({
  trip: TripSchema,
  reentryPermitInfo: z.object({
    hasReentryPermit: z.boolean(),
    permitExpiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
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
        'Invalid input for trip risk assessment',
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
    return err(new USCISCalculationError('Unknown error during trip risk assessment'));
  }
}