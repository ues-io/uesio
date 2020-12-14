import { Command, flags } from "@oclif/command"
import { promises as fs } from "fs"
import { createEntryFiles, getWebpackConfig } from "../pack/pack"
import * as webpack from "webpack"

export default class Pack extends Command {
	static description = "pack components"

	static flags = {
		develop: flags.boolean({ char: "d" }),
		stats: flags.boolean({ char: "s" }),
	}

	static args = []

	async run(): Promise<void> {
		const { flags } = this.parse(Pack)

		console.log("Packing...")
		const entries = await createEntryFiles()
		if (!Object.keys(entries).length) {
			console.log("Nothing to pack.")
			return
		}
		webpack(getWebpackConfig(entries, flags), (err, stats): void => {
			const dev = flags.develop
			const getStats = flags.stats
			let firstMessage = true
			let firstRebuild = true
			// Stats Object
			if (err) {
				console.error(err.stack || err)
				return
			}

			if (!stats) return

			const info = stats.toJson()

			if (getStats) {
				fs.writeFile("stats.json", JSON.stringify(info))
			}

			if (stats.hasErrors()) {
				info.errors.forEach((message: string) => console.error(message))

				// force the build process to fail upon compilation error
				process.exit(1)
			}
			if (stats.hasWarnings()) {
				info.warnings.forEach((message: string) =>
					console.warn(message)
				)
			}
			if (dev) {
				if (firstMessage) {
					console.log("Done PACKING!")
					firstMessage = false
				} else {
					//There does not seem to be a way in webpack API to detect this initial compilation
					//completed from a watch command - so we have this hacky workaround
					if (firstRebuild) {
						console.log("Watching Pack...")
						firstRebuild = false
					} else {
						console.log("Rebuilt pack")
					}
				}
			} else {
				console.log("Done PACKING!")
			}
			// Done processing
		})
	}
}
