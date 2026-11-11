// Flat ESLint config (ESLint 9). Minimal baseline; expanded as the client grows.
import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      "no-unused-vars": "warn",
    },
  },
  {
    ignores: ["dist/", "node_modules/"],
  },
];
