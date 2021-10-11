import { load } from "../wire/load"
import { wiretable, TableColumn } from "../print/wiretable"
import inquirer from "inquirer"
import { getApp, getWorkspace } from "../config/config"
import { throwIfBadFormat } from "../validation/version"
import { authorize, User } from "../auth/login"
import { get } from "../request/request"
const UESIO_STUDIO_WORKSPACE = "workspace"
const UESIO_ADD_DEPENDENCY = "metadata/adddependency"
class BundleDependency {
	static getCollectionName(): string {
		return "studio.bundledependencies"
	}
	static getFields() {
		return [
			{
				id: "uesio.id",
			},
			{
				id: "studio.bundlename",
			},
			{
				id: "studio.bundleversion",
			},
			{
				id: "studio.workspaceid",
			},
		]
	}
	static getColumns(): TableColumn[] {
		return BundleDependency.getFields()
	}
	static async list(user: User): Promise<void> {
		const response = await load(this, user)
		wiretable(response.wires[0], response.collections, this.getColumns())
	}
	static async create(user: User): Promise<void> {
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

		const [workspace, app] = await Promise.all([getWorkspace(), getApp()])
		const url = `${UESIO_STUDIO_WORKSPACE}/${app}/${workspace}/${UESIO_ADD_DEPENDENCY}/${responses.bundle}/${responses.version}`
		try {
			const response = await get(url, user.cookie)
			console.log(await response.text())
		} catch (e) {
			console.log(e)
		}
	}
}

export { BundleDependency }
