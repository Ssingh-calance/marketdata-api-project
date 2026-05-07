import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    ignores: [
      'lib/connection/snapshots/quotes/retrieveSnapshots.js',
      'example/browser/example.js',
      'example/browser/js/**',
      'node_modules/**',
      'docs/**',
    ],
  },
  {
    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
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
    files: ['example/browser/**/*.js', 'lib/environment/EnvironmentForBrowsers.js', 'lib/connection/adapter/WebSocketAdapterFactoryForBrowsers.js', 'lib/utilities/xml/XmlParserFactoryForBrowsers.js'],
    languageOptions: {
      globals: {
        ko: 'readonly',
        toastr: 'readonly',
        u: 'readonly',
        Barchart: 'readonly',
        DOMParser: 'readonly',
        window: 'readonly',
        self: 'readonly',
        WebSocket: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        XMLHttpRequest: 'readonly',
        FormData: 'readonly',
        URLSearchParams: 'readonly',
        btoa: 'readonly',
        Intl: 'readonly',
        define: 'readonly',
        $: 'readonly',
      },
    },
  },
];
