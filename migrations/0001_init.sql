-- LitterScouts D1 Schema (SQLite)
-- Migrated from PostgreSQL/Prisma

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  email TEXT UNIQUE,
  password_hash TEXT,
  username TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  impact_score INTEGER DEFAULT 0,
  notification_email INTEGER DEFAULT 1,
  notification_in_app INTEGER DEFAULT 1,
  areas_of_interest TEXT,
  clerk_id TEXT UNIQUE
);

CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  location_source TEXT NOT NULL CHECK (location_source IN ('exif', 'gps', 'manual')),
  photo_urls TEXT NOT NULL, -- JSON array
  photo_timestamp TEXT,
  litter_type TEXT NOT NULL CHECK (litter_type IN ('plastic', 'metal', 'glass', 'organic', 'hazardous', 'other')),
  quantity TEXT NOT NULL CHECK (quantity IN ('minimal', 'moderate', 'significant', 'severe')),
  description TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  submitted_at TEXT DEFAULT (datetime('now')),
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'disputed')),
  cleaned_at TEXT,
  cleaned_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_reports_created_at ON reports(created_at);
CREATE INDEX idx_reports_cleaned_at ON reports(cleaned_at);
CREATE INDEX idx_reports_lat_lng ON reports(latitude, longitude);
CREATE INDEX idx_reports_litter_type ON reports(litter_type);
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_cleaned_by ON reports(cleaned_by_user_id);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  organizer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  location_name TEXT NOT NULL,
  scheduled_date TEXT NOT NULL,
  duration INTEGER NOT NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled')),
  participant_count INTEGER DEFAULT 0,
  litter_collected REAL,
  photos TEXT, -- JSON array
  equipment_provided INTEGER DEFAULT 0,
  required_items TEXT, -- JSON array
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_events_scheduled_date ON events(scheduled_date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_organizer_id ON events(organizer_id);

CREATE TABLE IF NOT EXISTS event_registrations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  registered_at TEXT DEFAULT (datetime('now')),
  attended INTEGER DEFAULT 0,
  litter_collected REAL,
  contribution_note TEXT,
  UNIQUE(user_id, event_id)
);

CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);

CREATE TABLE IF NOT EXISTS verifications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('verify', 'dispute')),
  comment TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(report_id, user_id)
);

CREATE INDEX idx_verifications_user_id ON verifications(user_id);

CREATE TABLE IF NOT EXISTS environmental_concerns (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  concern_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_environmental_concerns_type ON environmental_concerns(concern_type);
CREATE INDEX idx_environmental_concerns_report ON environmental_concerns(report_id);

CREATE TABLE IF NOT EXISTS hotspots (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  radius REAL NOT NULL,
  report_count INTEGER NOT NULL,
  severity_score REAL NOT NULL,
  last_report_date TEXT NOT NULL,
  calculated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_hotspots_severity ON hotspots(severity_score);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_report', 'new_event', 'event_reminder', 'report_verified', 'report_disputed')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id TEXT,
  related_type TEXT CHECK (related_type IN ('report', 'event')),
  latitude REAL,
  longitude REAL,
  read INTEGER DEFAULT 0,
  email_sent INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_lat_lng ON notifications(latitude, longitude);
