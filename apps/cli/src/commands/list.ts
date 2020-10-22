import { Command } from "@oclif/command"
import { authorize } from "../auth/login"
import { getMetadataByTypePlural } from "../metadata/metadata"

export default class List extends Command {
	static description = "list metadata items"

	static flags = {}

	static args = [{ name: "type" }]

	async run(): Promise<void> {
		const { args /*, flags */ } = this.parse(List)

		await authorize()

		const metadata = getMetadataByTypePlural(args.type)
		await metadata.list()
	}
}
