var path = require("path")
const sourceMaps = { devtool: "source-map" }
const inDevMode = process.env.NODE_ENV
	? process.env.NODE_ENV === "development"
	: false
module.exports = {
	mode: inDevMode ? "development" : "production",
	// Enable sourcemaps for debugging webpack's output.
	...(inDevMode ? sourceMaps : {}),

	resolve: {
		extensions: [".js"],
	},

	entry: {
		yaml: "../../node_modules/yaml/index.js",
	},

	node: false,

	output: {
		library: "[name]",
		libraryTarget: "umd",
		filename: "[name].js",
		sourceMapFilename: "[name].js.map",
		path: path.join(__dirname, "../../dist/yaml"),
	},
}
