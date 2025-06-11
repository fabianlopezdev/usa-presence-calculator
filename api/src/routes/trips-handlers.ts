import { FastifyReply, FastifyRequest } from 'fastify';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { z } from 'zod';

import { TripCreateSchema, TripUpdateSchema } from '@usa-presence/shared';
import { HTTP_STATUS } from '@api/constants/http';
import { TRIPS_API_MESSAGES } from '@api/constants/trips';
import { getDatabase } from '@api/db/connection';
import { trips } from '@api/db/schema';
import {
  normalizeTrip,
  validateTripCreateData,
  validateTripUpdateData,
  validateDateRange,
  checkTripExists,
} from './trips-helpers';

type CreateTripRequest = FastifyRequest<{
  Body: z.infer<typeof TripCreateSchema>;
}>;

type GetTripRequest = FastifyRequest<{
  Params: { id: string };
}>;

type UpdateTripRequest = FastifyRequest<{
  Params: { id: string };
  Body: z.infer<typeof TripUpdateSchema>;
}>;

type DeleteTripRequest = FastifyRequest<{
  Params: { id: string };
}>;

export async function createTripHandler(
  request: CreateTripRequest,
  reply: FastifyReply,
): Promise<void> {
  const userId = request.user?.userId;
  if (!userId) {
    return reply.code(HTTP_STATUS.UNAUTHORIZED).send({
      error: { message: 'Unauthorized' },
    });
  }

  const validatedData = validateTripCreateData(request.body, reply);
  if (!validatedData) return;

  const db = getDatabase();
  const tripId = createId();
  const now = new Date().toISOString();

  const tripData = {
    id: tripId,
    userId,
    departureDate: validatedData.departureDate,
    returnDate: validatedData.returnDate,
    location: validatedData.location || null,
    isSimulated: false,
    syncStatus: 'local' as const,
    syncVersion: 0,
    createdAt: now,
    updatedAt: now,
  };

  const [newTrip] = await db.insert(trips).values(tripData).returning();

  return reply.code(HTTP_STATUS.CREATED).send(normalizeTrip(newTrip));
}

export async function getAllTripsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const userId = request.user?.userId;
  if (!userId) {
    return reply.code(HTTP_STATUS.UNAUTHORIZED).send({
      error: { message: 'Unauthorized' },
    });
  }
  const db = getDatabase();

  const userTrips = await db
    .select()
    .from(trips)
    .where(and(eq(trips.userId, userId), isNull(trips.deletedAt)))
    .orderBy(desc(trips.departureDate));

  return reply.code(HTTP_STATUS.OK).send(userTrips.map(normalizeTrip));
}

export async function getTripByIdHandler(
  request: GetTripRequest,
  reply: FastifyReply,
): Promise<void> {
  const { id: tripId } = request.params;
  const userId = request.user?.userId;
  if (!userId) {
    return reply.code(HTTP_STATUS.UNAUTHORIZED).send({
      error: { message: 'Unauthorized' },
    });
  }
  const db = getDatabase();

  const [trip] = await db
    .select()
    .from(trips)
    .where(and(eq(trips.id, tripId), eq(trips.userId, userId), isNull(trips.deletedAt)));

  if (!trip) {
    return reply.code(HTTP_STATUS.NOT_FOUND).send({
      error: { message: TRIPS_API_MESSAGES.TRIP_NOT_FOUND },
    });
  }

  return reply.code(HTTP_STATUS.OK).send(normalizeTrip(trip));
}

export async function updateTripHandler(
  request: UpdateTripRequest,
  reply: FastifyReply,
): Promise<void> {
  const { id: tripId } = request.params;
  const userId = request.user?.userId;
  if (!userId) {
    return reply.code(HTTP_STATUS.UNAUTHORIZED).send({
      error: { message: 'Unauthorized' },
    });
  }

  const validatedData = validateTripUpdateData(request.body, reply);
  if (!validatedData) return;

  const existingTrip = await checkTripExists(tripId, userId, reply);
  if (!existingTrip) return;

  // If updating dates, validate the combination
  const finalDates = {
    departureDate: validatedData.departureDate || existingTrip.departureDate,
    returnDate: validatedData.returnDate || existingTrip.returnDate,
  };

  if (!validateDateRange(finalDates.departureDate, finalDates.returnDate, reply)) {
    return;
  }

  const db = getDatabase();
  const [updatedTrip] = await db
    .update(trips)
    .set({
      ...validatedData,
      updatedAt: new Date().toISOString(),
      syncVersion: (existingTrip.syncVersion || 0) + 1,
      syncStatus: 'local',
    })
    .where(eq(trips.id, tripId))
    .returning();

  return reply.code(HTTP_STATUS.OK).send(normalizeTrip(updatedTrip));
}

export async function deleteTripHandler(
  request: DeleteTripRequest,
  reply: FastifyReply,
): Promise<void> {
  const { id: tripId } = request.params;
  const userId = request.user?.userId;
  if (!userId) {
    return reply.code(HTTP_STATUS.UNAUTHORIZED).send({
      error: { message: 'Unauthorized' },
    });
  }

  const existingTrip = await checkTripExists(tripId, userId, reply);
  if (!existingTrip) return;

  const db = getDatabase();
  await db
    .update(trips)
    .set({
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncVersion: (existingTrip.syncVersion || 0) + 1,
      syncStatus: 'local',
    })
    .where(eq(trips.id, tripId));

  return reply.code(HTTP_STATUS.NO_CONTENT).send();
}
