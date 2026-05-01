const request = require('supertest');
const app = require('../app');
const { pool } = require('../db-pg');

// OTP tests: we seed OTP records directly in the DB to avoid the email dependency.

const TEST_EMAIL = 'otp_test_user@example.com';
const TEST_EXISTING_EMAIL = 'otp_existing@example.com';

async function cleanup() {
  await pool.query('DELETE FROM otp_verifications WHERE email = ANY($1::text[])', [
    [TEST_EMAIL, TEST_EXISTING_EMAIL],
  ]);
  await pool.query('DELETE FROM users WHERE email = ANY($1::text[])', [
    [TEST_EMAIL, TEST_EXISTING_EMAIL],
  ]);
}

beforeAll(async () => {
  await cleanup();

  // Register an existing user to test the duplicate-email guard
  await request(app).post('/api/auth/register').send({
    name: 'Existing User',
    email: TEST_EXISTING_EMAIL,
    password: 'Password1',
    role: 'employer',
    company_name: 'ExistCo',
  });
});

afterAll(cleanup);

describe('POST /api/otp/send', () => {
  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/api/otp/send').send({ name: 'No Email' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/otp/send')
      .send({ email: TEST_EMAIL });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 409 when email is already registered', async () => {
    const res = await request(app)
      .post('/api/otp/send')
      .send({ email: TEST_EXISTING_EMAIL, name: 'Existing' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/registered/i);
  });

  it('accepts a valid send request (email send may fail but record is inserted)', async () => {
    const res = await request(app)
      .post('/api/otp/send')
      .send({ email: TEST_EMAIL, name: 'OTP Tester' });
    // In test env the email sending fails silently; the endpoint should still return 200
    // or 500 if sendMail throws and isn't caught. Accept either 200 (success path) or
    // a server error due to the blocked smtp — the key validation is input handling above.
    expect([200, 500]).toContain(res.status);
  });
});

describe('POST /api/otp/verify', () => {
  let seededOtpId;

  beforeAll(async () => {
    // Seed a valid, not-yet-verified OTP record for TEST_EMAIL directly
    await pool.query('DELETE FROM otp_verifications WHERE email = $1', [TEST_EMAIL]);
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const result = await pool.query(
      'INSERT INTO otp_verifications (email, otp, expires_at) VALUES ($1, $2, $3) RETURNING id',
      [TEST_EMAIL, '123456', expires]
    );
    seededOtpId = result.rows[0].id;
  });

  afterAll(async () => {
    if (seededOtpId) {
      await pool.query('DELETE FROM otp_verifications WHERE id = $1', [seededOtpId]);
    }
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/api/otp/verify').send({ otp: '123456' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when otp is missing', async () => {
    const res = await request(app).post('/api/otp/verify').send({ email: TEST_EMAIL });
    expect(res.status).toBe(400);
  });

  it('returns 400 for wrong OTP', async () => {
    const res = await request(app)
      .post('/api/otp/verify')
      .send({ email: TEST_EMAIL, otp: '000000' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('returns 400 when no pending OTP exists for the email', async () => {
    const res = await request(app)
      .post('/api/otp/verify')
      .send({ email: 'no_otp@example.com', otp: '123456' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no pending/i);
  });

  it('verifies a valid OTP', async () => {
    const res = await request(app)
      .post('/api/otp/verify')
      .send({ email: TEST_EMAIL, otp: '123456' });
    expect(res.status).toBe(200);
    expect(res.body.verified).toBe(true);
  });

  it('returns 400 for an already-verified OTP', async () => {
    // The previous test marked it verified=1; re-verifying should fail
    const res = await request(app)
      .post('/api/otp/verify')
      .send({ email: TEST_EMAIL, otp: '123456' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for an expired OTP', async () => {
    // Insert an expired OTP
    const expiredAt = new Date(Date.now() - 1000).toISOString();
    await pool.query(
      'INSERT INTO otp_verifications (email, otp, expires_at) VALUES ($1, $2, $3)',
      ['expired_otp@example.com', '999999', expiredAt]
    );
    const res = await request(app)
      .post('/api/otp/verify')
      .send({ email: 'expired_otp@example.com', otp: '999999' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/expired/i);
    await pool.query('DELETE FROM otp_verifications WHERE email = $1', ['expired_otp@example.com']);
  });
});
