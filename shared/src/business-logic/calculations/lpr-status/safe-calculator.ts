import { z } from 'zod';

import { DATE_VALIDATION, LPR_STATUS_VALIDATION } from '@constants/validation-messages';
import { 
  err,
  LPRStatusError,
  ok,
  Result,
  TripValidationError,
  USCISCalculationError
} from '@errors/index';
import { 
  GreenCardRiskResult,
  LPRStatusAssessment,
  LPRStatusAssessmentAdvanced,
  LPRStatusInputSchema,
  MaximumTripDurationResult,
} from '@schemas/lpr-status';
import { TripSchema } from '@schemas/trip';

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
  currentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT).optional(),
});

/**
 * Input validation schema for maximum trip duration calculation
 */
const MaximumTripDurationInputSchema = z.object({
  trips: z.array(TripSchema),
  greenCardDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT),
  eligibilityCategory: z.enum(['three_year', 'five_year']),
  hasReentryPermit: z.boolean().optional(),
  permitExpiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT).optional(),
  currentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT).optional(),
});

/**
 * Safe wrapper for assessRiskOfLosingPermanentResidentStatus
 * Validates inputs and handles errors gracefully
 */
export function safeAssessRiskOfLosingPermanentResidentStatus(
  trips: unknown,
  currentDate?: unknown
): Result<LPRStatusAssessment, TripValidationError | LPRStatusError> {
  try {
    const parseResult = BasicLPRAssessmentInputSchema.safeParse({ trips, currentDate });
    
    if (!parseResult.success) {
      return err(new TripValidationError(
        LPR_STATUS_VALIDATION.INVALID_INPUT,
        parseResult.error.format()
      ));
    }

    const validatedData = parseResult.data;
    const result = assessRiskOfLosingPermanentResidentStatus(
      validatedData.trips,
      validatedData.currentDate
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
  input: unknown
): Result<LPRStatusAssessmentAdvanced, TripValidationError | LPRStatusError> {
  try {
    const parseResult = LPRStatusInputSchema.safeParse(input);
    
    if (!parseResult.success) {
      return err(new TripValidationError(
        LPR_STATUS_VALIDATION.INVALID_ADVANCED,
        parseResult.error.format()
      ));
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
 * Safe wrapper for calculateMaximumTripDurationWithExemptions
 * Validates inputs and handles errors gracefully
 */
export function safeCalculateMaximumTripDurationWithExemptions(
  trips: unknown,
  greenCardDate: unknown,
  eligibilityCategory: unknown,
  hasReentryPermit?: unknown,
  permitExpiryDate?: unknown,
  currentDate?: unknown
): Result<MaximumTripDurationResult, TripValidationError | LPRStatusError> {
  try {
    const parseResult = MaximumTripDurationInputSchema.safeParse({
      trips,
      greenCardDate,
      eligibilityCategory,
      hasReentryPermit,
      permitExpiryDate,
      currentDate,
    });
    
    if (!parseResult.success) {
      return err(new TripValidationError(
        LPR_STATUS_VALIDATION.INVALID_MAX_DURATION,
        parseResult.error.format()
      ));
    }

    const validatedData = parseResult.data;
    const result = calculateMaximumTripDurationWithExemptions(
      validatedData.trips,
      validatedData.greenCardDate,
      validatedData.eligibilityCategory,
      validatedData.hasReentryPermit,
      validatedData.permitExpiryDate,
      validatedData.currentDate
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
  hasReentryPermit: boolean = false,
  permitExpiryDate?: unknown
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
      riskLevel: assessment.overallRisk === 'automatic_loss' 
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