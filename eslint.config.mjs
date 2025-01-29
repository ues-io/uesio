import nx from "@nx/eslint-plugin"
import globals from "globals"
import { workspaceRoot } from "@nx/devkit"
import json from "@eslint/json"
import eslintPluginYml from "eslint-plugin-yml"
import tseslint from "typescript-eslint"

/** @type {import('@typescript-eslint/utils/ts-eslint').FlatConfig.Config[]} */
export default [
  {
    ignores: ["**/dist"],
  },
  ...nx.configs["flat/base"],
  ...tseslint.config(
    {
      files: ["**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}"],
      extends: [nx.configs["flat/typescript"], nx.configs["flat/javascript"]],
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir: workspaceRoot,
        },
      },
    },
    {
      files: ["**/*.{ts,mts,cts,tsx}"],
      extends: [
        // TODO: Uncomment once all the rule violations are addressed
        // tseslint.configs.strictTypeChecked,
        // tseslint.configs.stylisticTypeChecked,
      ],
      rules: {
        // Permanent Overrides
        "@typescript-eslint/consistent-type-definitions": "off",

        // TODO: Remove all temporary rules once all the rule violations are addressed
        // Temporary Rules
        //"@typescript-eslint/prefer-nullish-coalescing": "error"
      },
    },
  ),
  {
    files: ["**/*.json"],
    ignores: ["package-lock.json"],
    language: "json/json",
    ...json.configs.recommended,
  },
  {
    files: ["**/*.jsonc"],
    language: "json/jsonc",
    ...json.configs.recommended,
  },
  ...[
    ...eslintPluginYml.configs["flat/recommended"],
    {
      rules: {
        "yml/no-empty-mapping-value": "off",
      },
    },
  ].map((c) => ({
    ...c,
    files: ["*.yaml", "**/*.yaml", "*.yml", "**/*.yml"],
  })),
  {
    files: ["**/*.spec.{ts,tsx,js,jsx}"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    rules: {
      "@nx/enforce-module-boundaries": [
        "error",
        {
          enforceBuildableLibDependency: true,
          allow: ["^.*/eslint(\\.base)?\\.config\\.[cm]?js$"],
          depConstraints: [
            {
              sourceTag: "*",
              onlyDependOnLibsWithTags: ["*"],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "**/*.ts",
      "**/*.tsx",
      "**/*.cts",
      "**/*.mts",
      "**/*.js",
      "**/*.jsx",
      "**/*.cjs",
      "**/*.mjs",
    ],
    rules: {
      "@typescript-eslint/no-unused-expressions": [
        "error",
        { allowTernary: true, allowShortCircuit: true },
      ],
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
]
