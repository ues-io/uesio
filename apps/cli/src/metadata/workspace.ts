import { load } from "../wire/load"
import { wiretable, TableColumn } from "../print/wiretable"
import inquirer from "inquirer"
import { save, createChange } from "../wire/save"
import { getApp } from "../config/config"
import { User } from "../auth/login"

class Workspace {
	static getCollectionName(): string {
		return "uesio/studio.workspace"
	}
	static getFields() {
		return [
			{
				id: "uesio/core.id",
			},
			{
				id: "uesio/studio.name",
			},
		]
	}
	static getColumns(): TableColumn[] {
		return [
			{
				id: "uesio/core.id",
			},
			{
				id: "uesio/studio.name",
			},
		]
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
				message: "Workspace Name",
				type: "input",
			},
		])
		await save(
			this,
			user,
			createChange([
				{
					"uesio/studio.name": responses.name,
					"uesio/studio.app": app,
				},
			])
		)
	}
}

export { Workspace }
