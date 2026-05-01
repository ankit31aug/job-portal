module.exports = {
  testEnvironment: 'node',
  setupFiles: ['./tests/setup.js'],
  globalTeardown: './tests/teardown.js',
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 15000,
};
