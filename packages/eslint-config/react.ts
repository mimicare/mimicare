import baseConfig from './base.ts';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import type { Linter } from 'eslint';

export default tseslint.config(...baseConfig, {
  files: ['**/*.{ts,tsx}'],
  plugins: {
    react: reactPlugin,
    'react-hooks': reactHooksPlugin,
    'react-refresh': reactRefreshPlugin,
  },
  rules: {
    ...reactPlugin.configs.recommended.rules,
    ...reactPlugin.configs['jsx-runtime'].rules,
    ...reactHooksPlugin.configs.recommended.rules,
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    '@typescript-eslint/no-explicit-any': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  languageOptions: {
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
}) as Linter.Config[];
