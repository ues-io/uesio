import * as esbuild from "esbuild"
import fs from "node:fs"

const result = await esbuild.build({
  entryPoints: ["./src/index.ts"],
  bundle: true,
  outfile: "../../dist/ui/uesio.js",
  allowOverwrite: true,
  write: true,
  tsconfigRaw: {},
  minify: true,
  format: "esm",
  logLevel: "debug",
  metafile: true,
  sourcemap: true,
})

fs.writeFileSync(
  "../../dist/ui/meta.json",
  JSON.stringify(result.metafile, null, 2),
)
