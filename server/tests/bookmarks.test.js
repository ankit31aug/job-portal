const request = require('supertest');
const app = require('../app');
const { pool } = require('../db-pg');

let jobseekerToken;
let jobId;

const TEST_EMAILS = ['bm_seeker@example.com', 'bm_employer@example.com'];

async function cleanupTestUsers() {
  const userIds = (
    await pool.query('SELECT id FROM users WHERE email = ANY($1::text[])', [TEST_EMAILS])
  ).rows.map(r => r.id);
  if (userIds.length) {
    await pool.query('DELETE FROM bookmarks WHERE user_id = ANY($1::int[])', [userIds]);
    await pool.query(
      'DELETE FROM applications WHERE job_id IN (SELECT id FROM jobs WHERE employer_id = ANY($1::int[]))',
      [userIds]
    );
    await pool.query('DELETE FROM jobs WHERE employer_id = ANY($1::int[])', [userIds]);
    await pool.query('DELETE FROM users WHERE id = ANY($1::int[])', [userIds]);
  }
}

beforeAll(async () => {
  await cleanupTestUsers();

  const emp = await request(app).post('/api/auth/register').send({
    name: 'BM Employer',
    email: 'bm_employer@example.com',
    password: 'Password1',
    role: 'employer',
    company_name: 'BMCo',
  });

  const job = await request(app)
    .post('/api/jobs')
    .set('Authorization', `Bearer ${emp.body.token}`)
    .send({
      title: 'Bookmark Test Job',
      location: 'Pune',
      job_type: 'Full-time',
      category: 'IT',
      description: 'Testing bookmarks',
      requirements: 'None',
      skills: 'javascript',
      openings: 1,
    });
  jobId = job.body.id;

  const js = await request(app).post('/api/auth/register').send({
    name: 'BM Seeker',
    email: 'bm_seeker@example.com',
    password: 'Password1',
    role: 'jobseeker',
  });
  jobseekerToken = js.body.token;
});

afterAll(cleanupTestUsers);

describe('GET /api/bookmarks', () => {
  it('returns empty list when no bookmarks', async () => {
    const res = await request(app)
      .get('/api/bookmarks')
      .set('Authorization', `Bearer ${jobseekerToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/bookmarks');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/bookmarks', () => {
  it('adds a bookmark', async () => {
    const res = await request(app)
      .post('/api/bookmarks')
      .set('Authorization', `Bearer ${jobseekerToken}`)
      .send({ job_id: jobId });
    expect(res.status).toBe(200);
    expect(res.body.bookmarked).toBe(true);
  });

  it('is idempotent — bookmarking twice does not error', async () => {
    const res = await request(app)
      .post('/api/bookmarks')
      .set('Authorization', `Bearer ${jobseekerToken}`)
      .send({ job_id: jobId });
    expect(res.status).toBe(200);
    expect(res.body.bookmarked).toBe(true);
  });

  it('returns 400 when job_id is missing', async () => {
    const res = await request(app)
      .post('/api/bookmarks')
      .set('Authorization', `Bearer ${jobseekerToken}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/bookmarks').send({ job_id: jobId });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/bookmarks/check/:jobId', () => {
  it('returns bookmarked: true for a saved job', async () => {
    const res = await request(app)
      .get(`/api/bookmarks/check/${jobId}`)
      .set('Authorization', `Bearer ${jobseekerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.bookmarked).toBe(true);
  });

  it('returns bookmarked: false for a non-saved job', async () => {
    const res = await request(app)
      .get('/api/bookmarks/check/999999')
      .set('Authorization', `Bearer ${jobseekerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.bookmarked).toBe(false);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get(`/api/bookmarks/check/${jobId}`);
    expect(res.status).toBe(401);
  });
});

describe('GET /api/bookmarks (after adding)', () => {
  it('lists saved jobs including the bookmarked job', async () => {
    const res = await request(app)
      .get('/api/bookmarks')
      .set('Authorization', `Bearer ${jobseekerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.some(b => b.job_id === jobId)).toBe(true);
    expect(res.body[0]).toHaveProperty('title');
  });
});

describe('DELETE /api/bookmarks/:jobId', () => {
  it('removes a bookmark', async () => {
    const res = await request(app)
      .delete(`/api/bookmarks/${jobId}`)
      .set('Authorization', `Bearer ${jobseekerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.bookmarked).toBe(false);
  });

  it('returns bookmarked: false after removal', async () => {
    const res = await request(app)
      .get(`/api/bookmarks/check/${jobId}`)
      .set('Authorization', `Bearer ${jobseekerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.bookmarked).toBe(false);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).delete(`/api/bookmarks/${jobId}`);
    expect(res.status).toBe(401);
  });
});
