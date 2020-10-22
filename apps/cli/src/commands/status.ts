import { Command } from "@oclif/command"
import { printUser } from "../print/user"
import { authorize } from "../auth/login"
import { getWorkspace, getApp } from "../config/config"
import { printWorkspace } from "../print/workspace"

export default class Status extends Command {
	static description = "get user and workspace status"

	static flags = {}

	static args = []

	async run(): Promise<void> {
		const app = await getApp()
		const workspace = await getWorkspace()

		const user = await authorize()
		printUser(user)
		if (workspace) {
			printWorkspace(workspace, app)
		} else {
			console.log("No default workspace set.")
		}
	}
}
