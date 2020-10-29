import { Command } from "@oclif/command"
import * as archiver from "archiver"
import { post } from "../request/request"
import { getApp, getWorkspace } from "../config/config"
import { authorize } from "../auth/login"

export default class Deploy extends Command {
	static description = "deploy metadata items"

	static flags = {}

	static args = []

	async run(): Promise<void> {
		const { args, flags } = this.parse(Deploy)

		const app = await getApp()
		const workspace = await getWorkspace()

		const user = await authorize()

		const archive = archiver("zip", {
			zlib: { level: 9 }, // Sets the compression level.
		})

		// good practice to catch warnings (ie stat failures and other non-blocking errors)
		archive.on("warning", function (err) {
			if (err.code === "ENOENT") {
				// log warning
			} else {
				// throw error
				throw err
			}
		})

		// good practice to catch this error explicitly
		archive.on("error", function (err) {
			throw err
		})

		archive.directory("bundle/", "bundle")

		archive.finalize()

		const response = await post(
			`workspace/${app}/${workspace}/metadata/deploy`,
			archive,
			user.cookie
		)

		console.log(response.status, response.statusText)
		console.log(await response.text())
	}
}
