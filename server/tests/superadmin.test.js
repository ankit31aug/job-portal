const request = require('supertest');
const app = require('../app');
const { pool } = require('../db-pg');

let superToken;
let hrToken;
let employerToken;

// Track created IDs for cleanup
let createdHrRoleId;
let createdHrUserId;
let createdGalleryId;
let createdJobId;

const SUPER_EMAIL = 'superadmin@qci.org';
const SUPER_PASS  = 'Admin@123';
const HR_EMAIL    = 'hr-admin@qci.org';
const HR_PASS     = 'Admin@123';
const EMP_EMAIL   = 'nabh@qci.org';
const EMP_PASS    = 'Admin@123';

const TEST_HR_EMAIL = 'sa_test_hr@qci.org';
const TEST_EMAILS   = [TEST_HR_EMAIL];

async function cleanupTestData() {
  // Remove test HR user if created
  const u = (await pool.query('SELECT id FROM users WHERE email = ANY($1::text[])', [TEST_EMAILS])).rows;
  for (const row of u) {
    await pool.query('DELETE FROM job_alerts WHERE user_id = $1', [row.id]);
    await pool.query('DELETE FROM bookmarks WHERE user_id = $1', [row.id]);
    await pool.query('DELETE FROM application_status_history WHERE application_id IN (SELECT id FROM applications WHERE applicant_id = $1)', [row.id]);
    await pool.query('DELETE FROM applications WHERE applicant_id = $1', [row.id]);
  }
  await pool.query('DELETE FROM users WHERE email = ANY($1::text[])', [TEST_EMAILS]);

  if (createdHrRoleId) {
    await pool.query('UPDATE users SET hr_role_id = NULL WHERE hr_role_id = $1', [createdHrRoleId]);
    await pool.query('DELETE FROM hr_roles WHERE id = $1', [createdHrRoleId]);
  }
  if (createdGalleryId) {
    await pool.query('DELETE FROM gallery WHERE id = $1', [createdGalleryId]);
  }
  if (createdJobId) {
    await pool.query('DELETE FROM jobs WHERE id = $1', [createdJobId]);
  }
}

beforeAll(async () => {
  await cleanupTestData();

  const sa = await request(app).post('/api/auth/login').send({ email: SUPER_EMAIL, password: SUPER_PASS });
  superToken = sa.body.token;

  const hr = await request(app).post('/api/auth/login').send({ email: HR_EMAIL, password: HR_PASS });
  hrToken = hr.body.token;

  const emp = await request(app).post('/api/auth/login').send({ email: EMP_EMAIL, password: EMP_PASS });
  employerToken = emp.body.token;
});

afterAll(async () => {
  await cleanupTestData();
});

