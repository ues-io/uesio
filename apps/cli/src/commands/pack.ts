import { Command, flags } from "@oclif/command"

import {
	createEntryFiles,
	getWebpackConfig,
	getWebpackComplete,
} from "../pack/pack"
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
		webpack(getWebpackConfig(entries, flags), getWebpackComplete(flags))
	}
}
