// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  prettierConfig,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Allow explicit `any` only when annotated with a comment
      "@typescript-eslint/no-explicit-any": "error",

      // Require consistent return types
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",

      // Enforce void over undefined for functions that return nothing
      "@typescript-eslint/no-invalid-void-type": "warn",

      // Unused variables (still allows underscore-prefixed)
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // Prefer nullish coalescing and optional chaining
      "@typescript-eslint/prefer-nullish-coalescing": "warn",
      "@typescript-eslint/prefer-optional-chain": "warn",

      // Disallow floating promises
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",

      // Consistent type imports
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],

      // No require() calls
      "@typescript-eslint/no-require-imports": "error",
    },
  },
  {
    // Ignore compiled output and config files
    ignores: ["dist/**", "node_modules/**", "*.js", "*.mjs", "*.cjs"],
  }
);
