import { Command } from "@oclif/command"
import { printUser } from "../print/user"
import { authorize } from "../auth/login"
import { getWorkspace, getApp, getHostUrl } from "../config/config"
import { printWorkspace } from "../print/workspace"
import { printHost } from "../print/host"

export default class Status extends Command {
	static description = "get user and workspace status"

	static flags = {}

	static args = []

	async run(): Promise<void> {
		const hostUrl = await getHostUrl()
		printHost(hostUrl)
		const app = await getApp()
		const workspace = await getWorkspace()
		const user = await authorize()
		printUser(user)
		printWorkspace(app, workspace)
	}
}
