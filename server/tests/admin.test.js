const request = require('supertest');
const app = require('../app');
const { pool } = require('../db-pg');

// Uses the pre-seeded HR and super-admin accounts + seeds employer + job for application tests
const HR_EMAIL  = 'hr-admin@qci.org';
const HR_PASS   = 'Admin@123';

let hrToken;
let employerToken;
let adminCreatedJobId;
let applicationId;

const TEST_EMAILS = ['admin_emp@example.com', 'admin_seeker@example.com'];

async function cleanupTestUsers() {
  const userIds = (
    await pool.query('SELECT id FROM users WHERE email = ANY($1::text[])', [TEST_EMAILS])
  ).rows.map(r => r.id);
  if (userIds.length) {
    await pool.query(
      'DELETE FROM application_status_history WHERE application_id IN (SELECT id FROM applications WHERE applicant_id = ANY($1::int[]) OR job_id IN (SELECT id FROM jobs WHERE employer_id = ANY($1::int[])))',
      [userIds]
    );
    await pool.query(
      'DELETE FROM applications WHERE applicant_id = ANY($1::int[]) OR job_id IN (SELECT id FROM jobs WHERE employer_id = ANY($1::int[]))',
      [userIds]
    );
    await pool.query('DELETE FROM jobs WHERE employer_id = ANY($1::int[])', [userIds]);
    await pool.query('DELETE FROM users WHERE id = ANY($1::int[])', [userIds]);
  }
  if (adminCreatedJobId) {
    await pool.query('DELETE FROM applications WHERE job_id = $1', [adminCreatedJobId]);
    await pool.query('DELETE FROM jobs WHERE id = $1', [adminCreatedJobId]);
  }
}

beforeAll(async () => {
  await cleanupTestUsers();

  const hr = await request(app).post('/api/auth/login').send({ email: HR_EMAIL, password: HR_PASS });
  hrToken = hr.body.token;

  const emp = await request(app).post('/api/auth/register').send({
    name: 'Admin Emp',
    email: 'admin_emp@example.com',
    password: 'Password1',
    role: 'employer',
    company_name: 'AdminEmpCo',
  });
  employerToken = emp.body.token;

  // Seed a seeker and an application for later tests
  const js = await request(app).post('/api/auth/register').send({
    name: 'Admin Seeker',
    email: 'admin_seeker@example.com',
    password: 'Password1',
    role: 'jobseeker',
  });

  // Create a job via the employer (to have job_id for application)
  const job = await request(app)
    .post('/api/jobs')
    .set('Authorization', `Bearer ${employerToken}`)
    .send({
      title: 'Admin Test Role',
      location: 'Mumbai',
      job_type: 'Full-time',
      category: 'IT',
      description: 'Admin test description',
      requirements: 'None',
      skills: 'javascript',
      openings: 2,
    });

  const appl = await request(app)
    .post('/api/applications')
    .set('Authorization', `Bearer ${js.body.token}`)
    .field('job_id', String(job.body.id))
    .field('full_name', 'Admin Seeker')
    .field('email', 'admin_seeker@example.com')
    .field('phone', '9876543299')
    .field('pincode', '400001')
    .field('experience_years', '1')
    .field('skills', 'javascript');

  applicationId = appl.body.id;
});

afterAll(cleanupTestUsers);

