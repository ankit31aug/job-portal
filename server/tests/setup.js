process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://job_portal_test:testpass@localhost:5432/job_portal_test';
process.env.JWT_SECRET = 'test_jwt_secret_for_ci';
process.env.NODE_ENV = 'test';
