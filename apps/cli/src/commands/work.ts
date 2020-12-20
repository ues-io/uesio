import { Command } from "@oclif/command"
import { authorize } from "../auth/login"
import { getMetadataByTypePlural } from "../metadata/metadata"
import { load } from "../wire/load"
import inquirer = require("inquirer")
import { getApp, setWorkspace } from "../config/config"
import { printWorkspace } from "../print/workspace"

export default class Work extends Command {
	static description = "set the default workspace"

	static flags = {}

	static args = [{ name: "workspace" }]

	async run(): Promise<void> {
		const { args /*, flags */ } = this.parse(Work)

		await authorize()

		const app = await getApp()

		let workspaceName = args.workspace

		const workspaces = getMetadataByTypePlural("workspaces")
		const response = await load(workspaces, [
			{
				field: "uesio.appid",
				valuesource: "VALUE",
				value: app,
			},
		])

		const workspaceList = response.wires[0].data

		if (workspaceList.length === 0) {
			throw new Error("No workspaces found for app: " + app)
		}

		if (workspaceName) {
			// Verify that the workspace specified is available
			const found = workspaceList.some(
				(item) => item["uesio.name"] === workspaceName
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
						name: item["uesio.name"],
						value: item["uesio.name"],
					})),
				},
			])

			workspaceName = responses.workspace
		}

		await setWorkspace(workspaceName)
		printWorkspace(workspaceName, app)
	}
}
