-- QCI Portal — PostgreSQL Queries
-- Connection: QCI Portal (PostgreSQL)

-- ── Overview counts ───────────────────────────────────────────────
SELECT
  (SELECT COUNT(*) FROM users)        AS total_users,
  (SELECT COUNT(*) FROM jobs)         AS total_jobs,
  (SELECT COUNT(*) FROM applications) AS total_applications,
  (SELECT COUNT(*) FROM gallery)      AS total_gallery;

-- ── All users ─────────────────────────────────────────────────────
SELECT id, name, email, role, company_name, created_at
FROM users
ORDER BY created_at DESC;

-- ── All active jobs ───────────────────────────────────────────────
SELECT id, title, company, location, category, experience_min, experience_max,
       salary_min, salary_max, openings, is_active, created_at
FROM jobs
WHERE is_active = 1
ORDER BY created_at DESC;

-- ── Applications with job and user details ────────────────────────
SELECT
  a.id,
  a.full_name,
  a.email,
  j.title  AS job_title,
  j.company,
  a.match_score,
  a.status,
  a.applied_at
FROM applications a
JOIN jobs j ON a.job_id = j.id
ORDER BY a.applied_at DESC;

-- ── Applications by status ────────────────────────────────────────
SELECT status, COUNT(*) AS count
FROM applications
GROUP BY status
ORDER BY count DESC;

-- ── HR and Super Admin accounts ───────────────────────────────────
SELECT id, name, email, role, created_at
FROM users
WHERE role IN ('hr', 'super_admin')
ORDER BY role;

-- ── Gallery items ─────────────────────────────────────────────────
SELECT id, title, category, is_active, display_order, created_at
FROM gallery
ORDER BY display_order ASC, created_at DESC;

-- ── Settings ─────────────────────────────────────────────────────
SELECT key, value FROM settings ORDER BY key;

-- ── Reset a user password (replace email and hash as needed) ─────
-- UPDATE users
-- SET password = '$2b$12$...'   -- bcrypt hash
-- WHERE email = 'user@example.com';

-- ── Deactivate a job ─────────────────────────────────────────────
-- UPDATE jobs SET is_active = 0 WHERE id = 1;
