import * as esbuild from "esbuild"
import fs from "node:fs"

// NOTE - if NODE_ENV is undefined, esbuild will set NODE_ENV to "production" when all minify options
// are true, otherwise set it to "development".  If NODE_ENV is specifically set to development prior
// to calling esbuild, we do not want to minify.
const isDev = process.env.NODE_ENV === "development"

const result = await esbuild.build({
  entryPoints: ["./src/index.ts"],
  bundle: true,
  outfile: "../../dist/ui/uesio.js",
  allowOverwrite: true,
  write: true,
  tsconfigRaw: {},
  minify: !isDev,
  format: "esm",
  logLevel: isDev ? "debug" : "warning", // defaults to "warning" if not set https://esbuild.github.io/api/#log-level
  metafile: true,
  sourcemap: true,
})

fs.writeFileSync(
  "../../dist/ui/meta.json",
  JSON.stringify(result.metafile, null, 2),
)
