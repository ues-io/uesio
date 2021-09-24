import { load } from "../wire/load"
import { wiretable, TableColumn } from "../print/wiretable"
import inquirer from "inquirer"
import { save, createChange } from "../wire/save"
import { getApp } from "../config/config"
import { throwIfBadFormat } from "../validation/version"

class Site {
	static getCollectionName(): string {
		return "studio.sites"
	}
	static getFields() {
		return [
			{
				id: "uesio.id",
			},
			{
				id: "studio.name",
			},
			{
				id: "studio.app",
			},
			{
				id: "studio.bundle",
			},
		]
	}
	static getColumns(): TableColumn[] {
		return Site.getFields()
	}
	static async list(): Promise<void> {
		const response = await load(this)
		wiretable(response.wires[0], response.collections, this.getColumns())
	}
	static async create(): Promise<void> {
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
			createChange([
				{
					"studio.name": responses.name,
					"studio.bundle": {
						"uesio.id": `${app}_${responses.version}`,
					},
					"studio.app": app,
				},
			])
		)
	}
}

export { Site }
