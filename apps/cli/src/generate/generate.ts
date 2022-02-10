import { get, parseJSON, post } from "../request/request"
import { getVersion } from "../config/config"
import { User } from "../auth/login"
import inquirer from "inquirer"
import unzipper from "unzipper"

type BotParam = {
	name: string
	prompt: string
}

const runGenerator = async (namespace: string, name: string, user: User) => {
	const version = await getVersion(namespace)

	// Get metadata for the bot.
	const paramsResponse = await get(
		`version/${namespace}/${version}/bots/params/generator/${name}`,
		user.cookie
	)

	const paramInfo: BotParam[] = await parseJSON(paramsResponse)

	const paramResponses = await inquirer.prompt(
		paramInfo.map((info) => ({
			name: info.name,
			message: info.prompt,
			type: "input",
		}))
	)

	const response = await post(
		`version/${namespace}/${version}/metadata/generate/${name}`,
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

export { runGenerator }
