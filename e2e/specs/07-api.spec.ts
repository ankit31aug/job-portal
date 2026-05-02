import { test, expect, request } from '@playwright/test';

const API = 'http://localhost:5000/api';

test.describe('API Health & Core Endpoints', () => {
  test('GET /api/health returns OK', async ({ request }) => {
    const res = await request.get(`${API}/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('OK');
  });

  test('GET /api/jobs returns paginated list', async ({ request }) => {
    const res = await request.get(`${API}/jobs?limit=5`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.jobs)).toBe(true);
    expect(typeof body.total).toBe('number');
  });

  test('GET /api/jobs/stats returns department counts', async ({ request }) => {
    const res = await request.get(`${API}/jobs/stats`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.total).toBe('number');
    expect(typeof body.byDepartment).toBe('object');
  });

  test('GET /api/settings returns key-value pairs', async ({ request }) => {
    const res = await request.get(`${API}/settings`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body).toBe('object');
    expect(body.site_name).toBeDefined();
  });

  test('GET /api/jobs with search filters', async ({ request }) => {
    const res = await request.get(`${API}/jobs?search=Manager`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.jobs)).toBe(true);
  });

  test('GET /api/jobs/:id returns 404 for invalid id', async ({ request }) => {
    const res = await request.get(`${API}/jobs/999999`);
    expect(res.status()).toBe(404);
  });

  test('POST /api/auth/login with wrong creds returns 401', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: { email: 'nobody@test.com', password: 'wrongpass' }
    });
    expect([401, 429]).toContain(res.status());
  });

  test('GET /api/superadmin/stats without auth returns 401', async ({ request }) => {
    const res = await request.get(`${API}/superadmin/stats`);
    expect(res.status()).toBe(401);
  });

  test('settings contains all required keys', async ({ request }) => {
    const res = await request.get(`${API}/settings`);
    const body = await res.json();
    const required = [
      'site_name', 'home_hero_badge', 'home_hero_title_1',
      'about_leaders', 'home_announcements', 'home_events',
    ];
    for (const key of required) {
      expect(body[key]).toBeDefined();
    }
  });

  test('about_leaders setting is valid JSON array', async ({ request }) => {
    const res = await request.get(`${API}/settings`);
    const body = await res.json();
    const leaders = JSON.parse(body.about_leaders || '[]');
    expect(Array.isArray(leaders)).toBe(true);
    expect(leaders.length).toBeGreaterThan(0);
    expect(leaders[0].name).toBeDefined();
    expect(leaders[0].title).toBeDefined();
  });

  test('home_announcements is valid JSON array', async ({ request }) => {
    const res = await request.get(`${API}/settings`);
    const body = await res.json();
    const items = JSON.parse(body.home_announcements || '[]');
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });
});
