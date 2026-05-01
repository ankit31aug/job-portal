const request = require('supertest');
const app = require('../app');
const { pool } = require('../db-pg');

let jobseekerToken;

const TEST_EMAILS = ['boards_seeker@example.com'];

async function cleanupTestUsers() {
  await pool.query('DELETE FROM users WHERE email = ANY($1::text[])', [TEST_EMAILS]);
  await pool.query("DELETE FROM board_config WHERE code = 'BTEST'");
}

beforeAll(async () => {
  await cleanupTestUsers();

  const js = await request(app).post('/api/auth/register').send({
    name: 'Boards Seeker',
    email: 'boards_seeker@example.com',
    password: 'Password1',
    role: 'jobseeker',
  });
  jobseekerToken = js.body.token;

  // Seed a test board so the public listing always returns at least one
  await pool.query(
    `INSERT INTO board_config (code, name, full_name, description, color, display_order, board_type, is_active)
     VALUES ('BTEST', 'BoardTest', 'Board Test Full Name', 'For testing', 'blue-600', 100, 'board', 1)`
  );
});

afterAll(cleanupTestUsers);

describe('GET /api/boards', () => {
  it('returns active boards without auth', async () => {
    const res = await request(app).get('/api/boards');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('returns boards in ascending display_order', async () => {
    const res = await request(app).get('/api/boards');
    expect(res.status).toBe(200);
    const orders = res.body.map(b => b.display_order);
    const sorted = [...orders].sort((a, b) => a - b);
    expect(orders).toEqual(sorted);
  });

  it('does not return inactive boards', async () => {
    // Insert an inactive board
    await pool.query(
      `INSERT INTO board_config (code, name, full_name, description, color, display_order, board_type, is_active)
       VALUES ('BINACTIVE', 'Inactive Board', 'Inactive', 'Hidden', 'gray-600', 200, 'board', 0)`
    );
    const res = await request(app).get('/api/boards');
    expect(res.status).toBe(200);
    const codes = res.body.map(b => b.code);
    expect(codes).not.toContain('BINACTIVE');
    await pool.query("DELETE FROM board_config WHERE code = 'BINACTIVE'");
  });

  it('returns boards with expected fields', async () => {
    const res = await request(app).get('/api/boards');
    expect(res.status).toBe(200);
    const board = res.body.find(b => b.code === 'BTEST');
    expect(board).toBeDefined();
    expect(board).toHaveProperty('id');
    expect(board).toHaveProperty('name');
    expect(board).toHaveProperty('full_name');
  });
});

describe('GET /api/gallery (public)', () => {
  it('returns gallery items without auth', async () => {
    const res = await request(app).get('/api/gallery');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
