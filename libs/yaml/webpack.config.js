var path = require("path");

module.exports = {
	mode: "production",

	// Enable sourcemaps for debugging webpack's output.
	devtool: "source-map",

	resolve: {
		extensions: [".js"],
	},

	module: {
		rules: [
			{ test: /node_modules\/yaml\/browser\/dist\/.*/, type: 'javascript/auto' }
		],
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
    path: path.join(__dirname, "../../dist/yaml")
	},
}
