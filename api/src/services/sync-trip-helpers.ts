import { eq, and } from 'drizzle-orm';

import { Trip } from '@usa-presence/shared';

import { getDatabase } from '@api/db/connection';
import { trips } from '@api/db/schema';
import {
  createForbiddenError,
  createInvalidTripDataError,
  createMissingFieldsError,
} from '@api/services/sync-error-helpers';
import { sanitizeTripDates } from '@api/utils/sync-validation';

export async function processSingleTrip(
  trip: Trip,
  userId: string,
  syncVersion: number,
): Promise<{ success: boolean; error?: Error }> {
  if (trip.userId !== userId) {
    return { success: false, error: createForbiddenError('Cannot modify other users data') };
  }

  let sanitizedTrip;
  try {
    sanitizedTrip = sanitizeTripDates(trip);
  } catch (error) {
    return {
      success: false,
      error: createInvalidTripDataError(
        error instanceof Error ? error.message : 'Invalid trip data',
      ),
    };
  }

  if (!sanitizedTrip.id || !sanitizedTrip.departureDate || !sanitizedTrip.returnDate) {
    return { success: false, error: createMissingFieldsError('Missing required trip fields') };
  }

  const db = getDatabase();
  const [existingTrip] = await db
    .select()
    .from(trips)
    .where(and(eq(trips.id, sanitizedTrip.id as string), eq(trips.userId, userId)));

  if (existingTrip) {
    await updateExistingTrip(sanitizedTrip, userId, syncVersion);
  } else {
    await createNewTrip(sanitizedTrip, userId, syncVersion);
  }

  return { success: true };
}

export async function updateExistingTrip(
  sanitizedTrip: Record<string, unknown>,
  userId: string,
  syncVersion: number,
): Promise<void> {
  const db = getDatabase();
  await db
    .update(trips)
    .set({
      departureDate: sanitizedTrip.departureDate as string,
      returnDate: sanitizedTrip.returnDate as string,
      location: sanitizedTrip.location as string | undefined,
      isSimulated: sanitizedTrip.isSimulated as boolean | undefined,
      syncId: sanitizedTrip.syncId as string | undefined,
      deviceId: sanitizedTrip.deviceId as string | undefined,
      syncVersion,
      syncStatus:
        (sanitizedTrip.syncStatus as 'local' | 'pending' | 'synced' | null | undefined) || 'local',
      deletedAt: sanitizedTrip.deletedAt as string | undefined,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(trips.id, sanitizedTrip.id as string), eq(trips.userId, userId)));
}

export async function createNewTrip(
  sanitizedTrip: Record<string, unknown>,
  userId: string,
  syncVersion: number,
): Promise<void> {
  const db = getDatabase();
  await db.insert(trips).values({
    id: sanitizedTrip.id as string,
    userId,
    departureDate: sanitizedTrip.departureDate as string,
    returnDate: sanitizedTrip.returnDate as string,
    location: sanitizedTrip.location as string | undefined,
    isSimulated: (sanitizedTrip.isSimulated as boolean) || false,
    syncId: sanitizedTrip.syncId as string | undefined,
    deviceId: sanitizedTrip.deviceId as string | undefined,
    syncVersion,
    syncStatus:
      (sanitizedTrip.syncStatus as 'local' | 'pending' | 'synced' | null | undefined) || 'local',
    deletedAt: sanitizedTrip.deletedAt as string | undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}
