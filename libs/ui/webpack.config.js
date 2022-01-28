//const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const path = require("path")
const sourceMaps = { devtool: "source-map" }
const inDevMode = process.env.NODE_ENV
	? process.env.NODE_ENV === "development"
	: true

const package = require("./package.json")
module.exports = {
	// mode: inDevMode ? "development" : "production",
	mode: "production",
	// Enable sourcemaps for debugging webpack's output.
	...(inDevMode ? sourceMaps : {}),

	resolve: {
		// Add '.ts' and '.tsx' as resolvable extensions.
		extensions: [".ts", ".tsx", ".js"],
	},

	module: {
		rules: [
			{
				test: /\.ts(x?)$/,
				exclude: /node_modules/,
				use: [
					{
						loader: "ts-loader",
					},
				],
			},
			// All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
			{
				enforce: "pre",
				test: /\.js$/,
				loader: "source-map-loader",
			},
		],
	},

	entry: {
		uesio: "./src/index.ts",
	},

	target: "web",

	node: false,

	// output: {
	// 	library: package.name,
	// 	libraryTarget: "commonjs",
	// 	filename: package.name + ".js",
	// 	sourceMapFilename: package.name + ".js.map",
	// 	path: path.join(__dirname, "../../dist/ui"),
	// },

	//plugins: [new BundleAnalyzerPlugin()],

	// When importing a module whose path matches one of the following, just
	// assume a corresponding global variable exists and use that instead.
	// This is important because it allows us to avoid bundling all of our
	// dependencies, which allows browsers to cache those libraries between builds.
	externals: {
		react: "React",
		"react-dom": "ReactDOM",
		redux: "Redux",
		"react-redux": "ReactRedux",
		"@emotion/css": "emotion",
	},
}
