module.exports = {
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: [
    'dist/**',
    'node_modules/**',
    '*.config.*',
    '*.xlsx',
    'server/__tests__/**',
    'server/db/check_*.ts',
    'server/db/diagnose_*.ts',
    'server/db/dump_*.ts',
    'server/db/inspect_*.ts',
    'server/db/test_*.ts',
    'scripts/**',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.server.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'no-constant-condition': ['error', { checkLoops: false }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'no-extra-semi': 'warn',
  },
  overrides: [
    {
      files: ['server/**/*.ts'],
      parserOptions: {
        project: './tsconfig.server.json',
      },
    },
    {
      files: ['client/**/*.ts', 'client/**/*.tsx'],
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  ],
}