// Internal dependencies - Schemas & Types
import { SyncMetadataSchema, SyncDeviceSchema, SyncConflictSchema } from '@schemas/sync';

describe('Sync Schemas', () => {
  describe('SyncMetadataSchema', () => {
    it('should validate complete sync metadata', () => {
      const validMetadata = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e4567-e89b-12d3-a456-426614174000',
        deviceId: 'device_789e4567-e89b-12d3-a456-426614174000',
        deviceName: "John's iPhone 14",
        lastModified: '2024-01-15T10:30:00.000Z',
        syncVersion: 5,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      };

      const result = SyncMetadataSchema.safeParse(validMetadata);
      expect(result.success).toBe(true);
    });

    it('should validate sync metadata without device name', () => {
      const validMetadata = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e4567-e89b-12d3-a456-426614174000',
        deviceId: 'device_789e4567-e89b-12d3-a456-426614174000',
        lastModified: new Date().toISOString(),
        syncVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = SyncMetadataSchema.safeParse(validMetadata);
      expect(result.success).toBe(true);
    });

    it('should reject negative sync version', () => {
      const invalidMetadata = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e4567-e89b-12d3-a456-426614174000',
        deviceId: 'device_789e4567-e89b-12d3-a456-426614174000',
        lastModified: new Date().toISOString(),
        syncVersion: -1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = SyncMetadataSchema.safeParse(invalidMetadata);
      expect(result.success).toBe(false);
    });
  });

  describe('SyncDeviceSchema', () => {
    it('should validate device information', () => {
      const validDevice = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        deviceId: 'device_789e4567-e89b-12d3-a456-426614174000',
        deviceName: "Maria's iPad Pro",
        deviceType: 'tablet' as const,
        lastActiveAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      const result = SyncDeviceSchema.safeParse(validDevice);
      expect(result.success).toBe(true);
    });

    it('should validate phone device type', () => {
      const validDevice = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        deviceId: 'device_789e4567-e89b-12d3-a456-426614174000',
        deviceName: 'Pixel 8 Pro',
        deviceType: 'phone' as const,
        lastActiveAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      const result = SyncDeviceSchema.safeParse(validDevice);
      expect(result.success).toBe(true);
    });

    it('should reject invalid device type', () => {
      const invalidDevice = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        deviceId: 'device_789e4567-e89b-12d3-a456-426614174000',
        deviceName: 'Unknown Device',
        deviceType: 'laptop',
        lastActiveAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      const result = SyncDeviceSchema.safeParse(invalidDevice);
      expect(result.success).toBe(false);
    });
  });

  describe('SyncConflictSchema', () => {
    it('should validate sync conflict data', () => {
      const validConflict = {
        entityType: 'trip' as const,
        entityId: '123e4567-e89b-12d3-a456-426614174000',
        localVersion: {
          data: { location: 'Paris, France' },
          syncVersion: 3,
          modifiedAt: '2024-01-15T10:00:00.000Z',
          deviceId: 'device_111',
        },
        remoteVersion: {
          data: { location: 'Paris, France (CDG)' },
          syncVersion: 3,
          modifiedAt: '2024-01-15T10:05:00.000Z',
          deviceId: 'device_222',
        },
      };

      const result = SyncConflictSchema.safeParse(validConflict);
      expect(result.success).toBe(true);
    });

    it('should validate user settings conflict', () => {
      const validConflict = {
        entityType: 'user_settings' as const,
        entityId: '456e4567-e89b-12d3-a456-426614174000',
        localVersion: {
          data: { theme: 'dark' },
          syncVersion: 2,
          modifiedAt: '2024-01-14T09:00:00.000Z',
          deviceId: 'device_333',
        },
        remoteVersion: {
          data: { theme: 'light' },
          syncVersion: 2,
          modifiedAt: '2024-01-14T09:30:00.000Z',
          deviceId: 'device_444',
        },
      };

      const result = SyncConflictSchema.safeParse(validConflict);
      expect(result.success).toBe(true);
    });

    it('should reject invalid entity type', () => {
      const invalidConflict = {
        entityType: 'invalid_type',
        entityId: '456e4567-e89b-12d3-a456-426614174000',
        localVersion: {
          data: {},
          syncVersion: 1,
          modifiedAt: new Date().toISOString(),
          deviceId: 'device_555',
        },
        remoteVersion: {
          data: {},
          syncVersion: 1,
          modifiedAt: new Date().toISOString(),
          deviceId: 'device_666',
        },
      };

      const result = SyncConflictSchema.safeParse(invalidConflict);
      expect(result.success).toBe(false);
    });
  });
});
