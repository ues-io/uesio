var path = require('path');

module.exports = {
	mode: 'production',

	// Enable sourcemaps for debugging webpack's output.
	devtool: 'source-map',

	resolve: {
		// Add '.ts' and '.tsx' as resolvable extensions.
		extensions: ['.ts', '.tsx', '.js'],
	},

	module: {
		rules: [
			{
				test: /\.ts(x?)$/,
				exclude: /node_modules/,
				use: [
					{
						loader: 'ts-loader',
					},
				],
			},
			// All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
			{
				enforce: 'pre',
				test: /\.js$/,
				loader: 'source-map-loader',
			},
		],
	},

	entry: {
		platform: './platform/platform.ts',
	},

	node: false,

	output: {
		library: '[name]',
		libraryTarget: 'umd',
		filename: '[name].js',
		sourceMapFilename: '[name].js.map',
		path: path.join(__dirname, './platform'),
	},
};
