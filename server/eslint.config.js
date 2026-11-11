// Flat ESLint config (ESLint 9). Minimal baseline; expanded as the server grows.
import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
    },
  },
  {
    ignores: ["dist/", "node_modules/"],
  },
];
