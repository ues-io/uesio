import { Command } from "@oclif/command"
import inquirer from "inquirer"
import { authorize } from "../auth/login"
import unzipper from "unzipper"
import { metadataNameValidator } from "../generate/prompts"
import { post } from "../request/request"
import { getMetadataByTypePlural } from "../metadata/metadata"
import { load } from "../wire/load"
import { createChange, save } from "../wire/save"
import { setActiveWorkspace } from "../config/config"

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
			validate: metadataNameValidator,
		})

		const appMetadata = getMetadataByTypePlural("apps")
		const workspaceMetadata = getMetadataByTypePlural("workspaces")
		const appresponse = await load(appMetadata, user)
		const appNames = appresponse.wires[0].data?.map(
			(app) => app["uesio/studio.name"]
		)

		if (!appNames) {
			throw new Error("Could not query for apps")
		}
		if (!appNames.includes(name)) {
			await save(
				appMetadata,
				user,
				createChange([
					{
						"uesio/studio.name": name,
						"uesio/studio.description": "A new app",
						"uesio/studio.color": "#00FF00",
					},
				])
			)

			const newapp = await load(appMetadata, user, [
				{
					field: "uesio/studio.name",
					valueSource: "VALUE",
					value: name,
					active: true,
				},
			])

			const newappIDResp = newapp.wires[0].data?.map(
				(app) => app["uesio/core.id"]
			)

			if (!newappIDResp || newappIDResp.length !== 1)
				throw new Error("error reading the new application.")

			const newappID = newappIDResp[0] as string

			await save(
				workspaceMetadata,
				user,
				createChange([
					{
						"uesio/studio.name": "dev",
						"uesio/studio.app": newappID,
					},
				])
			)
			await setActiveWorkspace(newappID, "dev")

			const response = await post(
				`version/uesio/core/uesio/core/v0.0.1/metadata/generate/init`,
				JSON.stringify({ name: newappID }),
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
					console.log("New bundle extracted!")
				})
		} else {
			throw new Error("App already initialized")
		}
	}
}
