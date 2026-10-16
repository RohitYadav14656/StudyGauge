export default {
  testEnvironment: 'node',
  transform: {},
  setupFilesAfterEnv: ['./tests/setup.js'],
  testMatch: ['**/*.test.js'],
  clearMocks: true,
};
