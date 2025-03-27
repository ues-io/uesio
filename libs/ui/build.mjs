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
  // TODO: tsconfigRaw will override use of tsconfig.json.  For backwards compat, leaving this as-is for now
  // but this should likely change to using tsconfig.lib.json here or explicitly providing a configuration
  // to esbuild.  This configuration matches what is done in pack.go BuildOptions so that the ui package
  // and component packs are built with identical configuration.  Since pack is used by outside developers
  // to build their packs, there is something to be said for controlling tsconfig options for all component
  // packs.  As we potentially move to component development in studio, building packs will likely be
  // done on the server so having all packs built by server makes some sense.  Prior to changing the approach
  // on tsconfigRaw, a long term plan/solution should be considered.
  tsconfigRaw: {},
  jsx: "automatic",
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
