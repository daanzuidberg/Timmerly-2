import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

/** Gedeelde lintregels; apps voegen hun eigen framework-plugins toe. */
export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }]
    }
  },
  { ignores: ['**/dist/**', '**/.next/**', '**/node_modules/**', '**/*.config.*'] }
);
