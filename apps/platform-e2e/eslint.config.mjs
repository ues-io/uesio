import cypress from "eslint-plugin-cypress"
import baseConfig from "../../eslint.config.mjs"

/** @type {import('@typescript-eslint/utils/ts-eslint').FlatConfig.Config[]} */
export default [cypress.configs["recommended"], ...baseConfig]
