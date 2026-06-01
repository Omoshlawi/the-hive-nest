/** @type {import('jest').Config} */
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testEnvironment: 'node',
};
