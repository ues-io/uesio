import baseConfig from "../../../../eslint.config.mjs"
import nx from "@nx/eslint-plugin"

// nx react config does not apply files property so limit rules to avoid conflicts with other plugins
const reactConfig = nx.configs["flat/react"].map((c) => ({
  ...c,
  files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
}))

/** @type {import('@typescript-eslint/utils/ts-eslint').FlatConfig.Config[]} */
export default [
  ...baseConfig,
  ...reactConfig,
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
