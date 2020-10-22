import { Command, flags } from "@oclif/command"
import { post } from "../request/request"
import * as fs from "fs"
import { authorize } from "../auth/login"
import { getWorkspace, getApp } from "../config/config"

type Spec = {
	filetype: string
	collection: string
	upsertkey: string
	mappings: {
		[key: string]: {
			fieldname: string
			matchfield?: string
		}
	}
}

async function getSpec(
	specFile?: string,
	collection?: string,
	upsertKey?: string
): Promise<Spec> {
	const spec = specFile
		? JSON.parse(await fs.promises.readFile(specFile, "utf8"))
		: {}

	spec.filetype = "csv"

	if (collection) {
		spec.collection = collection
	}

	if (upsertKey) {
		spec.upsertKey = upsertKey
	}
	return spec
}

export default class Pack extends Command {
	static description = "upsert data"

	static flags = {
		spec: flags.string({ char: "s" }),
		file: flags.string({ char: "f" }),
		collection: flags.string({ char: "c" }),
		upsertkey: flags.string({ char: "u" }),
	}

	static args = []

	async run(): Promise<void> {
		const { flags } = this.parse(Pack)

		if (!flags.file) {
			console.log("No file specified", flags)
			return
		}

		const spec = await getSpec(
			flags.spec,
			flags.collection,
			flags.upsertkey
		)

		if (!spec.collection) {
			console.log("No collection specified", flags)
			return
		}

		const app = await getApp()
		const workspace = await getWorkspace()

		const user = await authorize()

		//const filedata = await fs.readFile(flags.file, "utf8")
		const stream = await fs.createReadStream(flags.file, {
			encoding: "utf8",
		})

		console.log("Upserting...", flags)
		// Start a new job
		const jobResponse = await post(
			`workspace/${app}/${workspace}/bulk/job`,
			JSON.stringify(spec),
			user.cookie
		)
		const jobResponseObj = await jobResponse.json()
		// Create a batch
		const jobId = jobResponseObj.id
		const batchResponse = await post(
			`workspace/${app}/${workspace}/bulk/job/${jobId}/batch`,
			stream,
			user.cookie
		)
		if (batchResponse.status === 200) {
			const batchResponseObj = await batchResponse.json()
			console.log(batchResponseObj.id)
		} else {
			const errorMessage = await batchResponse.text()
			console.log(errorMessage)
		}

		// Poll for status

		// Done
	}
}
