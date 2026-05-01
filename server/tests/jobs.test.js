const request = require('supertest');
const app = require('../app');
const { pool } = require('../db-pg');

// Shared tokens
let employerToken;
let jobseekerToken;
let createdJobId;

const TEST_EMAILS = ['jobs_employer@example.com', 'jobs_seeker@example.com', 'other_emp@example.com'];

async function cleanupTestUsers() {
  const userIds = (await pool.query(`SELECT id FROM users WHERE email = ANY($1::text[])`, [TEST_EMAILS])).rows.map(r => r.id);
  if (userIds.length) {
    await pool.query(`DELETE FROM applications WHERE applicant_id = ANY($1::int[]) OR job_id IN (SELECT id FROM jobs WHERE employer_id = ANY($1::int[]))`, [userIds]);
    await pool.query(`DELETE FROM bookmarks WHERE user_id = ANY($1::int[])`, [userIds]);
    await pool.query(`DELETE FROM jobs WHERE employer_id = ANY($1::int[])`, [userIds]);
    await pool.query(`DELETE FROM users WHERE id = ANY($1::int[])`, [userIds]);
  }
}

beforeAll(async () => {
  await cleanupTestUsers();

  // Create employer
  const emp = await request(app).post('/api/auth/register').send({
    name: 'Jobs Employer',
    email: 'jobs_employer@example.com',
    password: 'Password1',
    role: 'employer',
    company_name: 'TestCo',
  });
  employerToken = emp.body.token;

  // Create jobseeker
  const js = await request(app).post('/api/auth/register').send({
    name: 'Jobs Seeker',
    email: 'jobs_seeker@example.com',
    password: 'Password1',
    role: 'jobseeker',
  });
  jobseekerToken = js.body.token;
});

describe('GET /api/jobs', () => {
  it('returns paginated job list without auth', async () => {
    const res = await request(app).get('/api/jobs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.jobs)).toBe(true);
    expect(typeof res.body.total).toBe('number');
    expect(typeof res.body.pages).toBe('number');
  });

  it('respects limit and page parameters', async () => {
    const res = await request(app).get('/api/jobs?page=1&limit=3');
    expect(res.status).toBe(200);
    expect(res.body.jobs.length).toBeLessThanOrEqual(3);
  });

  it('filters jobs by search query', async () => {
    const res = await request(app).get('/api/jobs?search=Quality');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.jobs)).toBe(true);
  });

  it('filters jobs by category', async () => {
    const res = await request(app).get('/api/jobs?category=IT');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.jobs)).toBe(true);
  });

  it('filters jobs by job_type', async () => {
    const res = await request(app).get('/api/jobs?job_type=Full-time');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.jobs)).toBe(true);
  });
});

describe('GET /api/jobs/categories', () => {
  it('returns distinct category list', async () => {
    const res = await request(app).get('/api/jobs/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/jobs/stats', () => {
  it('returns job stats', async () => {
    const res = await request(app).get('/api/jobs/stats');
    expect(res.status).toBe(200);
    expect(typeof res.body.total).toBe('number');
  });
});

describe('POST /api/jobs', () => {
  it('employer can create a job', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${employerToken}`)
      .send({
        title: 'CI Test Engineer',
        location: 'New Delhi',
        job_type: 'Full-time',
        category: 'IT',
        description: 'End-to-end testing role',
        requirements: 'Experience with CI/CD pipelines',
        skills: 'javascript,testing,jest',
        openings: 2,
      });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('CI Test Engineer');
    createdJobId = res.body.id;
  });

  it('jobseeker cannot create a job', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${jobseekerToken}`)
      .send({
        title: 'Unauthorized Job',
        location: 'Mumbai',
        category: 'IT',
        description: 'Should fail',
        requirements: 'None',
        skills: 'none',
      });
    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/jobs').send({ title: 'Anon Job' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${employerToken}`)
      .send({ title: 'Incomplete Job' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/jobs/:id', () => {
  it('returns job by ID', async () => {
    const res = await request(app).get(`/api/jobs/${createdJobId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdJobId);
    expect(res.body.title).toBe('CI Test Engineer');
  });

  it('returns 404 for non-existent job', async () => {
    const res = await request(app).get('/api/jobs/999999');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/jobs/:id', () => {
  it('employer can update their own job', async () => {
    const res = await request(app)
      .put(`/api/jobs/${createdJobId}`)
      .set('Authorization', `Bearer ${employerToken}`)
      .send({
        title: 'Updated CI Test Engineer',
        location: 'New Delhi',
        job_type: 'Full-time',
        category: 'IT',
        description: 'Updated description',
        requirements: 'Updated requirements',
        skills: 'javascript,testing,jest,ci',
        openings: 3,
        is_active: 1,
      });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated CI Test Engineer');
  });

  it('returns 404 when employer does not own the job', async () => {
    // Create a second employer
    const emp2 = await request(app).post('/api/auth/register').send({
      name: 'Other Employer',
      email: 'other_emp@example.com',
      password: 'Password1',
      role: 'employer',
      company_name: 'OtherCo',
    });
    const res = await request(app)
      .put(`/api/jobs/${createdJobId}`)
      .set('Authorization', `Bearer ${emp2.body.token}`)
      .send({ title: 'Hijacked Job', location: 'X', job_type: 'Part-time', category: 'IT',
        description: 'x', requirements: 'x', skills: 'x', openings: 1 });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/jobs/:id', () => {
  it('employer can deactivate their own job', async () => {
    const res = await request(app)
      .delete(`/api/jobs/${createdJobId}`)
      .set('Authorization', `Bearer ${employerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deactivated/i);
  });
});

describe('GET /api/jobs/my', () => {
  it('employer sees their own jobs', async () => {
    const res = await request(app)
      .get('/api/jobs/my')
      .set('Authorization', `Bearer ${employerToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns 403 for jobseeker', async () => {
    const res = await request(app)
      .get('/api/jobs/my')
      .set('Authorization', `Bearer ${jobseekerToken}`);
    expect(res.status).toBe(403);
  });
});

afterAll(cleanupTestUsers);
