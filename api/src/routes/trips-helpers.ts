import { z } from 'zod';
import { FastifyReply } from 'fastify';
import { eq, and, isNull } from 'drizzle-orm';

import { TripCreateSchema, TripUpdateSchema } from '@usa-presence/shared';
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

export function isValidDate(dateString: string): boolean {
  // Check format first
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }

  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  // Check if the date components match what was input
  // This catches invalid dates like Feb 29 on non-leap years or April 31
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function validateTripCreateData(
  body: unknown,
  reply: FastifyReply,
): z.infer<typeof TripCreateSchema> | null {
  try {
    const validatedData = TripCreateSchema.parse(body);

    // Additional date validation
    if (!isValidDate(validatedData.departureDate) || !isValidDate(validatedData.returnDate)) {
      reply.code(HTTP_STATUS.BAD_REQUEST).send({
        error: {
          message: 'Invalid date format',
          details: [{ message: 'Date must be a valid calendar date in YYYY-MM-DD format' }],
        },
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

    // Additional date validation if dates are being updated
    if (validatedData.departureDate && !isValidDate(validatedData.departureDate)) {
      reply.code(HTTP_STATUS.BAD_REQUEST).send({
        error: {
          message: 'Invalid departure date format',
          details: [{ message: 'Date must be a valid calendar date in YYYY-MM-DD format' }],
        },
      });
      return null;
    }

    if (validatedData.returnDate && !isValidDate(validatedData.returnDate)) {
      reply.code(HTTP_STATUS.BAD_REQUEST).send({
        error: {
          message: 'Invalid return date format',
          details: [{ message: 'Date must be a valid calendar date in YYYY-MM-DD format' }],
        },
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
      error: { message: 'Return date must be after departure date' },
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
