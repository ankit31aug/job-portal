const request = require('supertest');
const app = require('../app');
const { pool } = require('../db-pg');

const HR_EMAIL  = 'hr-admin@qci.org';
const HR_PASS   = 'Admin@123';

let hrToken;
let jobseekerToken;

const TEST_EMAILS = ['settings_seeker@example.com'];

async function cleanupTestUsers() {
  await pool.query('DELETE FROM users WHERE email = ANY($1::text[])', [TEST_EMAILS]);
  await pool.query("DELETE FROM settings WHERE key LIKE '_settings_test%'");
}

beforeAll(async () => {
  await cleanupTestUsers();

  const hr = await request(app).post('/api/auth/login').send({ email: HR_EMAIL, password: HR_PASS });
  hrToken = hr.body.token;

  const js = await request(app).post('/api/auth/register').send({
    name: 'Settings Seeker',
    email: 'settings_seeker@example.com',
    password: 'Password1',
    role: 'jobseeker',
  });
  jobseekerToken = js.body.token;

  // Pre-insert a settings key so the PUT (UPDATE) and GET tests can use it
  await pool.query(
    `INSERT INTO settings (key, value, label, category) VALUES ('_settings_test_key', 'initial_value', 'Test Key', 'test')
     ON CONFLICT (key) DO UPDATE SET value = 'initial_value'`
  );
});

afterAll(cleanupTestUsers);

describe('GET /api/settings', () => {
  it('is publicly accessible without auth', async () => {
    const res = await request(app).get('/api/settings');
    expect(res.status).toBe(200);
    expect(typeof res.body).toBe('object');
  });

  it('returns an object with key-value pairs', async () => {
    const res = await request(app).get('/api/settings');
    expect(res.status).toBe(200);
    expect(typeof res.body).toBe('object');
    expect(res.body._settings_test_key).toBe('initial_value');
  });
});

describe('PUT /api/settings', () => {
  it('HR can update an existing settings key', async () => {
    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ _settings_test_key: 'updated_value' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/saved/i);

    // Verify the update was persisted
    const getRes = await request(app).get('/api/settings');
    expect(getRes.body._settings_test_key).toBe('updated_value');
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .put('/api/settings')
      .send({ _settings_test_key: 'anon_value' });
    expect(res.status).toBe(401);
  });

  it('returns 403 for jobseeker', async () => {
    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${jobseekerToken}`)
      .send({ _settings_test_key: 'seeker_value' });
    expect(res.status).toBe(403);
  });
});
