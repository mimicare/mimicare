import baseConfig from './base.ts';
import tseslint from 'typescript-eslint';
import type { Linter } from 'eslint';

export default tseslint.config(...baseConfig, {
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
  },
}) as Linter.Config[];
