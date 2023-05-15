const gulp = require("gulp")
const fs = require("fs")
const packageLock = require("../../package-lock.json")
const distVendor = "../../dist/vendor"
const nodeModules = "../../node_modules"
const devMode = process.env.UESIO_DEV === "true"

////////////////////////////
// BEGIN EDITABLE REGION

// MODULE NAMES
const REACT = "react"
const REACT_DOM = "react-dom"
const EMOTION = "@emotion/css"
const MONACO = "monaco-editor"

// NOTE: Modules are loaded in the sequence of this array
const modules = [
	{
		name: REACT,
		path: `umd/react.${devMode ? "development" : "production.min"}.js`,
		dest: "umd",
	},
	{
		name: [REACT_DOM],
		path: `umd/react-dom.${devMode ? "development" : "production.min"}.js`,
		dest: "umd",
	},
	{
		name: [EMOTION],
		path: "dist/emotion-css.umd.min.js",
		dest: "dist",
	},
	{
		name: [MONACO],
		src: "min/vs/**",
		dest: "min/vs",
	},
]

// END EDITABLE REGION
////////////////////////////

/* Not all tasks need to use streams, a gulpfile is just another node program
 * and you can use all packages available on npm, but it must return either a
 * Promise, a Stream or take a callback and call it
 */
function clean(cb) {
	fs.rm(distVendor, { recursive: true, force: true }, cb)
}

function generateVendorManifest(cb) {
	const vendorManifest = modules.reduce(
		(manifestObj, { name: module, path }) => {
			const { version } = packageLock.packages[`node_modules/${module}`]
			console.log(`Using ${module}@${version}`)
			manifestObj[module] = {
				version,
				path,
			}
			return manifestObj
		},
		{}
	)
	fs.writeFile(
		distVendor + "/manifest.json",
		JSON.stringify(vendorManifest),
		cb
	)
}

const scriptTasks = modules.map(({ src, dest, path, name: module }) => {
	const { version } = packageLock.packages[`node_modules/${module}`]
	const gulpSrc = [nodeModules, module, src, path]
		.filter((x) => !!x)
		.join("/")
	const gulpDest = [distVendor, module, version, dest]
		.filter((x) => !!x)
		.join("/")
	return function () {
		return gulp.src(gulpSrc).pipe(gulp.dest(gulpDest))
	}
})

/*
 * Specify if tasks run in series or parallel using `gulp.series` and `gulp.parallel`
 */
const build = gulp.series(
	clean,
	gulp.parallel.apply(this, scriptTasks),
	generateVendorManifest
)

/*
 * You can use CommonJS `exports` module notation to declare tasks
 */
exports.clean = clean
// exports.scripts = scripts
exports.build = build
/*
 * Define default task that can be called by just running `gulp` from cli
 */
exports.default = build
