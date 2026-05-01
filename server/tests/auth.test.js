const request = require('supertest');
const app = require('../app');
const { pool } = require('../db-pg');

const TEST_EMAILS = [
  'alice@example.com', 'bob@example.com', 'dupe@example.com',
  'logintest@example.com', 'me@example.com',
];

async function cleanupTestUsers() {
  await pool.query(`DELETE FROM applications WHERE applicant_id IN (SELECT id FROM users WHERE email = ANY($1::text[]))`, [TEST_EMAILS]);
  await pool.query(`DELETE FROM bookmarks WHERE user_id IN (SELECT id FROM users WHERE email = ANY($1::text[]))`, [TEST_EMAILS]);
  await pool.query(`DELETE FROM users WHERE email = ANY($1::text[])`, [TEST_EMAILS]);
}

beforeAll(cleanupTestUsers);
afterAll(cleanupTestUsers);

describe('Health', () => {
  it('GET /api/health returns OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
  });
});

describe('POST /api/auth/register', () => {
  it('registers a new jobseeker', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Alice Tester',
      email: 'alice@example.com',
      password: 'Password1',
      role: 'jobseeker',
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('jobseeker');
  });

  it('registers a new employer', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Bob Employer',
      email: 'bob@example.com',
      password: 'Password1',
      role: 'employer',
      company_name: 'BobCo',
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('employer');
  });

  it('rejects missing required fields', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'incomplete@example.com',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('rejects employer without company_name', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'No Company',
      email: 'nocompany@example.com',
      password: 'Password1',
      role: 'employer',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/company/i);
  });

  it('rejects duplicate email', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Dupe User',
      email: 'dupe@example.com',
      password: 'Password1',
      role: 'jobseeker',
    });
    const res = await request(app).post('/api/auth/register').send({
      name: 'Dupe User 2',
      email: 'dupe@example.com',
      password: 'Password1',
      role: 'jobseeker',
    });
    expect(res.status).toBe(409);
  });

  it('rejects invalid role', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Bad Role',
      email: 'badrole@example.com',
      password: 'Password1',
      role: 'superuser',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Login Test',
      email: 'logintest@example.com',
      password: 'Password1',
      role: 'jobseeker',
    });
  });

  it('logs in with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'logintest@example.com',
      password: 'Password1',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('logintest@example.com');
  });

  it('rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'logintest@example.com',
      password: 'WrongPass1',
    });
    expect(res.status).toBe(401);
  });

  it('rejects unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'ghost@example.com',
      password: 'Password1',
    });
    expect(res.status).toBe(401);
  });

  it('rejects missing fields', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  let token;

  beforeAll(async () => {
    const reg = await request(app).post('/api/auth/register').send({
      name: 'Me Tester',
      email: 'me@example.com',
      password: 'Password1',
      role: 'jobseeker',
    });
    token = reg.body.token;
  });

  it('returns current user with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('me@example.com');
    expect(res.body.password).toBeUndefined();
  });

  it('rejects request with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects request with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
  });
});
