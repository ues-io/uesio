import { Command } from "@oclif/command"
import { authorize } from "../auth/login"
import { getMetadataByType } from "../metadata/metadata"

export default class Create extends Command {
	static description = "create metadata items"

	static flags = {}

	static args = [{ name: "type" }]

	async run(): Promise<void> {
		const { args /*, flags */ } = this.parse(Create)

		await authorize()

		const metadata = getMetadataByType(args.type)
		await metadata.create()
	}
}
