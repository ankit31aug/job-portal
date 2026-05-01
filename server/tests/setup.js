// PostgreSQL connection for tests — use DATABASE_URL from env (set by CI or locally).
// Fall back to a sensible local default so developers can run tests without extra config.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/qci_test';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test_jwt_secret_for_ci';
}
process.env.NODE_ENV = 'test';
