import { load } from "../wire/load"
import { wiretable, TableColumn } from "../print/wiretable"
import inquirer from "inquirer"
import { save, createChange } from "../wire/save"
import { getApp } from "../config/config"

class Workspace {
	static getCollectionName(): string {
		return "studio.workspaces"
	}
	static getFields() {
		return [
			{
				id: "uesio.id",
			},
			{
				id: "studio.name",
			},
		]
	}
	static getColumns(): TableColumn[] {
		return [
			{
				id: "uesio.id",
			},
			{
				id: "studio.name",
			},
		]
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
				message: "Workspace Name",
				type: "input",
			},
		])
		await save(
			this,
			createChange([
				{
					"studio.name": responses.name,
					"studio.appid": app,
				},
			])
		)
	}
}

export { Workspace }
