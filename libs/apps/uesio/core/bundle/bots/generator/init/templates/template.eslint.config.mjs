import globals from "globals"
import pluginJs from "@eslint/js"
import tseslint from "typescript-eslint"
import pluginReact from "eslint-plugin-react"
import pluginReactHooks from "eslint-plugin-react-hooks"
import eslintConfigPrettier from "eslint-config-prettier"
import { fileURLToPath } from "node:url"
import { dirname } from "node:path"
import json from "@eslint/json"
import eslintPluginYml from "eslint-plugin-yml"

const __dirname = dirname(fileURLToPath(import.meta.url))

export default tseslint.config(
  {
    ignores: ["generated/**", "**/dist"],
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}"],
    extends: [
      pluginJs.configs.recommended,
      ...tseslint.configs.recommended,
      pluginReact.configs.flat.recommended,
      pluginReact.configs.flat["jsx-runtime"],
      {
        settings: {
          react: {
            version: "detect",
          },
        },
        languageOptions: {
          globals: {
            ...globals.browser,
          },
        },
      },
      {
        plugins: {
          "react-hooks": pluginReactHooks,
        },
        rules: pluginReactHooks.configs.recommended.rules,
      },
    ],
    rules: {
      "react/prop-types": "off",
      "no-template-curly-in-string": "off",
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
  },
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
  eslintConfigPrettier,
  {
    files: ["**/bundle/bots/**/*.js"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
)
