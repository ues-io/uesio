export default {
	displayName: "ui",
	preset: "../../jest.preset.js",
	clearMocks: true,
	transform: {
		"^.+\\.[tj]sx?$": "ts-jest",
	},
	moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
	coverageDirectory: "../../coverage/libs/ui",
}
