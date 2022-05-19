import { Command, flags } from "@oclif/command"

import { createEntryFiles } from "../pack/pack"
import esbuild from "esbuild"
import GlobalsPlugin from "esbuild-plugin-globals"

export default class Pack extends Command {
	static description = "pack components"

	static flags = {
		watch: flags.boolean({ char: "w" }),
	}

	static args = []

	async run(): Promise<void> {
		const { flags } = this.parse(Pack)

		console.log("Packing...")
		const entries = await createEntryFiles()
		const entryKeys = Object.keys(entries)
		if (!entryKeys.length) {
			console.log("Nothing to pack.")
			return
		}

		await esbuild.build({
			entryPoints: entryKeys.map(
				(key) => `./bundle/componentpacks/${key}.ts`
			),
			bundle: true,
			outdir: "./bundle/componentpacks",
			outbase: "./bundle/componentpacks",
			allowOverwrite: true,
			external: [
				"react",
				"react-dom",
				"@uesio/ui",
				"yaml",
				"@emotion/css",
			],
			watch: flags.watch,
			plugins: [
				GlobalsPlugin({
					react: "React",
					"react-dom": "ReactDOM",
					"@uesio/ui": "uesio",
					yaml: "yaml",
					"@emotion/css": "emotion",
				}),
			],
			//minify: true,
		})
		console.log("done")
	}
}