// ─────────────────────────────────────────────────────────────
// AUTH & ACCESS CONTROL
// ─────────────────────────────────────────────────────────────
describe('Super Admin — Access Control', () => {
  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/superadmin/stats');
    expect(res.status).toBe(401);
  });

  it('returns 403 for HR token', async () => {
    const res = await request(app)
      .get('/api/superadmin/stats')
      .set('Authorization', `Bearer ${hrToken}`);
    expect(res.status).toBe(403);
  });

  it('returns 403 for employer token', async () => {
    const res = await request(app)
      .get('/api/superadmin/stats')
      .set('Authorization', `Bearer ${employerToken}`);
    expect(res.status).toBe(403);
  });

  it('returns 200 for super admin token', async () => {
    const res = await request(app)
      .get('/api/superadmin/stats')
      .set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────────────────────
describe('Super Admin — Dashboard Stats', () => {
  it('returns all required stat fields', async () => {
    const res = await request(app)
      .get('/api/superadmin/stats')
      .set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.totalUsers).toBe('number');
    expect(typeof res.body.totalJobs).toBe('number');
    expect(typeof res.body.totalApplications).toBe('number');
    expect(typeof res.body.hired).toBe('number');
    expect(typeof res.body.hrRoles).toBe('number');
    expect(typeof res.body.galleryItems).toBe('number');
  });

  it('stats counts are non-negative', async () => {
    const res = await request(app)
      .get('/api/superadmin/stats')
      .set('Authorization', `Bearer ${superToken}`);
    expect(res.body.totalUsers).toBeGreaterThanOrEqual(0);
    expect(res.body.totalJobs).toBeGreaterThanOrEqual(0);
  });
});

// ─────────────────────────────────────────────────────────────
// HR ROLE MANAGEMENT
// ─────────────────────────────────────────────────────────────
describe('Super Admin — HR Roles', () => {
  it('lists existing HR roles', async () => {
    const res = await request(app)
      .get('/api/superadmin/hr-roles')
      .set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('name');
      expect(Array.isArray(res.body[0].permissions)).toBe(true);
    }
  });

  it('creates a new HR role with permissions', async () => {
    const res = await request(app)
      .post('/api/superadmin/hr-roles')
      .set('Authorization', `Bearer ${superToken}`)
      .send({
        name: 'SA Test Role',
        description: 'Created by superadmin test suite',
        permissions: ['view_applications', 'manage_jobs'],
      });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('SA Test Role');
    expect(res.body.permissions).toContain('view_applications');
    createdHrRoleId = res.body.id;
  });

  it('rejects role creation without a name', async () => {
    const res = await request(app)
      .post('/api/superadmin/hr-roles')
      .set('Authorization', `Bearer ${superToken}`)
      .send({ description: 'No name', permissions: [] });
    expect(res.status).toBe(400);
  });

  it('updates an existing HR role', async () => {
    const res = await request(app)
      .put(`/api/superadmin/hr-roles/${createdHrRoleId}`)
      .set('Authorization', `Bearer ${superToken}`)
      .send({ name: 'SA Test Role Updated', permissions: ['manage_jobs'] });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('SA Test Role Updated');
    expect(res.body.permissions).toEqual(['manage_jobs']);
  });

  it('returns 404 for non-existent role', async () => {
    const res = await request(app)
      .put('/api/superadmin/hr-roles/99999')
      .set('Authorization', `Bearer ${superToken}`)
      .send({ name: 'Ghost' });
    expect(res.status).toBe(404);
  });

  it('deletes an HR role and nulls assigned users', async () => {
    const res = await request(app)
      .delete(`/api/superadmin/hr-roles/${createdHrRoleId}`)
      .set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
    createdHrRoleId = null;
  });
});

