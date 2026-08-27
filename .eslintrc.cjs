module.exports = {
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist/**', 'node_modules/**', '*.config.*', 'stock.xlsx.xlsx'],
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