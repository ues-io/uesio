export default {
	displayName: "ui",
	preset: "../../jest.preset.js",
	globals: {
		"ts-jest": { tsconfig: "<rootDir>/tsconfig.spec.json" },
	},
	clearMocks: true,
	transform: {
		"^.+\\.[tj]sx?$": "ts-jest",
	},
	setupFiles: ["whatwg-fetch"],
	// setupFilesAfterEn: ["./setupJest.ts"],

	moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
	coverageDirectory: "../../coverage/libs/ui",
}
