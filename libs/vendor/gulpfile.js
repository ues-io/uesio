const gulp = require("gulp")
const fs = require("fs")
const packageLock = require("../../package-lock.json")
const distVendor = "../../dist/vendor"
const fontsSrc = "fonts/**"
const nodeModules = "../../node_modules"
const devMode = process.env.UESIO_DEV === "true"

////////////////////////////
// BEGIN EDITABLE REGION

// MODULE NAMES
const REACT = "react"
const REACT_DOM = "react-dom"
const MONACO = "monaco-editor"
const AJV = "ajv"

// NOTE: Modules are loaded in the sequence of this array
const modules = [
	{
		name: REACT,
		path: `umd/react.${devMode ? "development" : "production.min"}.js`,
		dest: "umd",
		preload: true,
		order: 1,
	},
	{
		name: REACT_DOM,
		path: `umd/react-dom.${devMode ? "development" : "production.min"}.js`,
		dest: "umd",
		preload: true,
		order: 2,
	},
	{
		name: MONACO,
		src: "min/vs/**",
		dest: "min/vs",
	},
	// {
	// 	name: AJV,
	// 	src: "dist/2019.js",
	// 	dest: "dist",
	// },
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
		(manifestObj, { name: module, path, preload = false, order }) => {
			const { version } = packageLock.packages[`node_modules/${module}`]
			console.log(`Using ${module}@${version}`)
			manifestObj[module] = {
				version,
				path,
				preload,
				order,
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

const moveFonts = () =>
	gulp.src(fontsSrc).pipe(gulp.dest(`${distVendor}/fonts`))

/*
 * Specify if tasks run in series or parallel using `gulp.series` and `gulp.parallel`
 */
const build = gulp.series(
	clean,
	gulp.parallel.apply(this, scriptTasks),
	generateVendorManifest,
	moveFonts
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
