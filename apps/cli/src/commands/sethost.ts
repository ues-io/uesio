import { Command } from "@oclif/command"
import inquirer from "inquirer"
import { setHostUrl, validHosts } from "../config/config"

export default class SetHost extends Command {
	static description = "set the default workspace"

	static flags = {}

	static args = []

	async run(): Promise<void> {
		const responses = await inquirer.prompt([
			{
				name: "hosturl",
				message: "Select a Host URL",
				type: "list",
				choices: validHosts.map((url) => ({
					name: url,
					value: url,
				})),
			},
		])

		await setHostUrl(responses.hosturl)
		console.log("Set Host URL to: " + responses.hosturl)
	}
}
