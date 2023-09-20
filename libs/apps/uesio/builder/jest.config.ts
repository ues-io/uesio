/* eslint-disable */
export default {
	displayName: "builder",
	preset: "../../../../jest.preset.js",
	globals: {
		"ts-jest": { tsconfig: "<rootDir>/tsconfig.spec.json" },
	},
	transform: {
		"^.+\\.[tj]sx?$": "ts-jest",
	},
	moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
	coverageDirectory: "../../coverage/libs/apps/uesio/builder",
}
