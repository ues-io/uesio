import baseConfig from "../../../../eslint.config.mjs"
import nx from "@nx/eslint-plugin"

// nx react config does not apply files property so limit rules to avoid conflicts with other plugins
const reactConfig = nx.configs["flat/react"].map((c) => ({
  files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
  ...c,
}))

/** @type {import('@typescript-eslint/utils/ts-eslint').FlatConfig.Config[]} */
export default [...baseConfig, ...reactConfig]
