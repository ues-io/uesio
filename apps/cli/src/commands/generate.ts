import { Command } from "@oclif/command"
import { get, parseJSON, post } from "../request/request"
import { getApp, getWorkspace } from "../config/config"
import { authorize, User } from "../auth/login"
import inquirer from "inquirer"
import unzipper from "unzipper"
import { printWorkspace } from "../print/workspace"
import chalk from "chalk"

type BotParam = {
	name: string
	type: "INPUT" | "METADATA" | "COLOR"
	metadataType: string
	prompt: string
}

const getKeyWithDefault = (
	fullName: string,
	defaultValue: string
): [string, string] => {
	const parts = fullName.split(".")
	if (parts.length === 2) {
		return [parts[0], parts[1]]
	}
	return [defaultValue, parts[0]]
}

const getMetadata = async (
	type: string,
	app: string,
	workspace: string,
	user: User
) => {
	const paramsResponse = await get(
		`workspace/${app}/${workspace}/metadata/types/${type}/namespace/${app}/list`,
		user.cookie
	)
	return paramsResponse
}

const getQuestion = async (
	info: BotParam,
	app: string,
	workspace: string,
	namespace: string,
	user: User
) => {
	switch (info.type) {
		case "METADATA":
			const metadataResponse = await getMetadata(
				info.metadataType,
				app,
				workspace,
				user
			)

			const metadataTypes: Map<string, boolean> = await parseJSON(
				metadataResponse
			)

			return {
				name: info.name,
				message: info.prompt,
				type: "list",
				choices: Object.keys(metadataTypes),
			}

			break
		case "COLOR":
			return {
				name: info.name,
				message: info.prompt,
				type: "list",
				choices: [
					{
						name: chalk.hex("#000000").bold("#000000"),
						value: '"#000000"',
						short: chalk.hex("#000000").bold("#000000"),
					},
					{
						name: chalk.hex("#FF0000").bold("#FF0000"),
						value: '"#FF0000"',
						short: chalk.hex("#FF0000").bold("#FF0000"),
					},
					{
						name: chalk.hex("#008000").bold("#008000"),
						value: '"#008000"',
						short: chalk.hex("#008000").bold("#008000"),
					},
					{
						name: chalk.hex("#FFFF00").bold("#FFFF00"),
						value: '"#FFFF00"',
						short: chalk.hex("#FFFF00").bold("#FFFF00"),
					},
					{
						name: chalk.hex("#FF0000").bold("#FF0000"),
						value: '"#FF0000"',
						short: chalk.hex("#FF0000").bold("#FF0000"),
					},
					{
						name: chalk.hex("#0000FF").bold("#0000FF"),
						value: '"#0000FF"',
						short: chalk.hex("#0000FF").bold("#0000FF"),
					},
					{
						name: chalk.hex("#FFFFFF").bold("#FFFFFF"),
						value: '"#FFFFFF"',
						short: chalk.hex("#FFFFFF").bold("#FFFFFF"),
					},
					{
						name: chalk.hex("#800080").bold("#800080"),
						value: '"#800080"',
						short: chalk.hex("#800080").bold("#800080"),
					},
					{
						name: chalk.hex("#00FF00").bold("#00FF00"),
						value: '"#00FF00"',
						short: chalk.hex("#00FF00").bold("#00FF00"),
					},
					{
						name: chalk.hex("#808080").bold("#808080"),
						value: '"#808080"',
						short: chalk.hex("#808080").bold("#808080"),
					},
				],
			}
			break
		default:
			return {
				name: info.name,
				message: info.prompt,
				type: "input",
			}
	}
}

export default class Generate extends Command {
	static description = "run a generator bot"

	static flags = {}

	static args = [{ name: "generator" }]

	async run(): Promise<void> {
		const { args /*, flags */ } = this.parse(Generate)

		const app = await getApp()
		const workspace = await getWorkspace()
		if (!workspace) {
			printWorkspace(app, workspace)
			return
		}

		const user = await authorize()
		const [namespace, name] = getKeyWithDefault(args.generator, "uesio")

		// Get metadata for the bot.
		const paramsResponse = await get(
			`workspace/${app}/${workspace}/bots/params/generator/${namespace}/${name}`,
			user.cookie
		)

		const paramInfo: BotParam[] = await parseJSON(paramsResponse)

		const questions = await Promise.all(
			paramInfo.map(async (info) =>
				getQuestion(info, app, workspace, namespace, user)
			)
		)

		const paramResponses = await inquirer.prompt(questions)

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
