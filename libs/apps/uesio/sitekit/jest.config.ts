/* eslint-disable */
export default {
	displayName: "sitekit",
	preset: "../../../../jest.preset.js",
	globals: {
		"ts-jest": { tsconfig: "<rootDir>/tsconfig.spec.json" },
	},
	transform: {
		"^.+\\.[tj]sx?$": "ts-jest",
	},
	moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
	coverageDirectory: "../../coverage/libs/apps/uesio/sitekit",
}
