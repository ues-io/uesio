module.exports = {
	displayName: "appkit",
	preset: "../../../../jest.preset.js",
	transform: {
		"^.+\\.(t|j)sx?$": "@swc/jest",
	},
	moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
	coverageDirectory: "../../coverage/libs/apps/uesio/appkit",
}