import { Command, flags } from "@oclif/command"
import fs from "fs"
import type { definition, platform } from "@uesio/ui"
import { uploadFiles } from "../upsert/uploadfiles"
import { printWorkspace } from "../print/workspace"
import { authorize } from "../auth/login"
import { getWorkspace, getApp } from "../config/config"
import { post } from "../request/request"
import { BodyInit } from "node-fetch"

export default class Upsert extends Command {
	static description = "upsert data"

	static flags = {
		spec: flags.string({ char: "s" }),
		file: flags.string({ char: "f" }),
		collection: flags.string({ char: "c" }),
	}

	static args = []

	async run(): Promise<void> {
		const { flags } = this.parse(Upsert)

		if (!flags.file) {
			console.log("No file specified", flags)
			return
		}

		const spec: definition.Spec = flags.spec
			? JSON.parse(await fs.promises.readFile(flags.spec, "utf8"))
			: {
					jobtype: "IMPORT",
			  }

		if (flags.collection) {
			spec.collection = flags.collection
		}

		let payload: BodyInit = ""

		if (spec.jobtype === "IMPORT") {
			if (!spec.collection) {
				console.log("No collection specified", spec)
				return
			}
			if (!spec.filetype) {
				spec.filetype = "CSV"
			}

			console.log("Upserting...", flags.file, spec)

			//const filedata = await fs.readFile(flags.file, "utf8")
			payload = fs.createReadStream(flags.file, {
				encoding: "utf8",
			})
		}

		if (spec.jobtype === "UPLOADFILES") {
			payload = await uploadFiles(flags.file, spec)
		}

		if (!payload) {
			throw new Error("Invalid jobtype")
		}

		const app = await getApp()
		const workspace = await getWorkspace()
		if (!workspace) {
			printWorkspace(app, workspace)
			return
		}

		const user = await authorize()

		const jobResponse = await post(
			`workspace/${app}/${workspace}/bulk/job`,
			JSON.stringify(spec),
			user.cookie
		)
		const jobResponseObj =
			(await jobResponse.json()) as platform.JobResponse
		// Create a batch
		const jobId = jobResponseObj.id
		const batchResponse = await post(
			`workspace/${app}/${workspace}/bulk/job/${jobId}/batch`,
			payload,
			user.cookie
		)
		if (batchResponse.status === 200) {
			const batchResponseObj =
				(await batchResponse.json()) as platform.JobResponse
			console.log(batchResponseObj.id)
		} else {
			const errorMessage = await batchResponse.text()
			console.log(errorMessage)
		}
	}
}
