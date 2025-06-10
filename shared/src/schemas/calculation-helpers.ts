import { z } from 'zod';

// Schema for trip duration calculation options
export const TripDurationOptionsSchema = z
  .object({
    includeDepartureDay: z.boolean().optional(),
    includeReturnDay: z.boolean().optional(),
    startBoundary: z.date().optional(),
    endBoundary: z.date().optional(),
  })
  .strict();

// Schema for trip validation requirements
export const TripValidationRequirementsSchema = z
  .object({
    needsId: z.boolean().optional(),
    needsLocation: z.boolean().optional(),
    allowSimulated: z.boolean().optional(),
    checkDates: z.boolean().optional(),
  })
  .strict();

// Type exports
export type TripDurationOptions = z.infer<typeof TripDurationOptionsSchema>;
export type TripValidationRequirements = z.infer<typeof TripValidationRequirementsSchema>;
