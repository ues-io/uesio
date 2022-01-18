import { Command } from "@oclif/command"
import { get } from "../request/request"
import { getApp, getWorkspace } from "../config/config"
import { authorize } from "../auth/login"
import { rm, readdir } from "fs"
import unzipper from "unzipper"
import chalk from "chalk"
import path from "path"

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

		readdir("bundle", (err, files) => {
			if (err) throw err
			for (const file of files) {
				if (file !== "components") {
					rm(path.join("bundle", file), { recursive: true }, () => {
						console.log("deleting: " + file)
					})
				}
			}
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
