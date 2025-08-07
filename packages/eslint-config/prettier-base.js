// @ts-check
import baseConfig from './base.js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';

export default tseslint.config(...baseConfig, eslintPluginPrettierRecommended);
