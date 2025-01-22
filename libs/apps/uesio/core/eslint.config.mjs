import baseConfig from "../../../../eslint.config.mjs"

/** @type {import('@typescript-eslint/utils/ts-eslint').FlatConfig.Config[]} */
export default [
  ...baseConfig,
  {
    ignores: ["**/generator/**/templates/**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    languageOptions: {
      parserOptions: {
        project: ["libs/apps/uesio/core/tsconfig.*?.json"],
      },
    },
    rules: {},
  },
  {
    files: ["**/generator/**/bot.js"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { varsIgnorePattern: "^generate", ignoreRestSiblings: true },
      ],
    },
  },
]
