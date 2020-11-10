import { Command, flags } from "@oclif/command"

import {
	createEntryFiles,
	getWebpackConfig,
	getWebpackComplete,
} from "../pack/pack"
import * as webpack from "webpack"

// This is really dumb, but when typescript compiles, module
// paths are not resolved in emitted code. There's a long discussion
// and lots of angry people in this github issue.
// https://github.com/microsoft/TypeScript/issues/10866
// In the end, the typescript people say it's not their job to resolve
// modules and that the aren't going to change it.

// This is a somewhat hack that resolves the module-alias for us so we can
// use the share code in the nx way. We could possibly get rid of this
// if we used webpack in addition to typescript to bundle up the cli commands.
import * as moduleAlias from "module-alias"
moduleAlias.addAlias("@uesio/constants", "../../../../libs/constants/src")

import { metadata } from "@uesio/constants"

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
		console.log(metadata)
		const entries = await createEntryFiles()
		if (!Object.keys(entries).length) {
			console.log("Nothing to pack.")
			return
		}
		webpack(getWebpackConfig(entries, flags), getWebpackComplete(flags))
	}
}
