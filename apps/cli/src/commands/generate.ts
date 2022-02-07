import { Command } from "@oclif/command"
import { get, post } from "../request/request"
import { getApp, getWorkspace } from "../config/config"
import { authorize } from "../auth/login"
import inquirer from "inquirer"
import unzipper from "unzipper"

type BotParam = {
	name: string
	prompt: string
}

export default class Generate extends Command {
	static description = "run a generator bot"

	static flags = {}

	static args = [{ name: "generator" }]

	async run(): Promise<void> {
		const { args /*, flags */ } = this.parse(Generate)

		const app = await getApp()
		const workspace = await getWorkspace()

		const user = await authorize()

		const [namespace, name] = args.generator.split(".")

		// Get metadata for the bot.
		const paramsResponse = await get(
			`workspace/${app}/${workspace}/bots/params/generator/${namespace}/${name}`,
			user.cookie
		)

		const paramInfo: BotParam[] = await paramsResponse.json()
		console.log(paramInfo)

		const paramResponses = await inquirer.prompt(
			paramInfo.map((info) => ({
				name: info.name,
				message: info.prompt,
				type: "input",
			}))
		)

		const response = await post(
			`workspace/${app}/${workspace}/metadata/generate/${namespace}/${name}`,
			JSON.stringify(paramResponses),
			user.cookie
		)

		if (!response || !response.body) throw new Error("invalid response")

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
