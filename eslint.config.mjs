import nx from "@nx/eslint-plugin"
import globals from "globals"
import { workspaceRoot } from "@nx/devkit"
import json from "@eslint/json"
import eslintPluginYml from "eslint-plugin-yml"

/** @type {import('@typescript-eslint/utils/ts-eslint').FlatConfig.Config[]} */
export default [
  ...nx.configs["flat/base"],
  ...nx.configs["flat/typescript"],
  ...nx.configs["flat/javascript"],
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
    ignores: ["**/dist"],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: workspaceRoot,
      },
    },
  },
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
