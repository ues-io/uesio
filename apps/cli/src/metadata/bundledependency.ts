import { LoadRequestField } from "../wire/loadrequest"
import { load } from "../wire/load"
import { wiretable, TableColumn } from "../print/wiretable"
import inquirer from "inquirer"
import { getApp, getWorkspace } from "../config/config"
import { throwIfBadFormat } from "../validation/version"
import { authorize } from "../auth/login"
import { get } from "../request/request"
const UESIO_STUDIO_WORKSPACE = "workspace"
const UESIO_ADD_DEPENDENCY = "metadata/adddependency"
class BundleDependency {
	static getCollectionName(): string {
		return "uesio.bundledependencies"
	}
	static getFields(): LoadRequestField[] {
		return [
			{
				id: "uesio.id",
			},
			{
				id: "uesio.bundlename",
			},
			{
				id: "uesio.bundleversion",
			},
			{
				id: "uesio.workspaceid",
			},
		]
	}
	static getColumns(): TableColumn[] {
		return BundleDependency.getFields()
	}
	static async list(): Promise<void> {
		const response = await load(this)
		wiretable(response.wires[0], response.collections, this.getColumns())
	}
	static async create(): Promise<void> {
		const responses = await inquirer.prompt([
			{
				name: "bundle",
				message: "Bundle Name",
				type: "input",
			},
			{
				name: "version",
				message: "Bundle Version (Ex: v0.0.1)",
				type: "input",
			},
		])
		throwIfBadFormat(responses.version)
		const { cookie } = await authorize()

		const [workspace, app] = await Promise.all([getWorkspace(), getApp()])
		const url = `${UESIO_STUDIO_WORKSPACE}/${app}/${workspace}/${UESIO_ADD_DEPENDENCY}/${responses.bundle}/${responses.version}`
		try {
			const response = await get(url, cookie)
			console.log(await response.text())
		} catch (e) {
			console.log(e)
		}
	}
}

export { BundleDependency }
