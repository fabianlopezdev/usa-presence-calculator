import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

import { users } from './schema';

// Auth users table - extends the existing users table with auth-specific fields
export const authUsers = sqliteTable(
  'auth_users',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
    emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
    emailVerifiedAt: integer('email_verified_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    userIdIdx: index('auth_user_id_idx').on(table.userId),
  }),
);

// Passkeys table - stores WebAuthn credentials
export const passkeys = sqliteTable(
  'passkeys',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    credentialId: text('credential_id').notNull().unique(),
    publicKey: text('public_key').notNull(),
    counter: integer('counter').notNull(),
    deviceType: text('device_type'),
    backed_up: integer('backed_up', { mode: 'boolean' }).notNull().default(false),
    transports: text('transports'), // JSON array stored as text
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
    name: text('name'), // User-friendly name for the passkey
  },
  (table) => ({
    userIdIdx: index('passkey_user_id_idx').on(table.userId),
    credentialIdIdx: index('passkey_credential_id_idx').on(table.credentialId),
  }),
);

// Magic links table - stores email authentication tokens
export const magicLinks = sqliteTable(
  'magic_links',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    token: text('token').notNull().unique(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    used: integer('used', { mode: 'boolean' }).notNull().default(false),
    usedAt: integer('used_at', { mode: 'timestamp' }),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    tokenIdx: index('magic_link_token_idx').on(table.token),
    emailIdx: index('magic_link_email_idx').on(table.email),
    expiresAtIdx: index('magic_link_expires_at_idx').on(table.expiresAt),
    userIdIdx: index('magic_link_user_id_idx').on(table.userId),
  }),
);

// Sessions table - stores JWT session information
export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    refreshToken: text('refresh_token').notNull().unique(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    lastActivityAt: integer('last_activity_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    userIdIdx: index('session_user_id_idx').on(table.userId),
    refreshTokenIdx: index('session_refresh_token_idx').on(table.refreshToken),
    expiresAtIdx: index('session_expires_at_idx').on(table.expiresAt),
  }),
);

// Auth attempts table - for rate limiting
export const authAttempts = sqliteTable(
  'auth_attempts',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id'), // Can be null for failed attempts
    identifier: text('identifier').notNull(), // email or IP
    attemptType: text('attempt_type').notNull(), // 'login', 'register', 'magic_link', 'magic_link_verify'
    success: integer('success', { mode: 'boolean' }).notNull().default(false),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    metadata: text('metadata'), // JSON string for additional data
    attemptedAt: integer('attempted_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    userIdIdx: index('auth_attempt_user_id_idx').on(table.userId),
    identifierIdx: index('auth_attempt_identifier_idx').on(table.identifier),
    createdAtIdx: index('auth_attempt_created_at_idx').on(table.createdAt),
    attemptedAtIdx: index('auth_attempt_attempted_at_idx').on(table.attemptedAt),
    identifierTypeIdx: index('auth_attempt_identifier_type_idx').on(
      table.identifier,
      table.attemptType,
    ),
  }),
);

// Type exports
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type Passkey = InferSelectModel<typeof passkeys>;
export type NewPasskey = InferInsertModel<typeof passkeys>;
export type MagicLink = InferSelectModel<typeof magicLinks>;
export type NewMagicLink = InferInsertModel<typeof magicLinks>;
export type Session = InferSelectModel<typeof sessions>;
export type NewSession = InferInsertModel<typeof sessions>;
export type AuthAttempt = InferSelectModel<typeof authAttempts>;
export type NewAuthAttempt = InferInsertModel<typeof authAttempts>;
