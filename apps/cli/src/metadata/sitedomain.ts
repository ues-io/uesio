import { LoadRequestField } from "../wire/loadrequest"
import { load } from "../wire/load"
import { wiretable, TableColumn } from "../print/wiretable"
import inquirer = require("inquirer")
import { save, createChange } from "../wire/save"

class SiteDomain {
	static getCollectionName(): string {
		return "uesio.sitedomains"
	}
	static getFields(): LoadRequestField[] {
		return [
			{
				id: "uesio.id",
			},
			{
				id: "uesio.domain",
			},
			{
				id: "uesio.site",
			},
			{
				id: "uesio.type",
			},
		]
	}
	static getColumns(): TableColumn[] {
		return SiteDomain.getFields()
	}
	static async list(): Promise<void> {
		const response = await load(this)
		wiretable(response.wires[0], response.collections, this.getColumns())
	}
	static async create(): Promise<void> {
		const responses = await inquirer.prompt([
			{
				name: "site",
				message: "BundleDependency for the domain",
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
			}
		])
		await save(
			this,
			createChange([
				{
					"uesio.site": responses.site,
					"uesio.domain": responses.domain,
					"uesio.type": responses.type,
				},
			])
		)
	}
}

export { SiteDomain }
