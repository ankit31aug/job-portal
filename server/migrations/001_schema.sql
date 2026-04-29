-- QCI Job Portal — PostgreSQL Schema
-- Run: psql qci_portal -f migrations/001_schema.sql

BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id               SERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  email            TEXT UNIQUE NOT NULL,
  password         TEXT NOT NULL,
  phone            TEXT,
  pincode          TEXT,
  city             TEXT,
  state            TEXT,
  role             TEXT NOT NULL DEFAULT 'jobseeker',
  company_name     TEXT,
  hr_role_id       INTEGER,
  is_verified      INTEGER DEFAULT 1,
  bio              TEXT,
  skills           TEXT,
  experience_years INTEGER DEFAULT 0,
  current_company  TEXT,
  profile_resume_path TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
  id              SERIAL PRIMARY KEY,
  employer_id     INTEGER NOT NULL REFERENCES users(id),
  title           TEXT NOT NULL,
  company         TEXT NOT NULL,
  location        TEXT NOT NULL,
  job_type        TEXT NOT NULL DEFAULT 'Full-time',
  category        TEXT NOT NULL,
  department      TEXT DEFAULT 'General',
  experience_min  INTEGER DEFAULT 0,
  experience_max  INTEGER DEFAULT 5,
  salary_min      INTEGER,
  salary_max      INTEGER,
  description     TEXT NOT NULL,
  requirements    TEXT NOT NULL,
  skills          TEXT NOT NULL,
  openings        INTEGER DEFAULT 1,
  is_active       INTEGER DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications (
  id               SERIAL PRIMARY KEY,
  job_id           INTEGER NOT NULL REFERENCES jobs(id),
  applicant_id     INTEGER NOT NULL REFERENCES users(id),
  full_name        TEXT NOT NULL,
  email            TEXT NOT NULL,
  phone            TEXT NOT NULL,
  pincode          TEXT NOT NULL,
  city             TEXT,
  state            TEXT,
  experience_years INTEGER DEFAULT 0,
  current_company  TEXT,
  current_ctc      TEXT,
  expected_ctc     TEXT,
  notice_period    TEXT,
  cover_letter     TEXT,
  resume_path      TEXT,
  skills           TEXT,
  status           TEXT DEFAULT 'pending',
  match_score      INTEGER DEFAULT 0,
  applied_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  key      TEXT PRIMARY KEY,
  value    TEXT NOT NULL,
  label    TEXT,
  category TEXT DEFAULT 'general'
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  job_id     INTEGER NOT NULL REFERENCES jobs(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

CREATE TABLE IF NOT EXISTS otp_verifications (
  id         SERIAL PRIMARY KEY,
  email      TEXT NOT NULL,
  otp        TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified   INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_roles (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions TEXT NOT NULL DEFAULT '[]',
  created_by  INTEGER REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gallery (
  id            SERIAL PRIMARY KEY,
  title         TEXT NOT NULL,
  description   TEXT,
  image_path    TEXT,
  category      TEXT DEFAULT 'general',
  display_order INTEGER DEFAULT 0,
  is_active     INTEGER DEFAULT 1,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS board_config (
  id            SERIAL PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  description   TEXT,
  image_path    TEXT,
  color         TEXT DEFAULT 'blue-600',
  display_order INTEGER DEFAULT 0,
  is_active     INTEGER DEFAULT 1,
  board_type    TEXT DEFAULT 'board'
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         SERIAL PRIMARY KEY,
  email      TEXT NOT NULL,
  token      TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used       INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS application_status_history (
  id             SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id),
  status         TEXT NOT NULL,
  note           TEXT,
  changed_by     INTEGER,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_alerts (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id),
  label          TEXT,
  keywords       TEXT,
  location       TEXT,
  category       TEXT,
  experience_min INTEGER,
  experience_max INTEGER,
  is_active      INTEGER DEFAULT 1,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_jobs_department    ON jobs(department);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active     ON jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_employer_id   ON jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_applications_job   ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_user  ON applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user     ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_email          ON otp_verifications(email);
CREATE INDEX IF NOT EXISTS idx_gallery_active     ON gallery(is_active, display_order);

COMMIT;
