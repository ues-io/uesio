import baseConfig from "../../../../eslint.config.mjs"

/** @type {import('@typescript-eslint/utils/ts-eslint').FlatConfig.Config[]} */
export default [
  ...baseConfig,
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    languageOptions: {
      parserOptions: {
        project: ["libs/apps/uesio/studio/tsconfig.*?.json"],
      },
    },
    rules: {},
  },
]
