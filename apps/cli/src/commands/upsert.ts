import { Command, flags } from "@oclif/command"
import { post } from "../request/request"
import * as fs from "fs"
import { authorize } from "../auth/login"
import { getWorkspace, getApp } from "../config/config"
import { definition } from "@uesio/ui"

async function getSpec(
	specFile?: string,
	collection?: string,
	upsertKey?: string
): Promise<definition.ImportSpec> {
	const specData = specFile
		? JSON.parse(await fs.promises.readFile(specFile, "utf8"))
		: {}

	const spec: definition.ImportSpec = {
		jobtype: "import",
		filetype: specData["uesio.filetype"] || "csv",
		collection: specData["uesio.collection"],
		upsertkey: specData["uesio.upsertkey"],
		mappings: specData["uesio.mappings"],
	}

	if (collection) {
		spec.collection = collection
	}

	if (upsertKey) {
		spec.upsertkey = upsertKey
	}
	return spec
}

function getSpecString(spec: definition.ImportSpec) {
	return JSON.stringify({
		"uesio.jobtype": spec.jobtype,
		"uesio.filetype": spec.filetype,
		"uesio.collection": spec.collection,
		"uesio.upsertkey": spec.upsertkey,
		"uesio.mappings": spec.mappings,
	})
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
			getSpecString(spec),
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
