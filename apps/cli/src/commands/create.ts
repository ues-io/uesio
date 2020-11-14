import { Command } from "@oclif/command"
import { authorize } from "../auth/login"
import { getMetadataByType, getMetadataMap } from "../metadata/metadata"

export default class Create extends Command {
	static description = "create metadata items"

	static flags = {}

	static args = [{ name: "type" }]

	async run(): Promise<void> {
		const { args /*, flags */ } = this.parse(Create)

		await authorize()

		if (!args.type) {
			const metadataMap = getMetadataMap()
			console.log("Example change")
			console.log("Please specify a type to create.")
			Object.keys(metadataMap).forEach((metadataType) => {
				console.log("create", metadataType)
			})

			return
		}

		const metadata = getMetadataByType(args.type)
		await metadata.create()
	}
}
