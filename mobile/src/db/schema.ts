import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  greenCardDate: text('green_card_date').notNull(),
  eligibilityCategory: text('eligibility_category').notNull(),
  dateOfBirth: text('date_of_birth'),
  greenCardNumber: text('green_card_number'),
  countryOfCitizenship: text('country_of_citizenship'),
  selectiveServiceRegistered: integer('selective_service_registered', { mode: 'boolean' }),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  lastSyncedAt: text('last_synced_at'),
});

export const trips = sqliteTable('trips', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  departureDate: text('departure_date').notNull(),
  returnDate: text('return_date'),
  destination: text('destination').notNull(),
  notes: text('notes'),
  tags: text('tags'),
  transportMode: text('transport_mode'),
  flightNumber: text('flight_number'),
  purpose: text('purpose'),
  isDeleted: integer('is_deleted', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  syncVersion: integer('sync_version').default(0),
}, (table) => ({
  userIdIdx: index('trips_user_id_idx').on(table.userId),
  departureDateIdx: index('trips_departure_date_idx').on(table.departureDate),
}));

export const userSettings = sqliteTable('user_settings', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  notificationsEnabled: integer('notifications_enabled', { mode: 'boolean' }).default(true),
  riskWarningDays: integer('risk_warning_days').default(30),
  milestoneNotifications: integer('milestone_notifications', { mode: 'boolean' }).default(true),
  biometricAuthEnabled: integer('biometric_auth_enabled', { mode: 'boolean' }).default(false),
  theme: text('theme').default('system'),
  language: text('language').default('en'),
  autoBackup: integer('auto_backup', { mode: 'boolean' }).default(true),
  backupFrequency: text('backup_frequency').default('weekly'),
  syncEnabled: integer('sync_enabled', { mode: 'boolean' }).default(true),
  lastBackupDate: text('last_backup_date'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const syncQueue = sqliteTable('sync_queue', {
  id: text('id').primaryKey(),
  operation: text('operation').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  data: text('data'),
  retryCount: integer('retry_count').default(0),
  lastAttempt: text('last_attempt'),
  createdAt: text('created_at').notNull(),
}, (table) => ({
  entityIdx: index('sync_queue_entity_idx').on(table.entityType, table.entityId),
}));

export const auditLog = sqliteTable('audit_log', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  oldData: text('old_data'),
  newData: text('new_data'),
  timestamp: text('timestamp').notNull(),
}, (table) => ({
  userIdIdx: index('audit_log_user_id_idx').on(table.userId),
  timestampIdx: index('audit_log_timestamp_idx').on(table.timestamp),
}));