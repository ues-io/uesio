import { load } from "../wire/load"
import { wiretable, TableColumn } from "../print/wiretable"
import inquirer from "inquirer"
import { save, createChange } from "../wire/save"
import { getApp } from "../config/config"
import { throwIfBadFormat } from "../validation/version"
import { User } from "../auth/login"

class Site {
	static getCollectionName(): string {
		return "uesio/studio.site"
	}
	static getFields() {
		return [
			{
				id: "uesio/core.id",
			},
			{
				id: "uesio/studio.name",
			},
			{
				id: "uesio/studio.app",
			},
			{
				id: "uesio/studio.bundle",
			},
		]
	}
	static getColumns(): TableColumn[] {
		return Site.getFields()
	}
	static async list(user: User): Promise<void> {
		const response = await load(this, user)
		wiretable(response.wires[0], response.collections, this.getColumns())
	}
	static async create(user: User): Promise<void> {
		const app = await getApp()

		const responses = await inquirer.prompt([
			{
				name: "name",
				message: "Site Name",
				type: "input",
			},
			{
				name: "version",
				message: "Bundle version (Ex: v0.0.1)",
				type: "input",
			},
		])
		throwIfBadFormat(responses.version)
		await save(
			this,
			user,
			createChange([
				{
					"uesio/studio.name": responses.name,
					"uesio/studio.bundle": {
						"uesio/core.id": `${app}_${responses.version}`,
					},
					"uesio/studio.app": app,
				},
			])
		)
	}
}

export { Site }
