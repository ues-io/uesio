// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path")
//const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin")
const MONACO_DIR = path.resolve(__dirname, "../../node_modules/monaco-editor")
const sourceMaps = {devtool: "source-map"}
const inDevMode = process.env.NODE_ENV ? process.env.NODE_ENV === "development" : true
module.exports = {
	mode: inDevMode ? "development" : "production",
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
			{
				test: /\.css$/,
				include: MONACO_DIR,
				use: ["style-loader", "css-loader"],
			},
			{
				test: /\.ttf$/,
				use: ["file-loader"],
			},
		],
	},

	entry: {
		LazyMonaco: "./src/index.tsx",
	},

	output: {
		globalObject: "self",
		library: "LazyMonaco",
		libraryTarget: "umd",
		filename: "[name].js",
		chunkFilename: "[name].js",
		sourceMapFilename: "[name].js.map",
		path: path.join(__dirname, "../../dist/lazymonaco"),
	},

	plugins: [
		new MonacoWebpackPlugin({
			// available options are documented at https://github.com/Microsoft/monaco-editor-webpack-plugin#options
			languages: ["yaml", "json", "javascript"],
		}),
		//new BundleAnalyzerPlugin(),
	],

	node: false,

	// When importing a module whose path matches one of the following, just
	// assume a corresponding global variable exists and use that instead.
	// This is important because it allows us to avoid bundling all of our
	// dependencies, which allows browsers to cache those libraries between builds.
	externals: {
		react: "React",
		"react-dom": "ReactDOM",
		"@material-ui/core": "MaterialUI",
	},
}
