const base = require('./base');

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  rootDir: '.',
  testRegex: '.e2e-spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
};
