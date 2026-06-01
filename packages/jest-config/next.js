// @ts-check
const nextJest = require('next/jest');
const base = require('./base');

const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const config = {
  ...base,
  moduleFileExtensions: [...base.moduleFileExtensions, 'jsx', 'tsx'],
  testEnvironment: 'jsdom',
};

module.exports = createJestConfig(config);
