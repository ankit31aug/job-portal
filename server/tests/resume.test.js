const request = require('supertest');
const app = require('../app');
const { pool } = require('../db-pg');

let jobseekerToken;

const TEST_EMAILS = ['resume_seeker@example.com'];

async function cleanupTestUsers() {
  await pool.query('DELETE FROM users WHERE email = ANY($1::text[])', [TEST_EMAILS]);
}

beforeAll(async () => {
  await cleanupTestUsers();

  const js = await request(app).post('/api/auth/register').send({
    name: 'Resume Seeker',
    email: 'resume_seeker@example.com',
    password: 'Password1',
    role: 'jobseeker',
  });
  jobseekerToken = js.body.token;
});

afterAll(cleanupTestUsers);

// ─────────────────────────────────────────────────────────────
// POST /api/resume/parse
// ─────────────────────────────────────────────────────────────
describe('POST /api/resume/parse', () => {
  it('returns 401 without auth token', async () => {
    const res = await request(app).post('/api/resume/parse');
    expect(res.status).toBe(401);
  });

  it('returns 400 when no file is uploaded', async () => {
    const res = await request(app)
      .post('/api/resume/parse')
      .set('Authorization', `Bearer ${jobseekerToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/pdf/i);
  });
});

// ─────────────────────────────────────────────────────────────
// POST /api/resume/match
// ─────────────────────────────────────────────────────────────
describe('POST /api/resume/match', () => {
  it('returns 401 without auth token', async () => {
    const res = await request(app).post('/api/resume/match');
    expect(res.status).toBe(401);
  });

  it('returns 400 when no file is uploaded', async () => {
    const res = await request(app)
      .post('/api/resume/match')
      .set('Authorization', `Bearer ${jobseekerToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/pdf/i);
  });
});
