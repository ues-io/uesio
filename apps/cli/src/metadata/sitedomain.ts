import { load } from "../wire/load"
import { wiretable, TableColumn } from "../print/wiretable"
import inquirer from "inquirer"
import { save, createChange } from "../wire/save"
import { getApp } from "../config/config"

class SiteDomain {
	static getCollectionName(): string {
		return "studio.sitedomains"
	}
	static getFields() {
		return [
			{
				id: "uesio.id",
			},
			{
				id: "studio.domain",
			},
			{
				id: "studio.site",
			},
			{
				id: "studio.type",
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
					"studio.site": responses.siteName + "_" + app,
					"studio.domain": responses.domain,
					"studio.type": responses.type,
				},
			])
		)
	}
}

export { SiteDomain }
