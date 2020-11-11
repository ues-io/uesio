var path = require('path');

module.exports = {
	mode: 'production',
	devtool: 'inline-source-map',
	entry: {
		main: './platform/platform.ts',
	},
	output: {
		path: path.resolve(__dirname, './platform'),
		filename: 'platform.js',
	},
	resolve: {
		// Add ".ts" and ".tsx" as resolvable extensions.
		extensions: ['.ts', '.tsx', '.js'],
	},
	module: {
		rules: [
			// all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
			{
				test: /\.tsx?$/,
				exclude: /node_modules/,
				loader: 'ts-loader',
			},
		],
	},
};
