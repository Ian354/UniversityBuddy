module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'routes/**/*.js',
    '!routes/**/*.test.js',
    '!routes/**/*.spec.js'
  ],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};