// ─────────────────────────────────────────────────────────────
// AUTH GUARD
// ─────────────────────────────────────────────────────────────
describe('Admin routes — auth guard', () => {
  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.status).toBe(401);
  });

  it('returns 403 for employer token', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${employerToken}`);
    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────
describe('GET /api/admin/stats', () => {
  it('returns dashboard stats for HR', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${hrToken}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.totalJobs).toBe('number');
    expect(typeof res.body.totalApplications).toBe('number');
    expect(typeof res.body.pending).toBe('number');
    expect(typeof res.body.inProgress).toBe('number');
    expect(typeof res.body.hired).toBe('number');
  });
});

// ─────────────────────────────────────────────────────────────
// JOB MANAGEMENT
// ─────────────────────────────────────────────────────────────
describe('GET /api/admin/jobs', () => {
  it('returns paginated job list', async () => {
    const res = await request(app)
      .get('/api/admin/jobs?page=1&limit=5')
      .set('Authorization', `Bearer ${hrToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.jobs)).toBe(true);
    expect(typeof res.body.total).toBe('number');
  });

  it('filters by search query', async () => {
    const res = await request(app)
      .get('/api/admin/jobs?search=Admin+Test')
      .set('Authorization', `Bearer ${hrToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.jobs)).toBe(true);
  });
});

describe('POST /api/admin/jobs', () => {
  it('HR can create a job', async () => {
    const res = await request(app)
      .post('/api/admin/jobs')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        title: 'HR Created Job',
        company: 'QCI',
        location: 'Delhi',
        job_type: 'Full-time',
        category: 'HR',
        description: 'Created by HR admin tests',
        requirements: 'HR experience',
        skills: 'management',
        openings: 1,
      });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('HR Created Job');
    adminCreatedJobId = res.body.id;
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/admin/jobs')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ title: 'Incomplete' });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/admin/jobs/:id', () => {
  it('HR can update any job', async () => {
    const res = await request(app)
      .put(`/api/admin/jobs/${adminCreatedJobId}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        title: 'HR Updated Job',
        company: 'QCI',
        location: 'Delhi',
        job_type: 'Full-time',
        category: 'HR',
        description: 'Updated description',
        requirements: 'Updated requirements',
        skills: 'management,hr',
        openings: 2,
        is_active: 1,
      });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('HR Updated Job');
  });

  it('returns 404 for non-existent job', async () => {
    const res = await request(app)
      .put('/api/admin/jobs/999999')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        title: 'Ghost',
        company: 'X',
        location: 'X',
        job_type: 'Full-time',
        category: 'IT',
        description: 'X',
        requirements: 'X',
        skills: 'x',
      });
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/admin/jobs/:id/toggle', () => {
  it('HR can toggle job active state', async () => {
    const res = await request(app)
      .patch(`/api/admin/jobs/${adminCreatedJobId}/toggle`)
      .set('Authorization', `Bearer ${hrToken}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.is_active).toBe('number');
  });

  it('returns 404 for non-existent job', async () => {
    const res = await request(app)
      .patch('/api/admin/jobs/999999/toggle')
      .set('Authorization', `Bearer ${hrToken}`);
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────
// APPLICATION MANAGEMENT
// ─────────────────────────────────────────────────────────────
describe('GET /api/admin/applications/job/:jobId', () => {
  it('HR can view all applications for a job', async () => {
    // Use the job created in beforeAll (via employer)
    const jobsRes = await request(app)
      .get('/api/admin/jobs?search=Admin+Test')
      .set('Authorization', `Bearer ${hrToken}`);
    const job = jobsRes.body.jobs.find(j => j.title === 'Admin Test Role');
    expect(job).toBeDefined();

    const res = await request(app)
      .get(`/api/admin/applications/job/${job.id}`)
      .set('Authorization', `Bearer ${hrToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

describe('PATCH /api/admin/applications/:id/status', () => {
  it('HR can update application status', async () => {
    const res = await request(app)
      .patch(`/api/admin/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ status: 'shortlisted' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('shortlisted');
  });

  it('rejects invalid status value', async () => {
    const res = await request(app)
      .patch(`/api/admin/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ status: 'approved' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent application', async () => {
    const res = await request(app)
      .patch('/api/admin/applications/999999/status')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ status: 'hired' });
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────
// USER LISTING
// ─────────────────────────────────────────────────────────────
describe('GET /api/admin/users', () => {
  it('returns paginated user list', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${hrToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(typeof res.body.total).toBe('number');
    expect(res.body.users[0]).not.toHaveProperty('password');
  });

  it('respects pagination parameters', async () => {
    const res = await request(app)
      .get('/api/admin/users?page=1&limit=2')
      .set('Authorization', `Bearer ${hrToken}`);
    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeLessThanOrEqual(2);
  });
});
