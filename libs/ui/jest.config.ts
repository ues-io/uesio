export default {
	displayName: "ui",
	preset: "../../jest.preset.js",
	clearMocks: true,
	transform: {
		"^.+\\.[tj]sx?$": "ts-jest",
	},
	setupFiles: ["whatwg-fetch"],
	moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
	coverageDirectory: "../../coverage/libs/ui",
}
