import { load } from "../wire/load"
import { wiretable, TableColumn } from "../print/wiretable"
import inquirer from "inquirer"
import { getApp, getWorkspace } from "../config/config"
import { get } from "../request/request"
import { authorize, User } from "../auth/login"
import { throwIfBadFormat } from "../validation/version"

//TODO: probably don't want to leave it this way. :)
const UESIO_STUDIO_WORKSPACE = "workspace"
const UESIO_BUNDLE_CREATE_ENDPOINT = "metadata/storebundle"
class Bundle {
	static getCollectionName(): string {
		return "studio.bundles"
	}
	static getFields() {
		return [
			{
				id: "uesio.id",
			},
			{
				id: "studio.app",
			},
			{
				id: "studio.major",
			},
			{
				id: "studio.minor",
			},
			{
				id: "studio.patch",
			},
		]
	}
	static getColumns(): TableColumn[] {
		return Bundle.getFields()
	}
	static async list(user: User): Promise<void> {
		const response = await load(this, user)
		wiretable(response.wires[0], response.collections, this.getColumns())
	}
	static async create(user: User): Promise<void> {
		const responses = await inquirer.prompt([
			{
				name: "version",
				message: "Bundle Version (Ex: v0.0.1)",
				type: "input",
			},
			{
				name: "description",
				message: "Description",
				type: "input",
			},
		])
		throwIfBadFormat(responses.version)

		const [workspace, app] = await Promise.all([getWorkspace(), getApp()])
		const url = `${UESIO_STUDIO_WORKSPACE}/${app}/${workspace}/${UESIO_BUNDLE_CREATE_ENDPOINT}?version=${responses.version}&description=${responses.description}`
		try {
			const response = await get(url, user.cookie)
			console.log(await response.text())
		} catch (e) {
			console.log(e)
		}
	}
}

export { Bundle }
