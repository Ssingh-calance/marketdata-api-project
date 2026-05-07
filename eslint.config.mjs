import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    ignores: [
      'lib/connection/snapshots/quotes/retrieveSnapshots.js',
    ],
    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'script',
      },
    },
  },
];
