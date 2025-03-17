import baseConfig from "../../../../eslint.config.mjs"
import nx from "@nx/eslint-plugin"

/** @type {import('@typescript-eslint/utils/ts-eslint').FlatConfig.Config[]} */
export default [
  ...baseConfig,
  ...nx.configs["flat/react"],
  {
    files: ["**/generator/**/bot.js"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { varsIgnorePattern: "^run", ignoreRestSiblings: true },
      ],
    },
  },
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    rules: {
      "no-template-curly-in-string": "off",
    },
  },
]
