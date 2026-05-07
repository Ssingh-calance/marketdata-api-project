import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    ignores: [
      'lib/connection/snapshots/quotes/retrieveSnapshots.js',
      'example/browser/js/**',
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
  {
    files: ['test/**/*.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jasmine: 'readonly',
      },
    },
  },
  {
    files: ['example/browser/*.js'],
    languageOptions: {
      globals: {
        ko: 'readonly',
        toastr: 'readonly',
        u: 'readonly',
        Barchart: 'readonly',
      },
    },
  },
  {
    files: ['lib/utilities/xml/XmlParserFactoryForBrowsers.js'],
    languageOptions: {
      globals: {
        DOMParser: 'readonly',
      },
    },
  },
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      globals: {
        console: 'readonly',
        setTimeout: 'readonly',
        clearInterval: 'readonly',
        setInterval: 'readonly',
        Buffer: 'readonly',
      },
    },
  },
];
