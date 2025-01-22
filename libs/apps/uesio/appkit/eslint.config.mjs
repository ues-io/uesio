import baseConfig from "../../../../eslint.config.mjs"

/** @type {import('@typescript-eslint/utils/ts-eslint').FlatConfig.Config[]} */
export default [
  ...baseConfig,
  {
    files: ["**/generator/**/bot.js"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { varsIgnorePattern: "^run", ignoreRestSiblings: true },
      ],
    },
  },
]
