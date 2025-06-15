import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

import { db } from '../connection';
import { trips } from '../schema';
import { generateId, getCurrentTimestamp } from '../utils';

type DbTrip = typeof trips.$inferSelect;
type TripInput = Omit<DbTrip, 'id' | 'createdAt' | 'updatedAt' | 'syncVersion' | 'isDeleted'>;

export async function createTrip(
  tripData: TripInput
): Promise<DbTrip> {
  const id = generateId();
  const timestamp = getCurrentTimestamp();
  
  const newTrip = {
    ...tripData,
    id,
    createdAt: timestamp,
    updatedAt: timestamp,
    syncVersion: 0,
    isDeleted: false,
  };

  await db.insert(trips).values(newTrip);
  
  return newTrip as DbTrip;
}

export async function updateTrip(
  id: string,
  updates: Partial<Omit<DbTrip, 'id' | 'createdAt' | 'userId'>>
): Promise<DbTrip | null> {
  const timestamp = getCurrentTimestamp();
  
  const [updated] = await db
    .update(trips)
    .set({
      ...updates,
      updatedAt: timestamp,
      syncVersion: sql`sync_version + 1`,
    })
    .where(eq(trips.id, id))
    .returning();
    
  return updated as DbTrip | null;
}

export async function deleteTrip(id: string): Promise<boolean> {
  const timestamp = getCurrentTimestamp();
  
  const result = await db
    .update(trips)
    .set({
      isDeleted: true,
      updatedAt: timestamp,
      syncVersion: sql`sync_version + 1`,
    })
    .where(eq(trips.id, id));
    
  return result.changes > 0;
}

export async function getTripById(id: string): Promise<DbTrip | null> {
  const [trip] = await db
    .select()
    .from(trips)
    .where(and(
      eq(trips.id, id),
      eq(trips.isDeleted, false)
    ))
    .limit(1);
    
  return trip as DbTrip | null;
}

export async function getTripsByUserId(userId: string): Promise<DbTrip[]> {
  const userTrips = await db
    .select()
    .from(trips)
    .where(and(
      eq(trips.userId, userId),
      eq(trips.isDeleted, false)
    ))
    .orderBy(desc(trips.departureDate));
    
  return userTrips as DbTrip[];
}

export async function getTripsByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<DbTrip[]> {
  const rangeTrips = await db
    .select()
    .from(trips)
    .where(and(
      eq(trips.userId, userId),
      eq(trips.isDeleted, false),
      gte(trips.departureDate, startDate),
      lte(trips.departureDate, endDate)
    ))
    .orderBy(desc(trips.departureDate));
    
  return rangeTrips as DbTrip[];
}

export async function getActiveTripOnDate(
  userId: string,
  date: string
): Promise<DbTrip | null> {
  const [activeTrip] = await db
    .select()
    .from(trips)
    .where(and(
      eq(trips.userId, userId),
      eq(trips.isDeleted, false),
      lte(trips.departureDate, date),
      gte(trips.returnDate, date)
    ))
    .limit(1);
    
  return activeTrip as DbTrip | null;
}

export async function getModifiedTripsSince(
  userId: string,
  timestamp: string
): Promise<DbTrip[]> {
  const modifiedTrips = await db
    .select()
    .from(trips)
    .where(and(
      eq(trips.userId, userId),
      gte(trips.updatedAt, timestamp)
    ))
    .orderBy(desc(trips.updatedAt));
    
  return modifiedTrips as DbTrip[];
}