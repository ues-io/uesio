import { Command } from "@oclif/command"
import inquirer from "inquirer"
import { authorize, User } from "../auth/login"
import unzipper from "unzipper"
import path from "path"
import { metadataNameValidator } from "../generate/prompts"
import { post } from "../request/request"
import { getMetadataByTypePlural } from "../metadata/metadata"
import { load } from "../wire/load"
import { createChange, save } from "../wire/save"
import { setActiveWorkspace } from "../config/config"

const getApp = async (user: User, name: string) => {
	const response = await load(getMetadataByTypePlural("apps"), user, [
		{
			field: "uesio/core.id",
			value: user.id + "/" + name,
			valueSource: "VALUE",
			active: true,
		},
	])
	return response.wires[0].data?.length ? response.wires[0].data[0] : null
}

const createApp = async (user: User, name: string) =>
	save(
		getMetadataByTypePlural("apps"),
		user,
		createChange([
			{
				"uesio/studio.name": name,
				"uesio/studio.description": "A new app",
				"uesio/studio.color": "#00FF00",
			},
		])
	)

const getDevWorkspace = async (user: User, appName: string) => {
	const response = await load(getMetadataByTypePlural("workspaces"), user, [
		{
			field: "uesio/core.id",
			value: user.id + "/" + appName + "_dev",
			valueSource: "VALUE",
			active: true,
		},
	])
	return response.wires[0].data?.length ? response.wires[0].data[0] : null
}

const createDevWorkspace = async (user: User, appName: string) =>
	await save(
		getMetadataByTypePlural("workspaces"),
		user,
		createChange([
			{
				"uesio/studio.name": "dev",
				"uesio/studio.app": user.id + "/" + appName,
			},
		])
	)

export default class Init extends Command {
	static description = "run a generator bot"

	static flags = {}

	static args = []

	async run(): Promise<void> {
		//const { args /*, flags */ } = this.parse(Init)
		const user = await authorize()

		const { name } = await inquirer.prompt({
			name: "name",
			message: "App Name",
			type: "input",
			default: path.basename(process.cwd()),
			validate: metadataNameValidator,
		})

		const existingApp = await getApp(user, name)

		if (!existingApp) {
			await createApp(user, name)
		}

		const app = await getApp(user, name)

		if (!app) throw new Error("error creating or getting the app")

		const devWorkspace = await getDevWorkspace(user, name)

		if (!devWorkspace) {
			await createDevWorkspace(user, name)
		}

		const appId = user.id + "/" + name

		await setActiveWorkspace(appId, "dev")

		const response = await post(
			`version/uesio/core/uesio/core/v0.0.1/metadata/generate/init`,
			JSON.stringify({ name: appId }),
			user.cookie
		)

		if (!response || !response.body) throw new Error("invalid response")

		response.body
			.pipe(
				unzipper.Extract({
					path: "",
				})
			)
			.on("close", () => {
				console.log("Initialized App: " + name)
			})
	}
}
