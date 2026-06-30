import js from "@eslint/js";
import globals from "globals";
import astro from "eslint-plugin-astro";
import tsParser from "@typescript-eslint/parser";

export default [
  { ignores: ["build/", ".astro/", "node_modules/", "**/*.d.ts", "scripts/"] },
  js.configs.recommended,
  ...astro.configs.recommended,
  ...astro.configs["jsx-a11y-recommended"],
  {
    // Parse the TypeScript in .astro frontmatter (type Props, `as` casts).
    files: ["**/*.astro"],
    languageOptions: { parserOptions: { parser: tsParser } }
  },
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node }
    },
    rules: {
      // Client <script> blocks and utils intentionally use loose patterns.
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-empty": "warn",
      // Escapes in our validation/sanitizer regexes are intentional for clarity.
      "no-useless-escape": "off",
      // Runtime a11y is enforced by the axe/Playwright suite; keep these static
      // hints advisory (they include known false positives, e.g. aria-invalid on
      // radio is valid in ARIA 1.2; the Modal close-button autofocus is intended).
      "astro/jsx-a11y/no-autofocus": "warn",
      "astro/jsx-a11y/role-supports-aria-props": "warn",
      "astro/jsx-a11y/no-noninteractive-tabindex": "warn"
    }
  }
];
