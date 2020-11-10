import { LoadRequestField } from "../wire/loadrequest"
import { load } from "../wire/load"
import { wiretable, TableColumn } from "../print/wiretable"
import inquirer from "inquirer"
import { save, createChange } from "../wire/save"
import { getApp } from "../config/config"

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
			createChange([
				{
					"uesio.site": responses.siteName + "_" + app,
					"uesio.domain": responses.domain,
					"uesio.type": responses.type,
				},
			])
		)
	}
}

export { SiteDomain }
