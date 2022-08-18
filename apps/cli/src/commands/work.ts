import { Command } from "@oclif/command"
import { authorize } from "../auth/login"
import { getMetadataByTypePlural } from "../metadata/metadata"
import { load } from "../wire/load"
import inquirer from "inquirer"
import { getApp, setWorkspace } from "../config/config"
import { printWorkspace } from "../print/workspace"

export default class Work extends Command {
	static description = "set the default workspace"

	static flags = {}

	static args = [{ name: "workspace" }]

	async run(): Promise<void> {
		const { args /*, flags */ } = this.parse(Work)

		const user = await authorize()

		const appName = await getApp()

		let workspaceName = args.workspace

		const workspaces = getMetadataByTypePlural("workspaces")
		const apps = getMetadataByTypePlural("apps")

		// Figure out app ID
		const appResponse = await load(apps, user, [
			{
				field: "uesio/core.uniquekey",
				valueSource: "VALUE",
				value: appName,
				active: true,
			},
		])
		const appData = appResponse.wires[0].data
		if (!appData || !appData.length) {
			throw new Error("No app data found for app: " + appName)
		}
		const appId = `${appData[0]["uesio/core.id"]}`

		// Load app's workspaces
		const response = await load(workspaces, user, [
			{
				field: "uesio/studio.app",
				valueSource: "VALUE",
				value: appId,
				active: true,
			},
		])

		const workspaceList = response.wires[0].data

		if (!workspaceList || !workspaceList.length) {
			throw new Error("No workspaces found for app: " + appName)
		}

		if (workspaceName) {
			// Verify that the workspace specified is available
			const found = workspaceList.some(
				(item) => item["uesio/studio.name"] === workspaceName
			)

			if (!found) {
				throw new Error("Invalid Workspace")
			}
		}

		if (!workspaceName) {
			const responses = await inquirer.prompt([
				{
					name: "workspace",
					message: "Select a Workspace",
					type: "list",
					choices: workspaceList.map((item) => ({
						name: item["uesio/studio.name"],
						value: item["uesio/studio.name"],
					})),
				},
			])

			workspaceName = responses.workspace
		}

		await setWorkspace(workspaceName)
		printWorkspace(appName, workspaceName)
	}
}
