import { LoadRequestField } from "../wire/loadrequest"
import { load } from "../wire/load"
import { wiretable, TableColumn } from "../print/wiretable"
import inquirer = require("inquirer")
import { save, createChange } from "../wire/save"
import { getApp } from "../config/config"
import { throwIfBadFormat } from "../validation/version"

class Site {
	static getCollectionName(): string {
		return "uesio.sites"
	}
	static getFields(): LoadRequestField[] {
		return [
			{
				id: "uesio.id",
			},
			{
				id: "uesio.name",
			},
			{
				id: "uesio.appref",
			},
			{
				id: "uesio.versionref",
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
					"uesio.name": responses.name,
					"uesio.bundleid": `${app}_${responses.version}`,
					"uesio.appref": app,
					"uesio.versionref": responses.version,
				},
			])
		)
	}
}

export { Site }
