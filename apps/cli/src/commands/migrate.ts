import { Command } from "@oclif/command"
import { post } from "../request/request"
import { getApp, getWorkspace } from "../config/config"
import { authorize } from "../auth/login"

export default class Migrate extends Command {
	static description = "migrate schema"

	static flags = {}

	static args = []

	async run(): Promise<void> {
		// eslint-disable-next-line no-empty-pattern
		const {
			/*args , flags */
		} = this.parse(Migrate)

		const app = await getApp()
		const workspace = await getWorkspace()

		const user = await authorize()

		const response = await post(
			`workspace/${app}/${workspace}/metadata/migrate`,
			undefined,
			user.cookie
		)

		console.log(response.status, response.statusText)
		console.log(await response.text())
	}
}
