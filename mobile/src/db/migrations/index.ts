import { openDatabaseSync } from 'expo-sqlite';

interface Migration {
  version: number;
  name: string;
  sql: string;
}

const initialSchemaSql = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  green_card_date TEXT NOT NULL,
  eligibility_category TEXT NOT NULL,
  date_of_birth TEXT,
  green_card_number TEXT,
  country_of_citizenship TEXT,
  selective_service_registered INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_synced_at TEXT
);

CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  departure_date TEXT NOT NULL,
  return_date TEXT,
  destination TEXT NOT NULL,
  notes TEXT,
  tags TEXT,
  transport_mode TEXT,
  flight_number TEXT,
  purpose TEXT,
  is_deleted INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sync_version INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS trips_user_id_idx ON trips(user_id);
CREATE INDEX IF NOT EXISTS trips_departure_date_idx ON trips(departure_date);

CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  notifications_enabled INTEGER DEFAULT 1,
  risk_warning_days INTEGER DEFAULT 30,
  milestone_notifications INTEGER DEFAULT 1,
  biometric_auth_enabled INTEGER DEFAULT 0,
  theme TEXT DEFAULT 'system',
  language TEXT DEFAULT 'en',
  auto_backup INTEGER DEFAULT 1,
  backup_frequency TEXT DEFAULT 'weekly',
  sync_enabled INTEGER DEFAULT 1,
  last_backup_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY NOT NULL,
  operation TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  data TEXT,
  retry_count INTEGER DEFAULT 0,
  last_attempt TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS sync_queue_entity_idx ON sync_queue(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_data TEXT,
  new_data TEXT,
  timestamp TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS audit_log_user_id_idx ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS audit_log_timestamp_idx ON audit_log(timestamp);
`;

const migrations: Migration[] = [
  {
    version: 0,
    name: 'initial_schema',
    sql: initialSchemaSql,
  },
];

export async function runMigrations(): Promise<void> {
  const db = openDatabaseSync('usa-presence-calculator.db');
  
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL
      );
    `);

    const appliedMigrations = await db.getAllAsync<{ version: number }>(
      'SELECT version FROM migrations ORDER BY version'
    );
    const appliedVersions = new Set(appliedMigrations.map(m => m.version));

    for (const migration of migrations) {
      if (!appliedVersions.has(migration.version)) {
        await db.execAsync(migration.sql);
        
        await db.runAsync(
          'INSERT INTO migrations (version, name, applied_at) VALUES (?, ?, ?)',
          migration.version,
          migration.name,
          new Date().toISOString()
        );
      }
    }
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}