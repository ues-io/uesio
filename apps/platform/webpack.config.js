var path = require("path")

module.exports = {
	mode: "production",
	entry: "./platform/platform.ts",
	output: {
		path: path.resolve(__dirname, "./platform"),
		filename: "platform.js",
	},
	resolve: {
		// Add ".ts" and ".tsx" as resolvable extensions.
		extensions: [".ts", ".tsx", ".js"],
		alias: {
			"@uesio/ui": path.resolve(__dirname, "../../libs/ui/src/index.ts"),
		},
	},
	module: {
		rules: [
			// all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
			{
				test: /\.ts(x?)$/,
				loader: "ts-loader",
			},
		],
	},
	externals: {
		"@uesio/ui": "uesio",
	},
}
