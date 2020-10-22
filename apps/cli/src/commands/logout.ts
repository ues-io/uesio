import { Command } from "@oclif/command"
import { logout } from "../auth/login"

export default class Logout extends Command {
	static description = "log out of uesio"

	async run(): Promise<void> {
		await logout()
		console.log("LOGGED OUT!")
	}
}
