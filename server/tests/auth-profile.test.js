const request = require('supertest');
const app = require('../app');
const { pool } = require('../db-pg');

let jobseekerToken;
let jobseekerId;

const TEST_EMAILS = ['profile_seeker@example.com', 'profile_employer@example.com'];

async function cleanupTestUsers() {
  await pool.query('DELETE FROM password_reset_tokens WHERE email = ANY($1::text[])', [TEST_EMAILS]);
  await pool.query('DELETE FROM users WHERE email = ANY($1::text[])', [TEST_EMAILS]);
}

beforeAll(async () => {
  await cleanupTestUsers();

  const reg = await request(app).post('/api/auth/register').send({
    name: 'Profile Seeker',
    email: 'profile_seeker@example.com',
    password: 'Password1',
    role: 'jobseeker',
  });
  jobseekerToken = reg.body.token;
  jobseekerId = reg.body.user.id;
});

afterAll(cleanupTestUsers);

// ─────────────────────────────────────────────────────────────
// GET /api/auth/profile
// ─────────────────────────────────────────────────────────────
describe('GET /api/auth/profile', () => {
  it('returns the authenticated user profile', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${jobseekerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('profile_seeker@example.com');
    expect(res.body.password).toBeUndefined();
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────
// PUT /api/auth/profile
// ─────────────────────────────────────────────────────────────
describe('PUT /api/auth/profile', () => {
  it('updates profile fields', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${jobseekerToken}`)
      .field('name', 'Updated Seeker')
      .field('phone', '9876543210')
      .field('city', 'Chennai')
      .field('bio', 'I am a test user');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Seeker');
    expect(res.body.city).toBe('Chennai');
    expect(res.body.bio).toBe('I am a test user');
  });

  it('retains existing fields when only partial update is provided', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${jobseekerToken}`)
      .field('bio', 'Partial update');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Seeker'); // preserved from previous update
    expect(res.body.bio).toBe('Partial update');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).put('/api/auth/profile').field('name', 'Anon');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────────────────────
describe('POST /api/auth/forgot-password', () => {
  it('returns identical response for registered email (no enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'profile_seeker@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });

  it('returns identical response for unregistered email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'ghost_notexist@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({});
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/reset-password
// ─────────────────────────────────────────────────────────────
describe('POST /api/auth/reset-password', () => {
  let validToken;

  beforeAll(async () => {
    // Insert a password reset token directly
    validToken = 'test_reset_token_abc123';
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await pool.query('DELETE FROM password_reset_tokens WHERE email = $1', [
      'profile_seeker@example.com',
    ]);
    await pool.query(
      'INSERT INTO password_reset_tokens (email, token, expires_at) VALUES ($1, $2, $3)',
      ['profile_seeker@example.com', validToken, expiresAt]
    );
  });

  afterAll(async () => {
    await pool.query('DELETE FROM password_reset_tokens WHERE email = $1', [
      'profile_seeker@example.com',
    ]);
  });

  it('returns 400 when token is missing', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ password: 'NewPass123' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: validToken });
    expect(res.status).toBe(400);
  });

  it('returns 400 when password is too short', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: validToken, password: 'short' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid token', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'invalid_token_xyz', password: 'NewPassword1' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('resets password with valid token', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: validToken, password: 'NewPassword1' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reset successfully/i);
  });

  it('returns 400 when token is already used', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: validToken, password: 'AnotherPass1' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid|used/i);
  });

  it('can log in with the new password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'profile_seeker@example.com', password: 'NewPassword1' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});
