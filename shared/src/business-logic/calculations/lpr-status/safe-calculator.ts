import { z } from 'zod';

import { LPRStatusInputSchema } from '@schemas/lpr-status';
import { TripSchema } from '@schemas/trip';
import { 
  err,
  LPRStatusError,
  ok,
  Result,
  TripValidationError,
  USCISCalculationError
} from '@errors/index';

import {
  assessRiskOfLosingPermanentResidentStatus,
  assessRiskOfLosingPermanentResidentStatusAdvanced,
  calculateMaximumTripDurationWithExemptions,
} from './calculator';
import type {
  GreenCardRiskResult,
  LPRStatusAssessment,
  LPRStatusAssessmentAdvanced,
  MaximumTripDurationResult,
} from './calculator';

/**
 * Input validation schema for basic LPR risk assessment
 */
const BasicLPRAssessmentInputSchema = z.object({
  trips: z.array(TripSchema),
  currentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
});

/**
 * Input validation schema for maximum trip duration calculation
 */
const MaximumTripDurationInputSchema = z.object({
  trips: z.array(TripSchema),
  greenCardDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  eligibilityCategory: z.enum(['three_year', 'five_year']),
  hasReentryPermit: z.boolean().optional(),
  permitExpiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  currentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
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
        'Invalid input for LPR risk assessment',
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
    return err(new LPRStatusError('Unknown error during LPR risk assessment'));
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
        'Invalid input for advanced LPR risk assessment',
        parseResult.error.format()
      ));
    }

    const result = assessRiskOfLosingPermanentResidentStatusAdvanced(parseResult.data);
    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      return err(new LPRStatusError(error.message));
    }
    return err(new LPRStatusError('Unknown error during advanced LPR risk assessment'));
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
        'Invalid input for maximum trip duration calculation',
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
    return err(new LPRStatusError('Unknown error during maximum trip duration calculation'));
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
    return err(new LPRStatusError('Unknown error during green card risk calculation'));
  }
}