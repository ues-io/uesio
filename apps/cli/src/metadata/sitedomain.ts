import { load } from "../wire/load"
import { wiretable, TableColumn } from "../print/wiretable"
import inquirer from "inquirer"
import { save, createChange } from "../wire/save"
import { getApp } from "../config/config"
import { User } from "../auth/login"

class SiteDomain {
	static getCollectionName(): string {
		return "uesio/studio.sitedomain"
	}
	static getFields() {
		return [
			{
				id: "uesio/core.id",
			},
			{
				id: "uesio/studio.domain",
			},
			{
				id: "uesio/studio.site",
			},
			{
				id: "uesio/studio.type",
			},
		]
	}
	static getColumns(): TableColumn[] {
		return SiteDomain.getFields()
	}
	static async list(user: User): Promise<void> {
		const response = await load(this, user)
		wiretable(response.wires[0], response.collections, this.getColumns())
	}
	static async create(user: User): Promise<void> {
		const responses = await inquirer.prompt([
			{
				name: "siteName",
				message: "Site Name",
				type: "input",
			},
			{
				name: "domain",
				message: "Desired domain",
				type: "input",
			},
			{
				name: "type",
				message: "Domain Type (domain/subdomain)",
				type: "input",
			},
		])
		const app = await getApp()

		await save(
			this,
			user,
			createChange([
				{
					"uesio/studio.site": responses.siteName + "_" + app,
					"uesio/studio.domain": responses.domain,
					"uesio/studio.type": responses.type,
				},
			])
		)
	}
}

export { SiteDomain }
