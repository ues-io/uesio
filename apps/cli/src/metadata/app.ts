import { load } from "../wire/load"
import { wiretable, TableColumn } from "../print/wiretable"
import inquirer from "inquirer"
import chalk from "chalk"
import { save, createChange } from "../wire/save"
import { User } from "../auth/login"

const colors = [
	"#003f5c",
	"#2f4b7c",
	"#665191",
	"#a05195",
	"#d45087",
	"#f95d6a",
	"#ff7c43",
	"#ffa600",
]

class App {
	static getCollectionName(): string {
		return "studio.apps"
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
				id: "studio.description",
			},
			{
				id: "studio.color",
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
			{
				id: "studio.description",
			},
			{
				id: "studio.color",
				type: "COLOR",
			},
		]
	}
	static async list(user: User): Promise<void> {
		const response = await load(this, user)
		wiretable(response.wires[0], response.collections, this.getColumns())
	}
	static async create(user: User): Promise<void> {
		const responses = await inquirer.prompt([
			{
				name: "name",
				message: "App Name",
				type: "input",
			},
			{
				name: "description",
				message: "App Description",
				type: "input",
			},
			{
				name: "color",
				message: "App Color",
				type: "list",
				choices: colors.map((color) => ({
					name: chalk.hex(color).bold(color),
					value: color,
				})),
			},
		])
		await save(
			this,
			user,
			createChange([
				{
					"studio.name": responses.name,
					"studio.description": responses.description,
					"studio.color": responses.color,
				},
			])
		)
	}
}

export { App }
