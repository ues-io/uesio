import { Command } from "@oclif/command"
import { authorize } from "../auth/login"
import { runGenerator } from "../generate/generate"

export default class Init extends Command {
	static description = "run a generator bot"

	static flags = {}

	static args = []

	async run(): Promise<void> {
		//const { args /*, flags */ } = this.parse(Init)
		const user = await authorize()
		return runGenerator("uesio", "init", user)
	}
}
