import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  greenCardDate: text('green_card_date').notNull(),
  eligibilityCategory: text('eligibility_category', {
    enum: ['three_year', 'five_year'],
  }).notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const authProviders = sqliteTable('auth_providers', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider', { enum: ['apple', 'google'] }).notNull(),
  providerId: text('provider_id').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const userSettings = sqliteTable('user_settings', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  notificationMilestones: integer('notification_milestones', { mode: 'boolean' })
    .notNull()
    .default(true),
  notificationWarnings: integer('notification_warnings', { mode: 'boolean' })
    .notNull()
    .default(true),
  notificationReminders: integer('notification_reminders', { mode: 'boolean' })
    .notNull()
    .default(true),
  biometricAuthEnabled: integer('biometric_auth_enabled', { mode: 'boolean' })
    .notNull()
    .default(false),
  theme: text('theme', { enum: ['light', 'dark', 'system'] })
    .notNull()
    .default('system'),
  language: text('language', { enum: ['en', 'es'] })
    .notNull()
    .default('en'),
  syncEnabled: integer('sync_enabled', { mode: 'boolean' }).notNull().default(false),
  syncSubscriptionTier: text('sync_subscription_tier', { enum: ['none', 'basic', 'premium'] })
    .notNull()
    .default('none'),
  syncLastSyncAt: text('sync_last_sync_at'),
  syncDeviceId: text('sync_device_id'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const trips = sqliteTable('trips', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  departureDate: text('departure_date').notNull(),
  returnDate: text('return_date').notNull(),
  location: text('location'),
  isSimulated: integer('is_simulated', { mode: 'boolean' }).notNull().default(false),
  syncId: text('sync_id'),
  deviceId: text('device_id'),
  syncVersion: integer('sync_version').default(0),
  syncStatus: text('sync_status', { enum: ['local', 'pending', 'synced'] }).default('local'),
  deletedAt: text('deleted_at'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  metadata: text('metadata'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const encryptionKeys = sqliteTable('encryption_keys', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  keyHash: text('key_hash').notNull(),
  salt: text('salt').notNull(),
  algorithm: text('algorithm').notNull().default('aes-256-gcm'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  rotatedAt: text('rotated_at'),
});

export const syncMetadata = sqliteTable('sync_metadata', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  deviceId: text('device_id').notNull(),
  deviceName: text('device_name'),
  lastModified: text('last_modified').notNull(),
  syncVersion: integer('sync_version').notNull().default(1),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const syncDevices = sqliteTable('sync_devices', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  deviceId: text('device_id').notNull().unique(),
  deviceName: text('device_name').notNull(),
  deviceType: text('device_type', { enum: ['phone', 'tablet'] }).notNull(),
  lastActiveAt: text('last_active_at').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type AuthProvider = typeof authProviders.$inferSelect;
export type NewAuthProvider = typeof authProviders.$inferInsert;
export type UserSetting = typeof userSettings.$inferSelect;
export type NewUserSetting = typeof userSettings.$inferInsert;
export type Trip = typeof trips.$inferSelect;
export type NewTrip = typeof trips.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type EncryptionKey = typeof encryptionKeys.$inferSelect;
export type NewEncryptionKey = typeof encryptionKeys.$inferInsert;
export type SyncMetadata = typeof syncMetadata.$inferSelect;
export type NewSyncMetadata = typeof syncMetadata.$inferInsert;
export type SyncDevice = typeof syncDevices.$inferSelect;
export type NewSyncDevice = typeof syncDevices.$inferInsert;

// Re-export auth schema
export * from './auth-schema';
