import cypress from "eslint-plugin-cypress/flat"
import baseConfig from "../../eslint.config.mjs"

/** @type {import('@typescript-eslint/utils/ts-eslint').FlatConfig.Config[]} */
export default [
  cypress.configs["recommended"],
  ...baseConfig,
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    languageOptions: {
      parserOptions: {
        project: ["apps/platform-e2e/tsconfig.json"],
      },
    },
    rules: {},
  },
]
