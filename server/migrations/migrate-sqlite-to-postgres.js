/**
 * One-time migration: SQLite → PostgreSQL
 * Run: node migrations/migrate-sqlite-to-postgres.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const Database = require('better-sqlite3');
const { Pool } = require('pg');
const path = require('path');

const sqlite = new Database(path.join(__dirname, '../jobportal.db'), { readonly: true });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── users ──────────────────────────────────────────────────────────
    console.log('Migrating users...');
    const users = sqlite.prepare('SELECT * FROM users').all();
    for (const u of users) {
      await client.query(`
        INSERT INTO users (id, name, email, password, phone, pincode, city, state, role,
          company_name, hr_role_id, is_verified, bio, skills, experience_years, current_company,
          profile_resume_path, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
        ON CONFLICT (id) DO NOTHING
      `, [u.id, u.name, u.email, u.password, u.phone, u.pincode, u.city, u.state, u.role,
          u.company_name, u.hr_role_id, u.is_verified ?? 1, u.bio, u.skills,
          u.experience_years ?? 0, u.current_company, u.profile_resume_path,
          u.created_at ? new Date(u.created_at) : new Date()]);
    }
    console.log(`  ✓ ${users.length} users`);

    // ── jobs ───────────────────────────────────────────────────────────
    console.log('Migrating jobs...');
    const jobs = sqlite.prepare('SELECT * FROM jobs').all();
    for (const j of jobs) {
      await client.query(`
        INSERT INTO jobs (id, employer_id, title, company, location, job_type, category, department,
          experience_min, experience_max, salary_min, salary_max, description, requirements,
          skills, openings, is_active, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
        ON CONFLICT (id) DO NOTHING
      `, [j.id, j.employer_id, j.title, j.company, j.location, j.job_type, j.category,
          j.department || 'General', j.experience_min ?? 0, j.experience_max ?? 5,
          j.salary_min, j.salary_max, j.description, j.requirements, j.skills,
          j.openings ?? 1, j.is_active ?? 1,
          j.created_at ? new Date(j.created_at) : new Date()]);
    }
    console.log(`  ✓ ${jobs.length} jobs`);

    // ── applications ───────────────────────────────────────────────────
    console.log('Migrating applications...');
    const apps = sqlite.prepare('SELECT * FROM applications').all();
    for (const a of apps) {
      await client.query(`
        INSERT INTO applications (id, job_id, applicant_id, full_name, email, phone, pincode, city,
          state, experience_years, current_company, current_ctc, expected_ctc, notice_period,
          cover_letter, resume_path, skills, status, match_score, applied_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
        ON CONFLICT (id) DO NOTHING
      `, [a.id, a.job_id, a.applicant_id, a.full_name, a.email, a.phone, a.pincode,
          a.city, a.state, a.experience_years ?? 0, a.current_company, a.current_ctc,
          a.expected_ctc, a.notice_period, a.cover_letter, a.resume_path, a.skills,
          a.status || 'pending', a.match_score ?? 0,
          a.applied_at ? new Date(a.applied_at) : new Date()]);
    }
    console.log(`  ✓ ${apps.length} applications`);

    // ── settings ───────────────────────────────────────────────────────
    console.log('Migrating settings...');
    const settings = sqlite.prepare('SELECT * FROM settings').all();
    for (const s of settings) {
      await client.query(`
        INSERT INTO settings (key, value, label, category)
        VALUES ($1,$2,$3,$4)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `, [s.key, s.value, s.label, s.category || 'general']);
    }
    console.log(`  ✓ ${settings.length} settings`);

    // ── bookmarks ──────────────────────────────────────────────────────
    console.log('Migrating bookmarks...');
    const bmarks = sqlite.prepare('SELECT * FROM bookmarks').all();
    for (const b of bmarks) {
      await client.query(`
        INSERT INTO bookmarks (id, user_id, job_id, created_at)
        VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING
      `, [b.id, b.user_id, b.job_id, b.created_at ? new Date(b.created_at) : new Date()]);
    }
    console.log(`  ✓ ${bmarks.length} bookmarks`);

    // ── hr_roles ───────────────────────────────────────────────────────
    console.log('Migrating hr_roles...');
    const roles = sqlite.prepare('SELECT * FROM hr_roles').all();
    for (const r of roles) {
      await client.query(`
        INSERT INTO hr_roles (id, name, description, permissions, created_by, created_at)
        VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING
      `, [r.id, r.name, r.description, r.permissions || '[]', r.created_by,
          r.created_at ? new Date(r.created_at) : new Date()]);
    }
    console.log(`  ✓ ${roles.length} hr_roles`);

    // ── gallery ────────────────────────────────────────────────────────
    console.log('Migrating gallery...');
    const gallery = sqlite.prepare('SELECT * FROM gallery').all();
    for (const g of gallery) {
      await client.query(`
        INSERT INTO gallery (id, title, description, image_path, category, display_order, is_active, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING
      `, [g.id, g.title, g.description, g.image_path, g.category || 'general',
          g.display_order ?? 0, g.is_active ?? 1,
          g.created_at ? new Date(g.created_at) : new Date()]);
    }
    console.log(`  ✓ ${gallery.length} gallery items`);

    // ── board_config ───────────────────────────────────────────────────
    console.log('Migrating board_config...');
    const boards = sqlite.prepare('SELECT * FROM board_config').all();
    for (const b of boards) {
      await client.query(`
        INSERT INTO board_config (id, code, name, full_name, description, image_path, color, display_order, is_active, board_type)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO NOTHING
      `, [b.id, b.code, b.name, b.full_name, b.description, b.image_path,
          b.color || 'blue-600', b.display_order ?? 0, b.is_active ?? 1, b.board_type || 'board']);
    }
    console.log(`  ✓ ${boards.length} board_config entries`);

    // ── otp_verifications ──────────────────────────────────────────────
    console.log('Migrating otp_verifications...');
    const otps = sqlite.prepare('SELECT * FROM otp_verifications').all();
    for (const o of otps) {
      await client.query(`
        INSERT INTO otp_verifications (id, email, otp, expires_at, verified, created_at)
        VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING
      `, [o.id, o.email, o.otp, new Date(o.expires_at), o.verified ?? 0,
          o.created_at ? new Date(o.created_at) : new Date()]);
    }
    console.log(`  ✓ ${otps.length} OTP records`);

    // ── password_reset_tokens ──────────────────────────────────────────
    console.log('Migrating password_reset_tokens...');
    const tokens = sqlite.prepare('SELECT * FROM password_reset_tokens').all();
    for (const t of tokens) {
      await client.query(`
        INSERT INTO password_reset_tokens (id, email, token, expires_at, used, created_at)
        VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING
      `, [t.id, t.email, t.token, new Date(t.expires_at), t.used ?? 0,
          t.created_at ? new Date(t.created_at) : new Date()]);
    }
    console.log(`  ✓ ${tokens.length} reset tokens`);

    // ── Reset all sequences to max id ──────────────────────────────────
    const tables = ['users','jobs','applications','bookmarks','otp_verifications',
                    'hr_roles','gallery','board_config','password_reset_tokens',
                    'application_status_history','job_alerts'];
    for (const t of tables) {
      await client.query(`SELECT setval(pg_get_serial_sequence('${t}', 'id'), COALESCE(MAX(id), 1)) FROM ${t}`);
    }
    console.log('  ✓ Sequences reset');

    await client.query('COMMIT');
    console.log('\n✅ Migration complete!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
    sqlite.close();
  }
}

migrate().catch(err => { console.error(err); process.exit(1); });
