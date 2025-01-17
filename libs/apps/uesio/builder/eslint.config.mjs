import baseConfig from "../../../../eslint.config.mjs"

/** @type {import('@typescript-eslint/utils/ts-eslint').FlatConfig.Config[]} */
export default [
	...baseConfig,
	{
		ignores: ["**/build/*"],
	},
	{
		files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
		languageOptions: {
			parserOptions: {
				project: ["libs/apps/uesio/builder/tsconfig.*?.json"],
			},
		},
		rules: {},
	},
]
