const os = require('os');
const path = require('path');

// Each worker gets its own SQLite file so parallel test suites don't collide.
process.env.DB_PATH = path.join(os.tmpdir(), `test-jobportal-${process.pid}.db`);
process.env.JWT_SECRET = 'test_jwt_secret_for_ci';
process.env.NODE_ENV = 'test';
