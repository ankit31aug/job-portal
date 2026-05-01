// DATABASE_URL must be supplied by the environment (CI sets it; local dev uses .env).
// Fall back to a local test database so plain `npm test` works when postgres is
// running with default trust auth on localhost.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost/qci_test';
}

process.env.JWT_SECRET = 'test_jwt_secret_for_ci';
process.env.NODE_ENV = 'test';
