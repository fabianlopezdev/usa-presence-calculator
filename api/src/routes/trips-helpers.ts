import { z } from 'zod';
import { FastifyReply } from 'fastify';
import { eq, and, isNull } from 'drizzle-orm';

import { TripCreateSchema, TripUpdateSchema, DATE_VALIDATION } from '@usa-presence/shared';
import { HTTP_STATUS } from '@api/constants/http';
import { TRIPS_API_MESSAGES } from '@api/constants/trips';
import { getDatabase } from '@api/db/connection';
import { trips } from '@api/db/schema';

export function normalizeTrip<T extends { location?: string | null }>(trip: T): T {
  return {
    ...trip,
    location: trip.location === '' ? null : trip.location,
  };
}

export function validateTripCreateData(
  body: unknown,
  reply: FastifyReply,
): z.infer<typeof TripCreateSchema> | null {
  try {
    const validatedData = TripCreateSchema.parse(body);
    return validatedData;
  } catch (error) {
    if (error instanceof z.ZodError) {
      reply.code(HTTP_STATUS.BAD_REQUEST).send({
        error: {
          message: TRIPS_API_MESSAGES.INVALID_REQUEST_BODY,
          details: error.errors,
        },
      });
      return null;
    }
    throw error;
  }
}

export function validateTripUpdateData(
  body: unknown,
  reply: FastifyReply,
): z.infer<typeof TripUpdateSchema> | null {
  try {
    const validatedData = TripUpdateSchema.parse(body);

    // Check if any updates provided
    if (Object.keys(validatedData).length === 0) {
      reply.code(HTTP_STATUS.BAD_REQUEST).send({
        error: { message: TRIPS_API_MESSAGES.NO_CHANGES_PROVIDED },
      });
      return null;
    }

    return validatedData;
  } catch (error) {
    if (error instanceof z.ZodError) {
      reply.code(HTTP_STATUS.BAD_REQUEST).send({
        error: {
          message: TRIPS_API_MESSAGES.INVALID_REQUEST_BODY,
          details: error.errors,
        },
      });
      return null;
    }
    throw error;
  }
}

export function validateDateRange(
  departureDate: string,
  returnDate: string,
  reply: FastifyReply,
): boolean {
  if (new Date(returnDate) < new Date(departureDate)) {
    reply.code(HTTP_STATUS.BAD_REQUEST).send({
      error: { message: DATE_VALIDATION.RETURN_BEFORE_DEPARTURE },
    });
    return false;
  }
  return true;
}

export async function checkTripExists(
  tripId: string,
  userId: string,
  reply: FastifyReply,
): Promise<typeof trips.$inferSelect | null> {
  const db = getDatabase();
  const [existingTrip] = await db
    .select()
    .from(trips)
    .where(and(eq(trips.id, tripId), eq(trips.userId, userId), isNull(trips.deletedAt)));

  if (!existingTrip) {
    reply.code(HTTP_STATUS.NOT_FOUND).send({
      error: { message: TRIPS_API_MESSAGES.TRIP_NOT_FOUND },
    });
    return null;
  }

  return existingTrip;
}
