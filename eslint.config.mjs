// @ts-check
// Root config — apps/ and packages/ have their own configs
import hiveConfig from '@hive/eslint-config/library';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['apps/**', 'packages/**', 'node_modules/**'],
  },
  ...hiveConfig,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
