-- gaushala.network — PostgreSQL init schema
-- v0.1.0 — 2026-05-12
-- Foundation tables only. Layer tables added per sprint.

-- Trust levels
CREATE TABLE trust_levels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  rank INTEGER NOT NULL UNIQUE,
  can_edit BOOLEAN DEFAULT false,
  edits_require_review BOOLEAN DEFAULT true,
  can_approve BOOLEAN DEFAULT false,
  can_moderate BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO trust_levels (name, rank, can_edit, edits_require_review, can_approve, can_moderate) VALUES
  ('anonymous',        0, false, true,  false, false),
  ('registered',       1, true,  true,  false, false),
  ('email_verified',   2, true,  true,  false, false),
  ('contributor',      3, true,  false, false, false),
  ('verified_expert',  4, true,  false, false, false),
  ('trusted_editor',   5, true,  false, true,  false),
  ('moderator',        6, true,  false, true,  true),
  ('admin',            7, true,  false, true,  true);

-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  display_name VARCHAR(100),
  trust_level_id INTEGER REFERENCES trust_levels(id) DEFAULT 2,
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User profiles
CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  expertise VARCHAR(255),
  organisation VARCHAR(255),
  website VARCHAR(255),
  location VARCHAR(255),
  avatar_url VARCHAR(500),
  blockchain_address VARCHAR(255),
  contribution_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trust level change log
CREATE TABLE trust_level_changes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  from_level INTEGER REFERENCES trust_levels(id),
  to_level INTEGER REFERENCES trust_levels(id),
  changed_by INTEGER REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pipeline jobs log
CREATE TABLE pipeline_jobs (
  id SERIAL PRIMARY KEY,
  job_name VARCHAR(100) NOT NULL,
  source VARCHAR(255),
  status VARCHAR(20) DEFAULT 'running',
  records_attempted INTEGER DEFAULT 0,
  records_succeeded INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_detail TEXT,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Blockchain records
CREATE TABLE blockchain_records (
  id SERIAL PRIMARY KEY,
  record_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  tx_hash VARCHAR(255) UNIQUE,
  network VARCHAR(50) DEFAULT 'polygon',
  data_hash VARCHAR(255),
  explorer_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_trust_level ON users(trust_level_id);
CREATE INDEX idx_pipeline_jobs_status ON pipeline_jobs(status);
CREATE INDEX idx_blockchain_records_entity ON blockchain_records(entity_type, entity_id);
