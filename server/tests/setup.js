process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_ci';
process.env.NODE_ENV = 'test';
// Default DATABASE_URL for local test runs; overridden by CI environment variable.
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/test_db';
