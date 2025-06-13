import { SyncConflict, Trip } from '@usa-presence/shared';

import { trips } from '@api/db/schema';

export function createDeleteUpdateConflict(
  incomingTrip: Trip,
  currentTrip: typeof trips.$inferSelect,
  baseVersion: number,
): SyncConflict {
  return {
    entityType: 'trip',
    entityId: incomingTrip.id,
    conflictType: 'delete_update',
    serverVersion: currentTrip,
    localVersion: {
      data: incomingTrip as Record<string, unknown>,
      syncVersion: incomingTrip.syncVersion || baseVersion,
      modifiedAt: incomingTrip.updatedAt,
      deviceId: incomingTrip.deviceId || '',
    },
  };
}

export function checkVersionConflict(
  incomingTrip: Trip,
  currentTrip: typeof trips.$inferSelect,
  baseVersion: number,
): SyncConflict | null {
  const incomingBaseVersion = incomingTrip.syncVersion || 0;
  const currentVersion = currentTrip.syncVersion || 0;

  if (currentVersion <= incomingBaseVersion) {
    return null;
  }

  const conflictingFields = detectConflictingFields(incomingTrip, currentTrip);

  return {
    entityType: 'trip',
    entityId: incomingTrip.id,
    conflictType: 'update_update',
    conflictingFields,
    serverVersion: currentTrip,
    localVersion: {
      data: incomingTrip as Record<string, unknown>,
      syncVersion: incomingTrip.syncVersion || baseVersion,
      modifiedAt: incomingTrip.updatedAt,
      deviceId: incomingTrip.deviceId || '',
    },
    remoteVersion: {
      data: currentTrip as Record<string, unknown>,
      syncVersion: currentTrip.syncVersion || 0,
      modifiedAt: currentTrip.updatedAt || new Date().toISOString(),
      deviceId: currentTrip.deviceId || '',
    },
  };
}

export function detectConflictingFields(
  incoming: Trip,
  current: {
    departureDate?: string | null;
    returnDate?: string | null;
    location?: string | null;
    isSimulated?: boolean | null;
  },
): string[] {
  const fields: string[] = [];

  if (incoming.departureDate !== current.departureDate) fields.push('departureDate');
  if (incoming.returnDate !== current.returnDate) fields.push('returnDate');
  if (incoming.location !== current.location) fields.push('location');
  if (incoming.isSimulated !== current.isSimulated) fields.push('isSimulated');

  return fields;
}
