/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'coverage/',
    '*.min.js',
  ],
  rules: {
    'no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    'no-console': 'off',
    'prefer-const': 'warn',
    'no-var': 'error',
    eqeqeq: ['warn', 'smart'],
    'no-throw-literal': 'error',
  },
  overrides: [
    {
      files: ['tests/**/*.mjs', 'scripts/**/*.mjs'],
      env: {
        node: true,
        browser: false,
      },
    },
    {
      files: ['src/**/*.js'],
      env: {
        browser: true,
        node: false,
      },
      globals: {
        Phaser: 'readonly',
      },
    },
  ],
};
