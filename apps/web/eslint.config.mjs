// @ts-check
import hiveConfig from '@hive/eslint-config/next';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist/**/*'],
  },
  ...hiveConfig,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // Project-specific overrides
  {
    rules: {
      // Add any project-specific rule overrides here
    },
  },
);