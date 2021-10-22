import { Command } from "@oclif/command"
import { get } from "../request/request"
import { getApp, getWorkspace } from "../config/config"
import { authorize } from "../auth/login"
import { rm } from "fs"
import unzipper from "unzipper"
import chalk from "chalk"

export default class Retrieve extends Command {
	static description = "retrieve metadata items"
	static flags = {}
	static args = []

	async run(): Promise<void> {
		const app = await getApp()
		const workspace = await getWorkspace()
		const user = await authorize()

		console.log(
			`Retrieving app: ${chalk.magenta(app)} from workspace ${chalk.green(
				workspace
			)}.`
		)

		rm("bundle", { recursive: true }, () => {
			console.log("Local bundle deleted!")
		})

		const response = await get(
			`workspace/${app}/${workspace}/metadata/retrieve`,
			user.cookie
		)

		response.body
			.pipe(
				unzipper.Extract({
					path: "bundle",
				})
			)
			.on("close", () => {
				console.log("New bundle extracted!")
			})
	}
}
