import gulp from "gulp"
import fs from "node:fs"
// eslint-disable-next-line @nx/enforce-module-boundaries -- allow reading file outside of project
import packageLock from "../../package-lock.json" with { type: "json" }
const distVendor = "../../dist/vendor"
const isDev = process.env.NODE_ENV === "development"
////////////////////////////
// BEGIN EDITABLE REGION

// MODULE NAMES
const MONACO = "monaco-editor"
const monacoBaseDir = `${isDev ? "dev" : "min"}/vs`

// NOTE: Modules are loaded in the sequence of this array
const modules = [
  {
    name: MONACO,
    module: MONACO,
    src: `${monacoBaseDir}/**`,
    dest: `${monacoBaseDir}`,
  },
]

// END EDITABLE REGION
////////////////////////////

/* Not all tasks need to use streams, a gulpfile is just another node program
 * and you can use all packages available on npm, but it must return either a
 * Promise, a Stream or take a callback and call it
 */
export function clean(cb) {
  fs.rm(distVendor, { recursive: true, force: true }, cb)
}

function generateVendorManifest(cb) {
  const vendorManifest = modules.reduce(
    (manifestObj, { name, module, path, dest, preload = false, order }) => {
      const { version } = packageLock.packages[`node_modules/${module}`]
      console.info(`Using ${module}@${version}`) // eslint-disable-line no-console -- used during build time for status
      manifestObj[name] = {
        version,
        path,
        dest,
        preload,
        order,
      }
      return manifestObj
    },
    {},
  )
  fs.writeFile(
    distVendor + "/manifest.json",
    JSON.stringify(vendorManifest),
    cb,
  )
}

const scriptTasks = modules.map(
  ({ src, dest, path, base = "../../node_modules", module, name }) => {
    const { version } = packageLock.packages[`node_modules/${module}`]
    const gulpSrc = [base, module, src, path].filter((x) => !!x).join("/")
    const gulpDest = [distVendor, name, version, dest]
      .filter((x) => !!x)
      .join("/")
    return function () {
      return gulp.src(gulpSrc, { encoding: false }).pipe(gulp.dest(gulpDest))
    }
  },
)

/*
 * Specify if tasks run in series or parallel using `gulp.series` and `gulp.parallel`
 */
export const build = gulp.series(
  clean,
  gulp.parallel.apply(this, scriptTasks),
  generateVendorManifest,
)

export default build
