import { Command } from "@oclif/command"
import { authorize } from "../auth/login"
import { printUser } from "../print/user"

export default class Login extends Command {
	static description = "log in to uesio"

	async run(): Promise<void> {
		const user = await authorize()
		printUser(user)
	}
}
