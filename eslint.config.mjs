import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

const nodeGlobals = {
  ...globals.node,
  ...globals.browser,
  require: "readonly",
  module: "readonly",
  exports: "readonly",
};

const browserGlobals = {
  ...globals.browser,
  require: "readonly",
  module: "readonly",
  exports: "readonly",
  process: "readonly",
  Buffer: "readonly",
  global: "readonly",
  console: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  ko: "readonly",
  toastr: "readonly",
  u: "readonly",
  Barchart: "readonly",
  DOMParser: "readonly",
  window: "readonly",
  self: "readonly",
  WebSocket: "readonly",
  document: "readonly",
  navigator: "readonly",
  XMLHttpRequest: "readonly",
  FormData: "readonly",
  URLSearchParams: "readonly",
  btoa: "readonly",
  Intl: "readonly",
  define: "readonly",
  $: "readonly",
};

export default defineConfig([
  {
    ignores: ["dist/", "test/dist/", "example/browser/", "**/*.bundle.js"],
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: nodeGlobals,
      parserOptions: { ecmaVersion: "latest", sourceType: "script" },
    },
  },
  {
    files: ["test/**/*.js", "**/*.spec.js", "**/*Spec.js"],
    languageOptions: {
      globals: {
        ...nodeGlobals,
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        jasmine: "readonly",
      },
    },
  },
  {
    files: ["example/browser/**/*.js", "marketdata-api-project/example/browser/**/*.js", "lib/utilities/xml/XmlParserFactoryForBrowsers.js", "lib/connection/adapter/WebSocketAdapterFactoryForBrowsers.js"],
    languageOptions: {
      globals: browserGlobals,
    },
  },
]);
