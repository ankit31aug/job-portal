const request = require('supertest');
const app = require('../app');
const { pool } = require('../db-pg');

let jobseekerToken;
let createdAlertId;

const TEST_EMAILS = ['alert_seeker@example.com'];

async function cleanupTestUsers() {
  const userIds = (
    await pool.query('SELECT id FROM users WHERE email = ANY($1::text[])', [TEST_EMAILS])
  ).rows.map(r => r.id);
  if (userIds.length) {
    await pool.query('DELETE FROM job_alerts WHERE user_id = ANY($1::int[])', [userIds]);
    await pool.query('DELETE FROM users WHERE id = ANY($1::int[])', [userIds]);
  }
}

beforeAll(async () => {
  await cleanupTestUsers();

  const js = await request(app).post('/api/auth/register').send({
    name: 'Alert Seeker',
    email: 'alert_seeker@example.com',
    password: 'Password1',
    role: 'jobseeker',
  });
  jobseekerToken = js.body.token;
});

afterAll(cleanupTestUsers);

describe('GET /api/job-alerts', () => {
  it('returns empty list for new user', async () => {
    const res = await request(app)
      .get('/api/job-alerts')
      .set('Authorization', `Bearer ${jobseekerToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/job-alerts');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/job-alerts', () => {
  it('creates a job alert with full fields', async () => {
    const res = await request(app)
      .post('/api/job-alerts')
      .set('Authorization', `Bearer ${jobseekerToken}`)
      .send({
        label: 'React Jobs in Delhi',
        keywords: 'react,javascript',
        location: 'New Delhi',
        category: 'IT',
        experience_min: 1,
        experience_max: 5,
      });
    expect(res.status).toBe(201);
    expect(res.body.label).toBe('React Jobs in Delhi');
    expect(res.body.keywords).toBe('react,javascript');
    expect(res.body.is_active).toBe(1);
    createdAlertId = res.body.id;
  });

  it('creates a job alert with only required label', async () => {
    const res = await request(app)
      .post('/api/job-alerts')
      .set('Authorization', `Bearer ${jobseekerToken}`)
      .send({ label: 'Any Job' });
    expect(res.status).toBe(201);
    expect(res.body.label).toBe('Any Job');
    // Cleanup extra alert
    if (res.body.id) {
      await pool.query('DELETE FROM job_alerts WHERE id = $1', [res.body.id]);
    }
  });

  it('returns 400 when label is missing', async () => {
    const res = await request(app)
      .post('/api/job-alerts')
      .set('Authorization', `Bearer ${jobseekerToken}`)
      .send({ keywords: 'react' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/label/i);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/job-alerts')
      .send({ label: 'Anon Alert' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/job-alerts (after creation)', () => {
  it('lists created alerts', async () => {
    const res = await request(app)
      .get('/api/job-alerts')
      .set('Authorization', `Bearer ${jobseekerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('label');
    expect(res.body[0]).toHaveProperty('is_active');
  });
});

describe('PATCH /api/job-alerts/:id/toggle', () => {
  it('toggles alert to inactive', async () => {
    const res = await request(app)
      .patch(`/api/job-alerts/${createdAlertId}/toggle`)
      .set('Authorization', `Bearer ${jobseekerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.is_active).toBe(0);
  });

  it('toggles alert back to active', async () => {
    const res = await request(app)
      .patch(`/api/job-alerts/${createdAlertId}/toggle`)
      .set('Authorization', `Bearer ${jobseekerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.is_active).toBe(1);
  });

  it('returns 404 for non-existent alert', async () => {
    const res = await request(app)
      .patch('/api/job-alerts/999999/toggle')
      .set('Authorization', `Bearer ${jobseekerToken}`);
    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).patch(`/api/job-alerts/${createdAlertId}/toggle`);
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/job-alerts/:id', () => {
  it('deletes an alert', async () => {
    const res = await request(app)
      .delete(`/api/job-alerts/${createdAlertId}`)
      .set('Authorization', `Bearer ${jobseekerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  it('returns 404 for non-existent alert', async () => {
    const res = await request(app)
      .delete('/api/job-alerts/999999')
      .set('Authorization', `Bearer ${jobseekerToken}`);
    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).delete('/api/job-alerts/999999');
    expect(res.status).toBe(401);
  });
});