// ─────────────────────────────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────────────────────────────
describe('Super Admin — User Management', () => {
  it('lists users with pagination', async () => {
    const res = await request(app)
      .get('/api/superadmin/users?page=1&limit=5')
      .set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.length).toBeLessThanOrEqual(5);
    expect(typeof res.body.total).toBe('number');
    expect(typeof res.body.pages).toBe('number');
  });

  it('filters users by role', async () => {
    const res = await request(app)
      .get('/api/superadmin/users?role=hr')
      .set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    for (const u of res.body.users) {
      expect(u.role).toBe('hr');
    }
  });

  it('searches users by name/email', async () => {
    const res = await request(app)
      .get('/api/superadmin/users?search=admin')
      .set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  it('creates a new HR user', async () => {
    const res = await request(app)
      .post('/api/superadmin/users/create-hr')
      .set('Authorization', `Bearer ${superToken}`)
      .send({
        name: 'SA Test HR User',
        email: TEST_HR_EMAIL,
        password: 'TestPass@99',
        phone: '9100000099',
      });
    expect(res.status).toBe(201);
    expect(res.body.role).toBe('hr');
    expect(res.body.email).toBe(TEST_HR_EMAIL);
    createdHrUserId = res.body.id;
  });

  it('rejects duplicate email on create-hr', async () => {
    const res = await request(app)
      .post('/api/superadmin/users/create-hr')
      .set('Authorization', `Bearer ${superToken}`)
      .send({ name: 'Dup', email: TEST_HR_EMAIL, password: 'Pass@1234' });
    expect(res.status).toBe(409);
  });

  it('rejects create-hr with missing fields', async () => {
    const res = await request(app)
      .post('/api/superadmin/users/create-hr')
      .set('Authorization', `Bearer ${superToken}`)
      .send({ name: 'No Email' });
    expect(res.status).toBe(400);
  });

  it('changes user role', async () => {
    const res = await request(app)
      .put(`/api/superadmin/users/${createdHrUserId}/role`)
      .set('Authorization', `Bearer ${superToken}`)
      .send({ role: 'employer' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/updated/i);
  });

  it('rejects invalid role value', async () => {
    const res = await request(app)
      .put(`/api/superadmin/users/${createdHrUserId}/role`)
      .set('Authorization', `Bearer ${superToken}`)
      .send({ role: 'god' });
    expect(res.status).toBe(400);
  });

  it('changes user password', async () => {
    const res = await request(app)
      .put(`/api/superadmin/users/${createdHrUserId}/password`)
      .set('Authorization', `Bearer ${superToken}`)
      .send({ password: 'NewPass@123' });
    expect(res.status).toBe(200);
  });

  it('rejects password shorter than 6 chars', async () => {
    const res = await request(app)
      .put(`/api/superadmin/users/${createdHrUserId}/password`)
      .set('Authorization', `Bearer ${superToken}`)
      .send({ password: 'ab1' });
    expect(res.status).toBe(400);
  });

  it('blocks deleting a super_admin account', async () => {
    const sa = (await pool.query("SELECT id FROM users WHERE role = 'super_admin' LIMIT 1")).rows[0];
    const res = await request(app)
      .delete(`/api/superadmin/users/${sa.id}`)
      .set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/super admin/i);
  });

  it('returns 404 deleting non-existent user', async () => {
    const res = await request(app)
      .delete('/api/superadmin/users/99999')
      .set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(404);
  });

  it('deletes the test HR user and cleans FK data', async () => {
    const res = await request(app)
      .delete(`/api/superadmin/users/${createdHrUserId}`)
      .set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    createdHrUserId = null;
  });
});

// ─────────────────────────────────────────────────────────────
// GALLERY MANAGEMENT
// ─────────────────────────────────────────────────────────────
describe('Super Admin — Gallery', () => {
  it('lists gallery items', async () => {
    const res = await request(app)
      .get('/api/superadmin/gallery')
      .set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('creates a gallery item without image', async () => {
    const res = await request(app)
      .post('/api/superadmin/gallery')
      .set('Authorization', `Bearer ${superToken}`)
      .field('title', 'SA Test Gallery Item')
      .field('description', 'Created by test suite')
      .field('category', 'general')
      .field('display_order', '99');
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('SA Test Gallery Item');
    createdGalleryId = res.body.id;
  });

  it('rejects gallery creation without title', async () => {
    const res = await request(app)
      .post('/api/superadmin/gallery')
      .set('Authorization', `Bearer ${superToken}`)
      .field('description', 'No title');
    expect(res.status).toBe(400);
  });

  it('updates a gallery item', async () => {
    const res = await request(app)
      .put(`/api/superadmin/gallery/${createdGalleryId}`)
      .set('Authorization', `Bearer ${superToken}`)
      .field('title', 'SA Test Gallery Updated')
      .field('is_active', '0');
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('SA Test Gallery Updated');
    expect(Number(res.body.is_active)).toBe(0);
  });

  it('reorders gallery items', async () => {
    const listRes = await request(app)
      .get('/api/superadmin/gallery')
      .set('Authorization', `Bearer ${superToken}`);
    const items = listRes.body.slice(0, 2).map((item, i) => ({ id: item.id, display_order: i * 10 }));
    const res = await request(app)
      .put('/api/superadmin/gallery/reorder/batch')
      .set('Authorization', `Bearer ${superToken}`)
      .send({ items });
    expect(res.status).toBe(200);
  });

  it('returns 404 for non-existent gallery item', async () => {
    const res = await request(app)
      .put('/api/superadmin/gallery/99999')
      .set('Authorization', `Bearer ${superToken}`)
      .field('title', 'Ghost');
    expect(res.status).toBe(404);
  });

  it('deletes a gallery item', async () => {
    const res = await request(app)
      .delete(`/api/superadmin/gallery/${createdGalleryId}`)
      .set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    createdGalleryId = null;
  });
});

// ─────────────────────────────────────────────────────────────
// BOARD CONFIGURATION
// ─────────────────────────────────────────────────────────────
describe('Super Admin — Board Configuration', () => {
  let boardId;

  it('lists all boards', async () => {
    const res = await request(app)
      .get('/api/superadmin/boards')
      .set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    boardId = res.body[0].id;
  });

  it('updates a board', async () => {
    const res = await request(app)
      .put(`/api/superadmin/boards/${boardId}`)
      .set('Authorization', `Bearer ${superToken}`)
      .field('description', 'Updated by test suite')
      .field('is_active', '1');
    expect(res.status).toBe(200);
    expect(res.body.description).toBe('Updated by test suite');
  });

  it('reorders boards', async () => {
    const listRes = await request(app)
      .get('/api/superadmin/boards')
      .set('Authorization', `Bearer ${superToken}`);
    const items = listRes.body.slice(0, 2).map((b, i) => ({ id: b.id, display_order: i * 5 }));
    const res = await request(app)
      .put('/api/superadmin/boards/reorder/batch')
      .set('Authorization', `Bearer ${superToken}`)
      .send({ items });
    expect(res.status).toBe(200);
  });

  it('returns 404 for non-existent board', async () => {
    const res = await request(app)
      .put('/api/superadmin/boards/99999')
      .set('Authorization', `Bearer ${superToken}`)
      .field('description', 'Ghost');
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────
// SETTINGS MANAGEMENT
// ─────────────────────────────────────────────────────────────
describe('Super Admin — Settings', () => {
  it('returns all settings as an array', async () => {
    const res = await request(app)
      .get('/api/superadmin/settings')
      .set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('key');
    expect(res.body[0]).toHaveProperty('value');
  });

  it('upserts settings', async () => {
    const res = await request(app)
      .put('/api/superadmin/settings')
      .set('Authorization', `Bearer ${superToken}`)
      .send({ _test_setting_key: 'test_value_123' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/saved/i);
  });

  it('setting is persisted and retrievable', async () => {
    const res = await request(app)
      .get('/api/superadmin/settings')
      .set('Authorization', `Bearer ${superToken}`);
    const found = res.body.find(s => s.key === '_test_setting_key');
    expect(found).toBeDefined();
    expect(found.value).toBe('test_value_123');
    // Cleanup test setting
    await pool.query("DELETE FROM settings WHERE key = '_test_setting_key'");
  });
});

// ─────────────────────────────────────────────────────────────
// JOB MANAGEMENT (full CRUD)
// ─────────────────────────────────────────────────────────────
describe('Super Admin — Job Management', () => {
  it('lists jobs with pagination', async () => {
    const res = await request(app)
      .get('/api/superadmin/jobs?page=1&limit=5')
      .set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.jobs)).toBe(true);
    expect(res.body.jobs.length).toBeLessThanOrEqual(5);
    expect(typeof res.body.total).toBe('number');
  });

  it('filters jobs by department', async () => {
    const res = await request(app)
      .get('/api/superadmin/jobs?department=NABH')
      .set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    for (const j of res.body.jobs) {
      expect(j.department).toBe('NABH');
    }
  });

  it('searches jobs by title', async () => {
    const res = await request(app)
      .get('/api/superadmin/jobs?search=engineer')
      .set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.jobs)).toBe(true);
  });

  it('creates a job', async () => {
    const res = await request(app)
      .post('/api/superadmin/jobs')
      .set('Authorization', `Bearer ${superToken}`)
      .send({
        title: 'SA Test Job',
        company: 'QCI',
        location: 'Delhi',
        job_type: 'Full-time',
        category: 'Technology',
        department: 'IT',
        experience_min: 1,
        experience_max: 3,
        salary_min: 500000,
        salary_max: 800000,
        description: 'Test job for super admin suite',
        requirements: 'Node.js',
        skills: 'Node.js,React',
        openings: 1,
      });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('SA Test Job');
    createdJobId = res.body.id;
  });

  it('rejects job creation with missing required fields', async () => {
    const res = await request(app)
      .post('/api/superadmin/jobs')
      .set('Authorization', `Bearer ${superToken}`)
      .send({ title: 'Incomplete Job' });
    expect(res.status).toBe(400);
  });

  it('partially updates a job (only title)', async () => {
    const res = await request(app)
      .put(`/api/superadmin/jobs/${createdJobId}`)
      .set('Authorization', `Bearer ${superToken}`)
      .send({ title: 'SA Test Job Updated' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('SA Test Job Updated');
    // Other fields should be preserved
    expect(res.body.location).toBe('Delhi');
  });

  it('returns 404 updating non-existent job', async () => {
    const res = await request(app)
      .put('/api/superadmin/jobs/99999')
      .set('Authorization', `Bearer ${superToken}`)
      .send({ title: 'Ghost' });
    expect(res.status).toBe(404);
  });

  it('deactivates a job', async () => {
    const res = await request(app)
      .delete(`/api/superadmin/jobs/${createdJobId}`)
      .set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deactivated/i);
    createdJobId = null;
  });
});
